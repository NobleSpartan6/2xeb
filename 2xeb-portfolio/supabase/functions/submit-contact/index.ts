import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const NOTIFICATION_EMAIL = "ebenezereshetu@gmail.com";

interface ContactPayload {
  name?: string;
  email?: string;
  message: string;
  reason?: string;
  source_page?: string;
}

async function sendEmailNotification(payload: ContactPayload): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY not set, skipping email notification");
    return;
  }

  const emailHtml = `
    <h2>New Contact Form Submission</h2>
    <p><strong>From:</strong> ${payload.name || "Anonymous"} ${payload.email ? `(${payload.email})` : ""}</p>
    <p><strong>Subject:</strong> ${payload.reason || "General Inquiry"}</p>
    <p><strong>Page:</strong> ${payload.source_page || "Unknown"}</p>
    <hr />
    <p><strong>Message:</strong></p>
    <p>${payload.message.replace(/\n/g, "<br />")}</p>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: "2xeb Portfolio <onboarding@resend.dev>",
      to: [NOTIFICATION_EMAIL],
      subject: `[2xeb Contact] ${payload.reason || "New Message"} from ${payload.name || "Anonymous"}`,
      html: emailHtml,
      reply_to: payload.email || undefined,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("Resend API error:", error);
  }
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
    const payload: ContactPayload = await req.json();

    // Validate required field
    if (!payload.message || payload.message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Basic email validation if provided
    if (payload.email && !payload.email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for insert
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert contact message
    const { error: insertError } = await supabase
      .from("contact_messages")
      .insert({
        name: payload.name?.trim() || null,
        email: payload.email?.trim() || null,
        message: payload.message.trim(),
        reason: payload.reason?.trim() || null,
        source_page: payload.source_page?.trim() || null,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save message" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email notification (non-blocking - don't fail the request if email fails)
    await sendEmailNotification(payload);

    return new Response(
      JSON.stringify({ success: true }),
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
