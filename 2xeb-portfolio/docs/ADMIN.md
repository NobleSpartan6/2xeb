# Admin System Guide

This document explains how to use the admin panel to manage portfolio content.

## Accessing the Admin Panel

1. Navigate to `https://2xeb.com/#/admin` (or `http://localhost:3000/#/admin` locally)
2. Enter your admin email address
3. Click "Send Magic Link"
4. Check your email and click the login link
5. You'll be redirected to the admin dashboard

**Note:** Only pre-registered admin emails can access the panel. Unauthorized emails will receive an error.

## Dashboard

The dashboard provides:
- **Content counts** - Quick stats for projects, experience, case studies
- **Quick actions** - Shortcuts to common tasks
- **Recent activity** - Latest changes from the audit log
- **Security status** - Confirmation that RLS is active

## Managing Content

### Projects

Navigate to **Admin > Projects** to:
- View all portfolio projects
- Create new projects with the "New Project" button
- Edit existing projects by clicking the edit icon
- Delete projects (with confirmation)

**Required fields:**
- Title
- Slug (auto-generated from title)
- Short description
- Primary discipline (SWE, ML, VIDEO, HYBRID)
- Created date

**Optional fields:**
- Long description
- Tags (comma-separated)
- Image URL
- Video URL
- Status (live/wip)
- External link
- Role

### Experience

Navigate to **Admin > Experience** to manage work history:
- Add new positions
- Edit company, role, date range, location
- Add skills (comma-separated)
- Set experience type

### Case Studies

Navigate to **Admin > Case Studies** for detailed project breakdowns:
- Title and slug
- Problem statement
- Solution description
- Tech stack
- Architecture diagram (ASCII/text)
- Lessons learned

### Pages

Navigate to **Admin > Pages** to edit static page content:
- **Home** - Hero title, subtitle, CTA text
- **About** - Name, title, bio, location
- **Contact** - Contact email, heading, subheading

Changes are stored as JSON and can include any fields needed.

## Audit Log

Navigate to **Admin > Audit Log** to view all content changes:
- Filter by table name
- Filter by action type (CREATE, UPDATE, DELETE)
- Expand entries to see old/new data diff
- View IP address and user agent

The audit log is immutable - entries cannot be modified or deleted.

## Data Fallback

If the database is unavailable, the portfolio automatically falls back to static TypeScript files:
- `/src/data/projects.ts`
- `/src/data/timeline.ts`
- `/src/data/caseStudies.ts`

This ensures the public site remains functional even if Supabase is down.

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Save form | `Cmd/Ctrl + Enter` |
| Add tag | `Enter` in tag input |
| Cancel edit | `Escape` |

## Troubleshooting

### "Not authorized" error
- Ensure your email is registered in `admin_users` table
- Check that you're using the correct email
- Magic links expire after 1 hour

### Changes not appearing
- Content uses database by default
- Clear browser cache
- Check browser console for errors

### Session expired
- Sessions last 1 hour
- Click "Send Magic Link" again to re-authenticate

## Security Best Practices

1. **Never share magic links** - They grant full admin access
2. **Log out when done** - Click your email in sidebar and select "Sign Out"
3. **Review audit log regularly** - Check for unexpected changes
4. **Use a secure email** - Magic links are only as secure as your email

## Technical Details

- Admin routes: `/admin/*`
- Auth context: `/src/context/AuthContext.tsx`
- Protected route: `/src/components/admin/ProtectedRoute.tsx`
- Database types: `/src/lib/database.types.ts`
- API client: `/src/lib/supabase.ts`

See `/docs/SECURITY.md` for detailed security architecture.
