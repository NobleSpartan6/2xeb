# Admin Pages - CLAUDE.md

Admin pages for the secure content management system.

## Overview

The admin system provides a full CMS for portfolio content with:
- Magic Link authentication (passwordless)
- Row Level Security authorization
- Audit logging for all changes
- Database fallback to static files

## Pages

### AdminLogin.tsx
Login page with magic link authentication.
- Email input with validation
- Success/error states
- Redirects to dashboard after auth callback

### AuthCallback.tsx
Handles magic link redirect.
- Exchanges tokens for session
- Verifies admin status
- Updates last_login timestamp
- Redirects to dashboard or login with error

### AdminDashboard.tsx
Main dashboard showing:
- Content counts (projects, experience, case studies, contact messages)
- Quick actions (add project, add experience, edit pages)
- Recent audit log entries
- Security status notice

### ProjectsEditor.tsx
CRUD interface for projects.
- DataTable with search and sort
- Form with all project fields
- Tag input with autocomplete
- Slug auto-generation
- Image/video URL preview

### ExperienceEditor.tsx
CRUD interface for work history.
- Company, role, date range, location
- Skills array input
- Experience type selector
- Sort order for display priority

### CaseStudiesEditor.tsx
CRUD interface for detailed project breakdowns.
- Problem/solution text areas
- Tech stack array
- Architecture diagram (ASCII)
- Lessons learned array

### PagesEditor.tsx
JSONB content editor for static pages.
- Tabbed interface (Home, About, Contact)
- Dynamic field types (text, textarea)
- JSON preview panel
- Upsert logic (create or update)

### AuditLogViewer.tsx
Read-only log of all content changes.
- Filter by table and action
- Expandable rows with old/new data diff
- Metadata (IP, user agent, timestamp)
- Immutable (cannot be modified)

### ResetPassword.tsx
Password reset page for admin users.
- Shown after PASSWORD_RECOVERY auth event
- Password/confirm password fields with validation
- Minimum 6 characters
- Signs out and redirects to login after success

### PublishContent.tsx
Generates TypeScript files from database content.
- Fetches projects and experience from database
- Generates `projects.ts` and `timeline.ts` content
- Copy-to-clipboard for easy export
- Used for deploying static content

## Components

Located in `/src/components/admin/`:

### AdminLayout.tsx
Wrapper layout with:
- Sidebar navigation
- Top bar with user info
- Mobile-responsive drawer
- Sign out functionality

### ProtectedRoute.tsx
Route guard that:
- Checks authentication state
- Verifies admin status
- Redirects to login if unauthorized
- Shows loading spinner during auth check

### DataTable.tsx
Reusable table component with:
- Generic typing for any data shape
- Search/filter
- Sort by column
- Edit/delete actions
- Delete confirmation modal

## Context

### AuthContext (in /src/context/)
Provides:
- `user` - Supabase user object
- `session` - Current session
- `isAdmin` - Boolean admin status
- `isLoading` - Auth state loading
- `signInWithMagicLink(email)` - Request magic link
- `signOut()` - Sign out and clear session

## Security

See `/docs/SECURITY.md` for full architecture.

Key points:
- Magic Link only (no passwords)
- `shouldCreateUser: false` prevents signups
- RLS policies at database level
- `is_admin()` function for authorization
- Audit triggers on all content tables

## Design Language

Matches portfolio design:
- Colors: `#2563EB` primary, `#0A0A0A` backgrounds
- Typography: `font-space-grotesk` headings, `font-mono` body
- Borders: `#262626`, `#1f2937`
- "EB" block branding (no generic icons)

## Route Structure

```
/admin
├── /login          - AdminLogin (public)
├── /auth/callback  - AuthCallback (public)
├── /reset-password - ResetPassword (protected)
└── /* (protected)
    ├── /           - AdminDashboard
    ├── /projects   - ProjectsEditor
    ├── /experience - ExperienceEditor
    ├── /case-studies - CaseStudiesEditor
    ├── /pages      - PagesEditor
    ├── /audit      - AuditLogViewer
    └── /publish    - PublishContent
```

## Data Flow

```
User Action → Form State → Supabase Client → RLS Check → Database
                                                  ↓
                                         Audit Trigger → audit_log table
```

## Error Handling

- Form validation with required fields
- API error messages displayed in UI
- Fallback to static data if database unavailable
- Console logging for debugging
