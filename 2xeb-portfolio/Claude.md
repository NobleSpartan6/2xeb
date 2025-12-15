# Claude Code Development Notes

## Debug Mode

To enable verbose console logging during development, add the following to your `.env.local` file:

```
VITE_DEBUG=true
```

This enables debug output for:
- Supabase configuration status
- Authentication state changes
- Admin status checks
- REST API mutations
- Demo mode warnings

The debug logger is defined in `src/lib/debug.ts` and supports:
- `debug.log()` - General debug messages
- `debug.warn()` - Warning messages
- `debug.info()` - Informational messages

**Note:** `console.error()` calls are NOT behind the debug flag as they indicate actual errors that should always be visible.

## Environment Variables

Required for full functionality:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_SUPABASE_FUNCTIONS_URL` - Edge Functions URL

Optional:
- `VITE_DEBUG=true` - Enable debug logging (recommended for development)
