# Claude Code Development Notes

## Project Overview

This is a full-stack portfolio platform built with React 19, TypeScript, React Three Fiber, and Supabase. It features:
- **3D Spatial Interface**: Three distinct WebGL scenes optimized for different use cases
- **AI Assistant**: Multi-model LLM integration (Groq, Gemini) with streaming responses
- **Admin CMS**: Full CRUD interface with authentication, RLS, and audit logging
- **Hybrid Content**: Static TypeScript modules + optional Supabase database backend
- **Performance Optimized**: <200KB bundle, 60fps on mobile, code splitting
- **Production Ready**: Deployed to Cloudflare Pages with security headers

## Architecture Highlights

### Content Management
- **Static Data**: `/src/data/` contains TypeScript modules (projects.ts, timeline.ts, graph.ts, caseStudies.ts)
- **Database Backend**: Optional Supabase tables for admin CMS (projects, experience, case_studies, pages)
- **Hybrid Approach**: Public content uses static files; admin can manage via database

### 3D Scenes
- **ImmersiveScene**: Full-screen home page with discipline-based agent movement (40×40 grid, 24×24 mobile)
- **SystemConsoleScene**: Isometric project browser with graph-based connections
- **OrbitScene**: Animated background grid for secondary pages
- All use InstancedMesh for performance optimization

### AI Integration
- **Multi-Provider**: Supports Groq (Llama 3.1/3.3) and Gemini 2.0 Flash
- **Streaming**: SSE streaming for real-time token rendering
- **Rate Limiting**: Client-side rate limiting with localStorage persistence
- **Context Building**: Dynamic context from static project data

### Security
- **Authentication**: Magic link authentication via Supabase Auth
- **Authorization**: Row Level Security (RLS) policies at database level
- **Audit Logging**: All content changes logged with metadata (IP, user agent, timestamp)
- **Security Headers**: Configured in Cloudflare Pages

### Performance
- **Code Splitting**: React.lazy() for admin routes
- **Bundle Size**: <200KB gzipped JavaScript
- **Frame Rate**: 60fps on iPhone 12+ devices
- **Time to Interactive**: <2s on throttled 3G

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

## Key Directories

- `/src/data/` - Static TypeScript content modules
- `/src/3d/` - React Three Fiber 3D scenes
- `/src/components/` - Reusable UI components
- `/src/pages/admin/` - Admin CMS pages (protected routes)
- `/src/context/` - React Context providers (ConsoleContext, AuthContext)
- `/src/lib/` - Utilities, API helpers, types
- `/supabase/functions/` - Edge Functions (ask-portfolio, submit-contact, spotify-now-playing)

## Documentation

See individual CLAUDE.md files in subdirectories for detailed documentation:
- `/src/components/CLAUDE.md` - Component documentation
- `/src/3d/CLAUDE.md` - 3D scene architecture
- `/src/pages/admin/CLAUDE.md` - Admin CMS system
- `/src/context/CLAUDE.md` - Context providers
- `/src/lib/CLAUDE.md` - Library utilities
- `/supabase/CLAUDE.md` - Edge Functions

## Deployment

- **Platform**: Cloudflare Pages
- **Routing**: HashRouter for SPA routing
- **Build**: Vite production build
- **Edge Functions**: Supabase Edge Functions (deployed separately)
- **Security**: Headers configured in Cloudflare Pages settings
