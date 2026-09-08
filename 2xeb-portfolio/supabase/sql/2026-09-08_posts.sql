-- The Log: short writing, drafted from a phone, published instantly.
-- Run once in Supabase Dashboard > SQL editor. Idempotent where practical.
--
-- Relies on two things the project already has:
--   public.is_admin()            -- true when auth.uid() is in admin_users
--   public.audit_trigger_func()  -- writes to audit_log

-- Table ------------------------------------------------------------------
create table if not exists public.posts (
  id            bigint generated always as identity primary key,
  slug          text not null unique,
  title         text,                                 -- optional; UI falls back to the date
  body          text not null default '',             -- markdown, hard line breaks preserved
  excerpt       text,                                 -- optional override for index + share card
  kind          text not null default 'note'
                check (kind in ('note', 'work')),
  discipline    text
                check (discipline is null or discipline in ('SWE', 'ML', 'VIDEO', 'HYBRID')),
  status        text not null default 'draft'
                check (status in ('draft', 'unlisted', 'published')),
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Slugs are URL segments under /log/. Keep them boring and unambiguous.
  constraint posts_slug_shape check (slug ~ '^[a-z0-9][a-z0-9-]{0,119}$')
);

create index if not exists posts_public_idx
  on public.posts (status, published_at desc);

-- Housekeeping: updated_at, first-publish timestamp, slug fallback --------
create or replace function public.posts_before_write()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();

  -- The first time a piece goes public it gets its date. Re-publishing an
  -- unpublished piece keeps the original date unless the author cleared it.
  if new.status in ('published', 'unlisted') and new.published_at is null then
    new.published_at := now();
  end if;

  -- A piece with no title (and no slug from the app) still needs an address.
  if new.slug is null or new.slug = '' then
    new.slug := to_char(now(), 'YYYY-MM-DD') || '-' || substr(md5(random()::text), 1, 6);
  end if;

  return new;
end
$$;

drop trigger if exists posts_before_write on public.posts;
create trigger posts_before_write
  before insert or update on public.posts
  for each row execute function public.posts_before_write();

-- Audit: same trigger the other content tables use --------------------------
drop trigger if exists audit_posts on public.posts;
create trigger audit_posts
  after insert or update or delete on public.posts
  for each row execute function public.audit_trigger_func();

-- Access ---------------------------------------------------------------------
alter table public.posts enable row level security;

drop policy if exists "public reads published" on public.posts;
create policy "public reads published"
  on public.posts for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "admin full access" on public.posts;
create policy "admin full access"
  on public.posts for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Unlisted pieces: reachable by exact slug, never listable ---------------------
-- security definer bypasses RLS inside the function; the WHERE clause is the
-- only gate, so it must stay strict.
create or replace function public.get_post(p_slug text)
returns setof public.posts
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.posts
  where slug = p_slug
    and status in ('published', 'unlisted')
  limit 1;
$$;

revoke all on function public.get_post(text) from public;
grant execute on function public.get_post(text) to anon, authenticated;
