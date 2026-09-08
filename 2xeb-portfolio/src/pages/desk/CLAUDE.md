# Desk — CLAUDE.md

The writing surface for the Log (`/log`). Lives at `/desk`, outside the
portfolio's nav and HUD. Built for a phone first.

## Files

- `Desk.tsx` — route shell. Shows `SignIn` until a desk session exists, then a
  minimal header (Desk / Log ↗ / Sign out) and nested routes: `/desk` (list),
  `/desk/new` and `/desk/:id` (editor, one route so a new piece can take its
  id without remounting).
- `SignIn.tsx` — email + password against Supabase Auth via `lib/session.ts`.
  Only `admin_users` accounts get through. The terminal's `login` command is
  the other door and lands in the same session.
- `DeskList.tsx` — pieces grouped Drafts / Link only / Published, newest edit first.
- `DeskEditor.tsx` — the composer. See "How saving works".

## How saving works

- **Drafts autosave** (`hooks/useAutosave.ts`): 1.5s after the last keystroke,
  single-flight, retries with backoff, retries immediately on `online`.
  A new piece is created on its first autosave; the URL swaps to `/desk/<id>`.
- **Public pieces (Link only / Published) do not autosave.** Edits wait for the
  explicit Save button so a half-finished sentence never goes live.
- **Changing visibility saves everything at once** (the segmented control in
  the action bar). Publishing an empty body is refused.
- **Local mirror**: title + body are also written to `localStorage`
  (`2xeb.desk.mirror.<id|new>`) whenever they differ from the saved copy, and
  cleared on a successful save. On open, a newer mirror offers Restore / Discard.
- On `visibilitychange`/`pagehide` a keepalive flush runs; `beforeunload`
  warns when something would be lost.
- Slugs derive from the title while a piece is a draft and the address has not
  been edited by hand. Once public, the address is frozen unless edited.
  An empty slug is never sent — the database names untitled pieces by date.

## Constraints

- Every input is ≥16px (`.desk-input`) — iOS zooms smaller fields on focus.
- No `@supabase/supabase-js` here. Reads/writes go through `lib/log.ts` →
  `lib/supabaseRest.ts` with the session token from `lib/session.ts`.
- Markdown rendering (`lib/markdown.ts`: marked + DOMPurify) is only imported
  by desk/log routes; keep it out of the main bundle.
- Match the site's language: square corners, hairline `#262626` borders, mono
  uppercase labels, one blue.
