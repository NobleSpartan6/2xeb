# Supabase Directory - CLAUDE.md

This directory contains Supabase Edge Functions for the 2xeb portfolio.

## Project Details

- **Project ID**: `zrawfgpjfkohjaqcfgrd`
- **Project URL**: `https://zrawfgpjfkohjaqcfgrd.supabase.co`
- **Functions URL**: `https://zrawfgpjfkohjaqcfgrd.supabase.co/functions/v1`

## Edge Functions

### submit-contact
Handles contact form submissions. Inserts into `contact_messages` table.

- **Endpoint**: `POST /functions/v1/submit-contact`
- **Input**: `{ name, email, message, reason?, source_page? }`
- **Output**: `{ success: true }` or error

### ask-portfolio
AI assistant for portfolio questions. Uses Gemini API server-side.

- **Endpoint**: `POST /functions/v1/ask-portfolio`
- **Input**: `{ question, context }`
- **Output**: `{ answer, projectSlugs }`
- **Requires**: `GEMINI_API_KEY` secret in Supabase

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
| `GEMINI_API_KEY` | Google Gemini API key for ask-portfolio |

## CORS

All functions include CORS headers for:
- `https://2xeb.com` (production)
- `http://localhost:3000` (development)
