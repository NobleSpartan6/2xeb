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

// contact_messages columns are unbounded text, so these are the only caps.
const MAX_LENGTHS: Record<keyof ContactPayload, number> = {
  name: 200,
  email: 320,
  message: 10_000,
  reason: 100,
  source_page: 200,
};

// Returns an error message if any field is not a string or exceeds its cap.
function validateFields(payload: ContactPayload): string | null {
  for (const field of Object.keys(MAX_LENGTHS) as (keyof ContactPayload)[]) {
    // The body is untrusted JSON, so don't rely on the declared types.
    const value: unknown = payload[field];
    if (value === undefined || value === null) continue;
    if (typeof value !== "string") return `Invalid ${field}`;
    if (value.length > MAX_LENGTHS[field]) {
      return `${field} is too long (max ${MAX_LENGTHS[field]} characters)`;
    }
  }
  return null;
}

// Visitor input goes into the notification email's HTML, so escape it first.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendEmailNotification(payload: ContactPayload): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY not set, skipping email notification");
    return;
  }

  const name = escapeHtml(payload.name || "Anonymous");
  const email = payload.email ? `(${escapeHtml(payload.email)})` : "";
  const reason = escapeHtml(payload.reason || "General Inquiry");
  const sourcePage = escapeHtml(payload.source_page || "Unknown");
  const message = escapeHtml(payload.message).replace(/\n/g, "<br />");

  const emailHtml = `
    <h2>New Contact Form Submission</h2>
    <p><strong>From:</strong> ${name} ${email}</p>
    <p><strong>Subject:</strong> ${reason}</p>
    <p><strong>Page:</strong> ${sourcePage}</p>
    <hr />
    <p><strong>Message:</strong></p>
    <p>${message}</p>
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

    const fieldError = validateFields(payload);
    if (fieldError) {
      return new Response(
        JSON.stringify({ error: fieldError }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
