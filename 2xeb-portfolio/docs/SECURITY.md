# Security Architecture

This document outlines the security measures implemented in the 2xeb portfolio admin system.

## Overview

The admin system implements a **defense-in-depth** security model with multiple layers of protection:

1. **Authentication** - Passwordless Magic Link via Supabase Auth
2. **Authorization** - Row Level Security (RLS) on all database tables
3. **Audit Logging** - Immutable trail of all content changes
4. **Rate Limiting** - Protection against abuse

## Authentication

### Magic Link (Passwordless)

- Users authenticate via email magic link
- **PKCE flow** (Proof Key for Code Exchange) for secure SPA token exchange
- No passwords stored or transmitted
- Links expire after 1 hour

### Single Admin Model

- Only pre-registered admin emails can sign in
- `shouldCreateUser: false` prevents new account creation
- Admin status verified against `admin_users` table
- Non-admin authenticated users are immediately signed out

```typescript
// Critical security setting - prevents unauthorized signups
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    shouldCreateUser: false, // SECURITY: Only existing users can sign in
  },
});
```

### Session Security

- 1-hour session lifetime
- 7-day refresh token
- Automatic token refresh
- Session persisted in localStorage (encrypted by Supabase)

## Authorization

### Row Level Security (RLS)

All database tables have RLS enabled with the following policy pattern:

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| Anonymous | ✓ | ✗ | ✗ | ✗ |
| Authenticated (non-admin) | ✓ | ✗ | ✗ | ✗ |
| Authenticated Admin | ✓ | ✓ | ✓ | ✓ |

### Admin Verification

The `is_admin()` function validates admin status at the database level:

```sql
CREATE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

This function is called by all RLS policies for write operations, ensuring authorization cannot be bypassed even if the application code has vulnerabilities.

### Protected Tables

| Table | Public Read | Admin Write | Audit |
|-------|-------------|-------------|-------|
| projects | ✓ | ✓ | ✓ |
| experience | ✓ | ✓ | ✓ |
| case_studies | ✓ | ✓ | ✓ |
| case_study_timeline | ✓ | ✓ | ✓ |
| case_study_results | ✓ | ✓ | ✓ |
| page_content | ✓ | ✓ | ✓ |
| site_index | ✓ | ✓ | ✓ |
| admin_users | Admin only | Migration only | N/A |
| audit_log | Admin only | System only | N/A |

## Audit Logging

### Automatic Logging

Every INSERT, UPDATE, and DELETE operation on content tables is automatically logged:

```sql
CREATE TRIGGER audit_projects
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
```

### Logged Data

| Field | Description |
|-------|-------------|
| id | Unique log entry ID |
| admin_id | User who made the change |
| action | CREATE, UPDATE, or DELETE |
| table_name | Affected table |
| record_id | ID of affected record |
| old_data | Previous state (UPDATE/DELETE) |
| new_data | New state (CREATE/UPDATE) |
| ip_address | Client IP address |
| user_agent | Browser user agent |
| created_at | Timestamp |

### Immutability

- Audit logs cannot be modified or deleted by any user
- Only the system can insert new audit entries
- Provides forensic trail for security review

## Input Validation

### Client-Side

- Zod schemas validate form inputs
- Type-safe form handling with TypeScript

### Server-Side

- PostgreSQL CHECK constraints on enum fields:
  ```sql
  CHECK (primary_discipline IN ('SWE', 'ML', 'VIDEO', 'HYBRID'))
  CHECK (status IN ('live', 'wip'))
  CHECK (action IN ('CREATE', 'UPDATE', 'DELETE'))
  ```
- Parameterized queries (Supabase default) prevent SQL injection
- RLS provides additional validation layer

## Security Headers

Recommended Cloudflare/CDN configuration:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; connect-src 'self' https://*.supabase.co
```

## CORS Configuration

Edge Functions configured to allow only:
- `https://2xeb.com` (production)
- `http://localhost:3000` (development)

## Threat Model

### Mitigated Threats

| Threat | Mitigation |
|--------|------------|
| Unauthorized access | Magic Link + admin whitelist |
| Session hijacking | PKCE flow, secure cookies |
| Privilege escalation | RLS policies, admin verification |
| SQL injection | Parameterized queries |
| XSS | Content Security Policy |
| CSRF | SameSite cookies, origin checking |
| Data tampering | Audit logging |

### Attack Surface

- Public-facing: Portfolio content (read-only)
- Authenticated: Admin panel (after magic link)
- Database: Protected by RLS

## Security Checklist

- [x] Magic Link authentication (no passwords)
- [x] PKCE flow for SPA security
- [x] Single admin model (whitelist)
- [x] Row Level Security on all tables
- [x] Admin verification at database level
- [x] Automatic audit logging
- [x] Immutable audit trail
- [x] SQL injection prevention
- [x] Input validation (client + server)
- [x] Session timeout
- [ ] Rate limiting (client-side implemented, server-side recommended)
- [ ] CSP headers (configure on CDN)

## Incident Response

If suspicious activity is detected:

1. Review audit log for unauthorized changes
2. Check `admin_users` table for unexpected entries
3. Revoke refresh tokens via Supabase Dashboard
4. Review Supabase Auth logs

## Adding New Admins

New admins must be added via database migration (not exposed via API):

```sql
-- After user signs in with magic link for first time
INSERT INTO admin_users (id, email)
SELECT id, email FROM auth.users WHERE email = 'newadmin@example.com';
```

This ensures admin status cannot be granted via application vulnerabilities.
