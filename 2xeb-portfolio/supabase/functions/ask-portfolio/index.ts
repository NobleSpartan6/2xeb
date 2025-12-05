import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AskPayload {
  question: string;
  context: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
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

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      console.error("GEMINI_API_KEY not configured");
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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\nUser question: ${payload.question}` }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData: GeminiResponse = await geminiResponse.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse the JSON response from Gemini
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
      JSON.stringify({ answer, projectSlugs }),
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
