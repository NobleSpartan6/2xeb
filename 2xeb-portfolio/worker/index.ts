/**
 * Edge script in front of the static site. It runs only for `/log/*`
 * (see `run_worker_first` in wrangler.jsonc); every other path is served
 * straight from the assets binding as before.
 *
 * Two jobs:
 *  1. `/log/<slug>` — fetch the piece and rewrite the app shell's <head> so a
 *     shared link unfurls with the piece's own title and opening lines. Chat
 *     apps scrape HTML without running JavaScript; the SPA alone can't do this.
 *  2. `/log/feed.xml` — an RSS feed of published pieces.
 *
 * Failure mode is always "serve the app anyway": a Supabase hiccup degrades
 * to the generic site card, never to an error page.
 */

export interface Env {
  ASSETS: Fetcher;
  SUPABASE_URL: string;
  /** Worker secret (`wrangler secret put SUPABASE_ANON_KEY`); absent → plain shell, no feed. */
  SUPABASE_ANON_KEY?: string;
  SITE_ORIGIN: string;
}

function configured(env: Env): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
}

interface Post {
  slug: string;
  title: string | null;
  body: string;
  excerpt: string | null;
  kind: 'note' | 'work';
  status: 'draft' | 'unlisted' | 'published';
  published_at: string | null;
  updated_at: string;
}

const CACHE_SECONDS = 300;
const SLUG = /^\/log\/([a-z0-9][a-z0-9-]{0,119})\/?$/;

// --- text helpers (mirrors src/lib/log.ts; keep in sync) -----------------------

function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, '$1')
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function titleOf(post: Post): string {
  const t = post.title?.trim();
  return t && t.length > 0 ? t : formatDate(post.published_at ?? post.updated_at);
}

function excerptOf(post: Post, max = 200): string {
  const source = post.excerpt?.trim() || stripMarkdown(post.body);
  if (source.length <= max) return source;
  const cut = source.slice(0, max);
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 30)).trimEnd() + '…';
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// --- Supabase, with the edge cache in front ----------------------------------------

async function cached<T>(key: string, load: () => Promise<T | null>): Promise<T | null> {
  const cache = caches.default;
  const cacheKey = new Request(key, { method: 'GET' });
  const hit = await cache.match(cacheKey);
  if (hit) return (await hit.json()) as T;

  const value = await load();
  if (value !== null) {
    const res = new Response(JSON.stringify(value), {
      headers: {
        'content-type': 'application/json',
        'cache-control': `public, max-age=${CACHE_SECONDS}`,
      },
    });
    await cache.put(cacheKey, res);
  }
  return value;
}

function supabaseHeaders(env: Env): HeadersInit {
  return {
    apikey: env.SUPABASE_ANON_KEY ?? '',
    Authorization: `Bearer ${env.SUPABASE_ANON_KEY ?? ''}`,
    'Content-Type': 'application/json',
  };
}

async function getPost(env: Env, slug: string): Promise<Post | null> {
  return cached<Post>(`${env.SITE_ORIGIN}/__cache/post/${slug}`, async () => {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/get_post`, {
      method: 'POST',
      headers: supabaseHeaders(env),
      body: JSON.stringify({ p_slug: slug }),
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as Post[];
    return rows[0] ?? null;
  });
}

async function listPublished(env: Env): Promise<Post[] | null> {
  return cached<Post[]>(`${env.SITE_ORIGIN}/__cache/feed`, async () => {
    const url =
      `${env.SUPABASE_URL}/rest/v1/posts` +
      `?select=slug,title,body,excerpt,kind,status,published_at,updated_at` +
      `&status=eq.published&order=published_at.desc&limit=50`;
    const res = await fetch(url, { headers: supabaseHeaders(env) });
    if (!res.ok) return null;
    return (await res.json()) as Post[];
  });
}

// --- responses -------------------------------------------------------------------------

function setAttr(name: string, value: string) {
  return {
    element(el: Element) {
      el.setAttribute(name, value);
    },
  };
}

function withPostMeta(shell: Response, post: Post, origin: string): Response {
  const title = titleOf(post);
  const description = excerptOf(post);
  const canonical = `${origin}/log/${post.slug}`;
  const fullTitle = `${title} — 2XEB`;

  const out = new HTMLRewriter()
    .on('title', {
      element(el) {
        el.setInnerContent(fullTitle);
      },
    })
    .on('meta[name="description"]', setAttr('content', description))
    .on('meta[property="og:type"]', setAttr('content', 'article'))
    .on('meta[property="og:url"]', setAttr('content', canonical))
    .on('meta[property="og:title"]', setAttr('content', title))
    .on('meta[property="og:description"]', setAttr('content', description))
    .on('meta[name="twitter:title"]', setAttr('content', title))
    .on('meta[name="twitter:description"]', setAttr('content', description))
    // Text pieces have no image of their own; a small card reads more honestly
    // than the site's hero stretched under a sentence.
    .on('meta[name="twitter:card"]', setAttr('content', 'summary'))
    .on('head', {
      element(el) {
        el.append(`<link rel="canonical" href="${escapeHtml(canonical)}">`, { html: true });
        if (post.status === 'unlisted') {
          el.append('<meta name="robots" content="noindex">', { html: true });
        }
      },
    })
    .transform(shell);

  const headers = new Headers(out.headers);
  headers.set('cache-control', `public, max-age=60, s-maxage=${CACHE_SECONDS}`);
  return new Response(out.body, { status: out.status, headers });
}

function feed(posts: Post[], origin: string): Response {
  const items = posts
    .map((p) => {
      const link = `${origin}/log/${p.slug}`;
      const date = new Date(p.published_at ?? p.updated_at).toUTCString();
      return `    <item>
      <title>${escapeHtml(titleOf(p))}</title>
      <link>${escapeHtml(link)}</link>
      <guid isPermaLink="true">${escapeHtml(link)}</guid>
      <pubDate>${date}</pubDate>
      <description>${escapeHtml(excerptOf(p, 400))}</description>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>2XEB — Log</title>
    <link>${escapeHtml(origin)}/log</link>
    <atom:link href="${escapeHtml(origin)}/log/feed.xml" rel="self" type="application/rss+xml" />
    <description>Short writing by Ebenezer Eshetu.</description>
    <language>en-us</language>
${items}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': `public, max-age=${CACHE_SECONDS}`,
    },
  });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const origin = env.SITE_ORIGIN || url.origin;

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return env.ASSETS.fetch(request);
    }
    if (!configured(env)) return env.ASSETS.fetch(request);

    if (url.pathname === '/log/feed.xml') {
      const posts = await listPublished(env).catch(() => null);
      return posts ? feed(posts, origin) : new Response('feed unavailable', { status: 503 });
    }

    const match = url.pathname.match(SLUG);
    if (!match) return env.ASSETS.fetch(request);

    // The SPA shell (index.html) — the same bytes every other route gets.
    const shell = await env.ASSETS.fetch(new Request(new URL('/', url), request));
    const post = await getPost(env, match[1]).catch(() => null);
    if (!post) return shell;

    return withPostMeta(shell, post, origin);
  },
} satisfies ExportedHandler<Env>;
