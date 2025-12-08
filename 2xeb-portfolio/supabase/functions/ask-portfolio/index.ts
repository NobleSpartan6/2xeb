import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Provider = "groq" | "gemini";

// Allowed Groq models (free tier)
const ALLOWED_GROQ_MODELS = [
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
];

const DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant";

interface AskPayload {
  question: string;
  context: string;
  model?: string;      // Specific model ID
  provider?: Provider; // 'groq' or 'gemini'
}

interface LLMResponse {
  answer: string;
  projectSlugs: string[];
}

// Groq API (OpenAI-compatible)
async function callGroq(prompt: string, userQuestion: string, modelId: string): Promise<string> {
  const apiKey = Deno.env.get("GROQ_API_KEY");
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured");
  }

  // Validate model is allowed (security: prevent arbitrary model injection)
  const safeModel = ALLOWED_GROQ_MODELS.includes(modelId) ? modelId : DEFAULT_GROQ_MODEL;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: safeModel,
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: userQuestion },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Groq API error:", errorText);
    throw new Error("Groq API error");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// Gemini API
async function callGemini(prompt: string, userQuestion: string): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${prompt}\n\nUser question: ${userQuestion}` }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", errorText);
    throw new Error("Gemini API error");
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// Determine which provider to use based on available keys and request
function selectProvider(requestedProvider?: Provider): Provider {
  const hasGroq = !!Deno.env.get("GROQ_API_KEY");
  const hasGemini = !!Deno.env.get("GEMINI_API_KEY");

  // If specific provider requested and available, use it
  if (requestedProvider === "gemini" && hasGemini) return "gemini";
  if (requestedProvider === "groq" && hasGroq) return "groq";

  // Default priority: Groq > Gemini
  if (hasGroq) return "groq";
  if (hasGemini) return "gemini";

  throw new Error("No LLM provider configured. Set GROQ_API_KEY or GEMINI_API_KEY.");
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const payload: AskPayload = await req.json();

    if (!payload.question || payload.question.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Question is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Select provider
    let provider: Provider;
    try {
      provider = selectProvider(payload.provider);
    } catch (err) {
      console.error(err);
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an AI assistant for Ebenezer Eshetu's (2xeb) portfolio website. Answer questions about his work, skills, and experience based on the provided context.

Rules:
1. Be concise and professional
2. Only reference projects that exist in the context
3. If asked about something not in the context, say you don't have that information
4. When mentioning projects, include their slugs in your response
5. Format your response as JSON with two fields:
   - "answer": Your text response (1-3 sentences)
   - "projectSlugs": Array of project slugs mentioned (empty array if none)

Context about the portfolio:
${payload.context || "No context provided."}`;

    // Determine model to use
    const modelId = payload.model || DEFAULT_GROQ_MODEL;

    // Call the selected provider
    let rawText: string;
    try {
      if (provider === "groq") {
        rawText = await callGroq(systemPrompt, payload.question, modelId);
      } else {
        rawText = await callGemini(systemPrompt, payload.question);
      }
    } catch (err) {
      console.error(`${provider} error:`, err);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON response
    let answer = "I couldn't process that question. Please try again.";
    let projectSlugs: string[] = [];

    try {
      const parsed = JSON.parse(rawText);
      answer = parsed.answer || answer;
      projectSlugs = Array.isArray(parsed.projectSlugs) ? parsed.projectSlugs : [];
    } catch {
      // If JSON parsing fails, use raw text as answer
      answer = rawText || answer;
    }

    return new Response(
      JSON.stringify({ answer, projectSlugs, model: modelId, provider }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
