# Lib Directory - CLAUDE.md

Utility functions, API helpers, and TypeScript types.

## Files

### models.ts
Centralized LLM model configuration with rate limiting.

**Available Models:**
| Model ID | Name | Provider | Daily Limit | Best For |
|----------|------|----------|-------------|----------|
| `llama-3.1-8b-instant` | Llama 3.1 8B | Groq | 14,400 | Fast Q&A |
| `llama-3.1-70b-versatile` | Llama 3.1 70B | Groq | 1,000 | Balanced performance |
| `llama-3.3-70b-versatile` | Llama 3.3 70B | Groq | 1,000 | Complex reasoning (default) |

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
  modelId?: string  // Defaults to 'llama-3.1-8b-instant'
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

### geminiService.ts (Deprecated)
Legacy Gemini client-side service. **Do not use** - AI calls should go through Edge Functions via `api.ts`.

## Guardrails Against Abuse

1. **Client-side rate limiting** in `models.ts`
   - Prevents rapid-fire requests (2s cooldown)
   - Enforces RPM and daily limits with safety buffer

2. **Server-side model validation** in Edge Function
   - Only allows whitelisted model IDs
   - Falls back to default if invalid model requested

3. **Free tier limits** respected
   - Uses 80-90% of limits as buffer
   - Defaults to high-limit model (8B)
