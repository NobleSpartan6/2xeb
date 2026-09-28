# Lib Directory - CLAUDE.md

Utility functions, API helpers, and TypeScript types.

## Files

### models.ts
Centralized LLM model configuration with rate limiting. **Groq only** (no Gemini).
Each model also carries a `shortName` (e.g. `20B`, `Qwen`) used by the chat
widget's segmented model control on narrow viewports.

**Available Models** (Groq retired its Llama lineup mid-2026):
| Model ID | Name | Provider | Daily Limit | RPM | Category |
|----------|------|----------|-------------|-----|----------|
| `openai/gpt-oss-20b` | GPT-OSS 20B | Groq | 1,000 | 30 | fast |
| `qwen/qwen3.6-27b` | Qwen 3.6 27B | Groq | 1,000 | 30 | balanced |
| `openai/gpt-oss-120b` | GPT-OSS 120B | Groq | 1,000 | 30 | powerful (default) |

**Default Model:** `openai/gpt-oss-120b`

Keep this list in sync with `ALLOWED_GROQ_MODELS` in `supabase/functions/ask-portfolio/index.ts`.

**Cerebras Fallback:** when Groq returns 429, the Edge Function retries on Cerebras `gpt-oss-120b` (`CEREBRAS_FALLBACK_MODEL_ID`). It is server-side only and not user-selectable; responses that used it report `provider: 'cerebras'` (`LLMProvider` in `api.ts` covers both).

**Rate Limiting (Client-Side):**
- 2 second cooldown between requests
- 80% of RPM limit used as buffer
- 90% of daily limit used as buffer
- Stored in localStorage, resets daily

```typescript
import { MODELS, getModelByIdOrDefault, checkRateLimit, recordRequest } from './models';

// Check before request
const check = checkRateLimit(modelId);
if (!check.allowed) {
  throw new Error(check.reason);
}

// Record after successful request
recordRequest();
```

### api.ts
Supabase Edge Function API helpers.

**Functions:**

#### `askPortfolio(question, context, modelId?)`
```typescript
askPortfolio(
  question: string,
  context: string,
  modelId?: string  // Defaults to DEFAULT_MODEL_ID ('openai/gpt-oss-120b')
): Promise<AskPortfolioResponse>
```

- Includes client-side rate limiting
- Sends model ID to Edge Function
- Returns `{ answer, projectSlugs, model, provider }`

#### `submitContact(payload)`
Submits contact form to Edge Function + sends email notification.

### types.ts
TypeScript interfaces used across the app.

**Key Types:**
- `Project` - Project data structure
- `ChatMessage` - Chat message with role, text, referencedSlugs
- `Discipline` - 'SWE' | 'ML' | 'VIDEO' | 'HYBRID'
- `ConsoleLane` - 'DESIGN' | 'CODE' | 'VISION'

### debug.ts
Debug utilities for development. Contains logging helpers and conditional debug output.

## Guardrails Against Abuse

1. **Client-side rate limiting** in `models.ts`
   - Prevents rapid-fire requests (2s cooldown)
   - Enforces RPM and daily limits with safety buffer

2. **Server-side model validation** in Edge Function
   - Only allows whitelisted model IDs
   - Falls back to default if invalid model requested

3. **Free tier limits** respected
   - Uses 80-90% of limits as buffer
