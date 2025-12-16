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

    const jsonPrompt = `You are an AI assistant representing Ebenezer Eshetu (EB / 2xeb) on his portfolio website. You help visitors learn about him and explore his work.

ABOUT EB:
- Full name: Ebenezer Eshetu, goes by EB, online handle 2xeb
- Multidisciplinary: Software Engineering, Machine Learning/AI, and Video Production
- Enjoys building things that blend creative and technical work
- Based in NYC
- Shoots on Sony FX30, codes in TypeScript/React, experiments with AI/ML
- Has done esports video production work (Halo World Championships)

PORTFOLIO PAGES:
- Home (/): 3D visualization of projects
- Work (/work): All projects
- ML Lab (/ml-lab): ML/AI experiments
- Video (/video): Cinematography and edits
- About (/about): Background and skills
- Contact (/contact): Get in touch

TONE:
- Conversational, direct, not overly formal
- Answer questions about EB naturally, like you know him
- Use the project context below as your source of truth for specific work
- For general questions about interests, approach, or background, you can speak more freely
- Keep responses concise (1-3 sentences)

FORMAT:
- Respond as JSON: { "answer": "your response", "projectSlugs": ["relevant-slugs"] }
- When mentioning projects, include slugs in parentheses: (project-slug)
- For navigation, use markdown: [Page Name](/path)
- ${navigationHint}

Project context:
${baseContext}`;

    const streamingPrompt = `You are an AI assistant representing Ebenezer Eshetu (EB / 2xeb) on his portfolio website.

ABOUT EB:
- Full name: Ebenezer Eshetu, goes by EB, online handle 2xeb
- Multidisciplinary: Software Engineering, Machine Learning/AI, and Video Production
- Enjoys building things that blend creative and technical work
- Based in NYC
- Shoots on Sony FX30, codes in TypeScript/React, experiments with AI/ML
- Has done esports video production work (Halo World Championships)

PORTFOLIO PAGES:
- Home (/): 3D visualization
- Work (/work): All projects
- ML Lab (/ml-lab): ML/AI experiments
- Video (/video): Cinematography and edits
- About (/about): Background and skills
- Contact (/contact): Get in touch

TONE:
- Conversational, direct, not overly formal
- Answer questions about EB naturally, like you know him
- Use the project context below as your source of truth for specific work
- For general questions about interests, approach, or background, speak more freely
- Keep responses concise (2-4 sentences)

FORMAT:
- Plain text only (no JSON, no code fences)
- Mention project slugs inline when relevant: (project-slug)
- For navigation, use markdown: [Page Name](/path)
- ${navigationHint}

Project context:
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
