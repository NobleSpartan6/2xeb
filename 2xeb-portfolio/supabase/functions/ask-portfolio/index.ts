import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Provider = "groq";

// Allowed Groq models (free tier)
const ALLOWED_GROQ_MODELS = [
  "llama-3.1-8b-instant",
  "llama-3.1-70b-versatile",
  "llama-3.3-70b-versatile",
];

const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";


function extractSlugsFromContext(context: string): string[] {
  const slugs = new Set<string>();
  context.split("\n").forEach((line) => {
    const match = line.match(/\(([^)]+)\)/);
    if (match && match[1] && !match[1].includes("/")) {
      slugs.add(match[1]);
    }
  });
  return Array.from(slugs);
}

function findSlugsInText(text: string, known: string[]): string[] {
  const lower = text.toLowerCase();
  return known.filter((slug) => lower.includes(slug.toLowerCase()));
}

interface AskPayload {
  question: string;
  context: string;
  model?: string;      // Specific model ID
  provider?: Provider; // 'groq'
  stream?: boolean;    // Enable SSE streaming
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

// Groq streaming API - returns a ReadableStream for SSE
async function callGroqStreaming(
  prompt: string,
  userQuestion: string,
  modelId: string,
  corsHeaders: Record<string, string>,
  knownSlugs: string[]
): Promise<Response> {
  const apiKey = Deno.env.get("GROQ_API_KEY");
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured");
  }

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
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    const errorText = await response.text();
    console.error("Groq streaming error:", errorText);
    throw new Error("Groq streaming error");
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let fullText = "";

  const transformStream = new TransformStream({
    async transform(chunk, controller) {
      const text = decoder.decode(chunk);
      const lines = text.split("\n").filter((line) => line.trim().startsWith("data:"));
 
      for (const line of lines) {
        const data = line.replace("data:", "").trim();
        if (data === "[DONE]") {
          const slugs = findSlugsInText(fullText, knownSlugs);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, projectSlugs: slugs, model: safeModel, provider: "groq" })}\n\n`
            )
          );
          controller.terminate();
          return;
        }
 
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || "";
          if (content) {
            fullText += content;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: content })}\n\n`));
          }
        } catch {
          // Ignore parse errors
        }
      }
    },
  });

  return new Response(response.body.pipeThrough(transformStream), {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

// Determine which provider to use (Groq only)
function selectProvider(requestedProvider?: Provider): Provider {
  const hasGroq = !!Deno.env.get("GROQ_API_KEY");

  // If specific provider requested and available, use it
  if (requestedProvider === "groq" && hasGroq) return "groq";

  // Default to Groq
  if (hasGroq) return "groq";

  throw new Error("No LLM provider configured. Set GROQ_API_KEY.");
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

    const baseContext = payload.context || "No context provided.";
    const navigationHint = `When the user asks about navigation, contacting, or how the site works, suggest relevant pages using markdown links like [Contact](/contact) or [Case Study](/work/portfolio-console).`;

    const jsonPrompt = `You are "EB", an AI assistant for Ebenezer Eshetu's (2xeb) portfolio website. You help visitors explore his work across Software Engineering, Machine Learning/AI, and Video Production.

ABOUT EBENEZER:
- Full name: Ebenezer Eshetu
- Online handle: 2xeb
- Works across three main disciplines: Software Engineering (SWE), Machine Learning/AI (ML), and Video Production
- Creates hybrid projects that combine multiple disciplines
- Portfolio features a 3D console visualization built with React Three Fiber
- Uses modern web technologies, AI/ML tools, and professional video equipment (Sony FX30)

PORTFOLIO STRUCTURE:
- Home (/): 3D console visualization of all projects
- Work (/work): All projects across all disciplines
- ML Lab (/ml-lab): Machine learning and AI projects
- Video (/video): Cinematography and video production work with featured reel section
- About (/about): Background, skills, and experience
- Contact (/contact): Get in touch form

KEY PROJECTS:
- Midimix: An experimental AI tool for music production, currently in development
- Portfolio Console: The 3D portfolio site itself, built with React Three Fiber, Supabase, TypeScript
- Various video projects including cinematic reels, music videos, event recaps, and gaming montages

RULES:
1. Be concise, professional, and helpful (1-3 sentences for JSON responses)
2. Only reference projects that exist in the provided context
3. If asked about something not in the context, politely say you don't have that information
4. When mentioning projects, include their slugs in parentheses like (portfolio-slug)
5. For navigation questions, use markdown links: [Page Name](/path)
6. Format your response as JSON with two fields:
   - "answer": Your text response
   - "projectSlugs": Array of project slugs mentioned (empty array if none)
7. ${navigationHint}

Context about the portfolio:
${baseContext}`;

    const streamingPrompt = `You are "EB", an AI assistant for Ebenezer Eshetu's (2xeb) portfolio website. You help visitors explore his work across Software Engineering, Machine Learning/AI, and Video Production.

ABOUT EBENEZER:
- Full name: Ebenezer Eshetu, online handle: 2xeb
- Works across Software Engineering (SWE), Machine Learning/AI (ML), and Video Production
- Creates hybrid projects combining multiple disciplines
- Portfolio features a 3D console visualization built with React Three Fiber

PORTFOLIO STRUCTURE:
- Home (/): 3D console visualization
- Work (/work): All projects
- ML Lab (/ml-lab): ML/AI projects
- Video (/video): Video work with featured reel section
- About (/about): Background and skills
- Contact (/contact): Contact form

RULES:
- Respond in plain text (no JSON, no code fences)
- Keep it concise (2-4 sentences)
- Mention relevant project slugs inline when useful: (project-slug)
- For navigation, use markdown links: [Page Name](/path)
- ${navigationHint}

Context about the portfolio:
${baseContext}`;

    // Determine model to use
    const modelId = payload.model || DEFAULT_GROQ_MODEL;

    // Handle streaming request (Groq only)
    if (payload.stream && provider === "groq") {
      try {
        const knownSlugs = extractSlugsFromContext(baseContext);
        return await callGroqStreaming(streamingPrompt, payload.question, modelId, corsHeaders, knownSlugs);
      } catch (err) {
        console.error("Groq streaming error:", err);
        return new Response(
          JSON.stringify({ error: "AI streaming error" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Call Groq (non-streaming)
    let rawText: string;
    try {
      rawText = await callGroq(jsonPrompt, payload.question, modelId);
    } catch (err) {
      console.error("Groq error:", err);
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
