# Supabase Directory - CLAUDE.md

This directory contains Supabase Edge Functions for the 2xeb portfolio.

## Project Details

- **Project ID**: `zrawfgpjfkohjaqcfgrd`
- **Project URL**: `https://zrawfgpjfkohjaqcfgrd.supabase.co`
- **Functions URL**: `https://zrawfgpjfkohjaqcfgrd.supabase.co/functions/v1`

## Edge Functions

### submit-contact
Handles contact form submissions. Inserts into `contact_messages` table and sends email notification via Resend.

- **Endpoint**: `POST /functions/v1/submit-contact`
- **Input**: `{ name, email, message, reason?, source_page? }`
- **Output**: `{ success: true }` or error
- **Email**: Sends notification to email (requires `RESEND_API_KEY`)

### ask-portfolio
AI assistant for portfolio questions. **Groq primary, Cerebras 429 fallback**, with optional SSE streaming.

- **Endpoint**: `POST /functions/v1/ask-portfolio`
- **Input**: `{ question, context, model?, stream? }`
  - `model`: Specific model ID (e.g., `"llama-3.1-8b-instant"`)
  - `stream`: `true` for SSE streaming
- **Output (non-streaming)**: `{ answer, projectSlugs, model, provider }`
- **Prompting**: Streaming uses a plain-text prompt (no JSON) to avoid flashing; non-stream uses `response_format: json_object`
- **Output (streaming)**: SSE with `data: { chunk }` tokens (plain text), final `data: { done: true, projectSlugs, model, provider }`
- **Available Models**:
  | Model ID | Daily Limit | Default |
  |----------|-------------|---------|
  | `llama-3.1-8b-instant` | 14,400 | No |
  | `meta-llama/llama-4-scout-17b-16e-instruct` | 1,000 | **Yes** |
  | `llama-3.3-70b-versatile` | 1,000 | No |
  | `openai/gpt-oss-120b` | 1,000 | No |
- **Reasoning models**: `gpt-oss` models get `reasoning_effort: "low"` so chat replies stay snappy
- **Fallback**: if Groq responds 429 (rate limit) and `CEREBRAS_API_KEY` is set, the request is retried once against Cerebras (`https://api.cerebras.ai/v1/chat/completions`, OpenAI-compatible) with `gpt-oss-120b` — Cerebras's only production free-tier model, the same open weights as Groq's `openai/gpt-oss-120b`. Works for both streaming and JSON modes; the response/metadata event then reports `provider: "cerebras"` and the Cerebras model ID. If Groq isn't configured at all, Cerebras is used directly.
- **Security**: Server validates model ID against whitelist (ALLOWED_GROQ_MODELS); the Cerebras fallback model is fixed server-side (never client-chosen)
- **Requires**: `GROQ_API_KEY` secret (`CEREBRAS_API_KEY` optional, enables fallback)

### spotify-now-playing
Returns current Spotify playback status for display in portfolio header.

- **Endpoint**: `GET /functions/v1/spotify-now-playing`
- **Output**: `{ isPlaying, track?, artist?, album?, albumArt? }`
- **Auth**: Uses OAuth refresh token (no user auth required)
- **Requires**: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` secrets
- **Deployed with**: `--no-verify-jwt` (public read-only endpoint)

## Database Schema

### contact_messages
```sql
create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  message text not null,
  reason text,
  source_page text,
  created_at timestamptz default now()
);
```

RLS: Anonymous INSERT only (no SELECT/UPDATE/DELETE for public).

## Local Development

```bash
# Start Supabase locally (requires Docker)
supabase start

# Serve functions locally
supabase functions serve

# Deploy a function
supabase functions deploy submit-contact
supabase functions deploy ask-portfolio
```

## Environment Variables

Edge Functions require these secrets (set in Supabase Dashboard > Project Settings > Edge Functions):

| Secret | Description |
|--------|-------------|
| `GROQ_API_KEY` | Groq API key for ask-portfolio (required) |
| `CEREBRAS_API_KEY` | Cerebras API key — optional, enables free 429 fallback for ask-portfolio |
| `RESEND_API_KEY` | Resend API key for email notifications (submit-contact) |
| `SPOTIFY_CLIENT_ID` | Spotify app client ID (spotify-now-playing) |
| `SPOTIFY_CLIENT_SECRET` | Spotify app client secret (spotify-now-playing) |
| `SPOTIFY_REFRESH_TOKEN` | OAuth refresh token for user's Spotify account |

## CORS

All functions include CORS headers for:
- `https://2xeb.com` (production)
- `http://localhost:3000` (development)
