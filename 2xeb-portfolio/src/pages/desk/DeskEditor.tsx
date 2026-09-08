import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createPost,
  deletePost,
  fetchPost,
  updatePost,
  slugify,
  wordCount,
  postTitle,
  LogError,
  Post,
  PostKind,
  PostStatus,
  PostUpdate,
} from '../../lib/log';
import { renderPost } from '../../lib/markdown';
import { useAutosave } from '../../hooks/useAutosave';

const SITE_ORIGIN = 'https://2xeb.me';
const DISCIPLINES = ['SWE', 'ML', 'VIDEO', 'HYBRID'] as const;

interface Draft {
  title: string;
  body: string;
  excerpt: string;
  slug: string;
  kind: PostKind;
  discipline: Post['discipline'];
  status: PostStatus;
  published_at: string | null;
}

const EMPTY: Draft = {
  title: '',
  body: '',
  excerpt: '',
  slug: '',
  kind: 'note',
  discipline: null,
  status: 'draft',
  published_at: null,
};

function fromRow(row: Post): Draft {
  return {
    title: row.title ?? '',
    body: row.body,
    excerpt: row.excerpt ?? '',
    slug: row.slug,
    kind: row.kind,
    discipline: row.discipline,
    status: row.status,
    published_at: row.published_at,
  };
}

function toPatch(d: Draft): PostUpdate {
  const patch: PostUpdate = {
    title: d.title.trim() || null,
    body: d.body,
    excerpt: d.excerpt.trim() || null,
    kind: d.kind,
    discipline: d.kind === 'work' ? d.discipline : null,
    status: d.status,
    published_at: d.published_at,
  };
  // An empty slug means "let the database name it"; never send it back as ''.
  if (d.slug.trim()) patch.slug = d.slug.trim();
  return patch;
}

function sameContent(a: Draft, b: Draft): boolean {
  return (
    a.title === b.title &&
    a.body === b.body &&
    a.excerpt === b.excerpt &&
    a.slug === b.slug &&
    a.kind === b.kind &&
    a.discipline === b.discipline &&
    a.status === b.status &&
    a.published_at === b.published_at
  );
}

// --- local mirror: the phone keeps a copy of what you typed ----------------------

interface Mirror {
  title: string;
  body: string;
  at: number;
}

const mirrorKey = (id: number | 'new') => `2xeb.desk.mirror.${id}`;

function readMirror(id: number | 'new'): Mirror | null {
  try {
    const raw = localStorage.getItem(mirrorKey(id));
    return raw ? (JSON.parse(raw) as Mirror) : null;
  } catch {
    return null;
  }
}
function writeMirror(id: number | 'new', m: Mirror) {
  try {
    localStorage.setItem(mirrorKey(id), JSON.stringify(m));
  } catch {
    // Storage full or blocked; the server copy still exists.
  }
}
function clearMirror(id: number | 'new') {
  try {
    localStorage.removeItem(mirrorKey(id));
  } catch {
    // Ignore
  }
}

const timeOf = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

// --- component ---------------------------------------------------------------------

const DeskEditor: React.FC = () => {
  const { id: routeId = 'new' } = useParams();
  const navigate = useNavigate();
  const isNewRoute = routeId === 'new';

  const [postId, setPostId] = useState<number | null>(null);
  const [saved, setSaved] = useState<Draft | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'missing' | 'error'>(
    isNewRoute ? 'ready' : 'loading'
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [restore, setRestore] = useState<Mirror | null>(null);
  const [preview, setPreview] = useState(false);
  const [commitBusy, setCommitBusy] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadedIdRef = useRef<string | null>(null);
  const slugTouched = useRef(false);
  const postIdRef = useRef<number | null>(null);
  postIdRef.current = postId;
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const mirrorId: number | 'new' = postId ?? 'new';

  // --- load ------------------------------------------------------------------------
  useEffect(() => {
    if (isNewRoute) {
      loadedIdRef.current = null;
      const m = readMirror('new');
      if (m && m.body.trim()) setRestore(m);
      return;
    }
    if (loadedIdRef.current === routeId) return;

    const idNum = Number(routeId);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      setPhase('missing');
      return;
    }

    let alive = true;
    setPhase('loading');
    fetchPost(idNum)
      .then((row) => {
        if (!alive) return;
        if (!row) {
          setPhase('missing');
          return;
        }
        loadedIdRef.current = routeId;
        slugTouched.current = row.status !== 'draft';
        const d = fromRow(row);
        setPostId(row.id);
        setSaved(d);
        setDraft(d);
        setPhase('ready');
        const m = readMirror(row.id);
        if (
          m &&
          m.at > new Date(row.updated_at).getTime() &&
          (m.body !== row.body || m.title !== (row.title ?? ''))
        ) {
          setRestore(m);
        }
      })
      .catch((err) => {
        if (!alive) return;
        setLoadError(err instanceof Error ? err.message : 'Could not open this piece.');
        setPhase('error');
      });
    return () => {
      alive = false;
    };
  }, [routeId, isNewRoute]);

  // --- derived --------------------------------------------------------------------
  const dirty = saved
    ? !sameContent(draft, saved)
    : draft.body.trim().length > 0 || draft.title.trim().length > 0;
  const isPublic = draft.status !== 'draft';
  const words = useMemo(() => wordCount(draft.body), [draft.body]);
  const publicUrl =
    saved && saved.status !== 'draft' && saved.slug ? `${SITE_ORIGIN}/log/${saved.slug}` : null;

  // --- mirror ----------------------------------------------------------------------
  useEffect(() => {
    if (phase !== 'ready') return;
    if (!dirty) return;
    writeMirror(mirrorId, { title: draft.title, body: draft.body, at: Date.now() });
  }, [draft.title, draft.body, dirty, mirrorId, phase]);

  // --- persistence -------------------------------------------------------------------
  const persist = useCallback(
    async (d: Draft, opts: { keepalive?: boolean } = {}): Promise<Post> => {
      const patch = toPatch(d);
      const currentId = postIdRef.current;
      if (currentId !== null) {
        return updatePost(currentId, patch, opts);
      }
      const row = await createPost({ ...patch, status: patch.status ?? 'draft' });
      // From here on this editor owns row.id. Update the URL without remounting.
      loadedIdRef.current = String(row.id);
      postIdRef.current = row.id;
      setPostId(row.id);
      clearMirror('new');
      navigate(`/desk/${row.id}`, { replace: true });
      return row;
    },
    [navigate]
  );

  // Drafts save themselves. Public pieces wait for an explicit Save so a
  // half-finished edit never goes live mid-sentence.
  const autosaveValue = useMemo(
    () => ({
      title: draft.title,
      body: draft.body,
      excerpt: draft.excerpt,
      slug: draft.slug,
      kind: draft.kind,
      discipline: draft.discipline,
    }),
    [draft.title, draft.body, draft.excerpt, draft.slug, draft.kind, draft.discipline]
  );

  const autosave = useAutosave({
    value: autosaveValue,
    enabled: phase === 'ready' && draft.status === 'draft',
    delay: 1500,
    save: async (value, opts) => {
      const snapshot: Draft = { ...draft, ...value, status: 'draft' };
      if (postIdRef.current === null && !snapshot.body.trim() && !snapshot.title.trim()) return;
      const row = await persist(snapshot, opts);
      const d = fromRow(row);
      setSaved(d);
      // Keep the database's slug (it may have named an untitled piece).
      setDraft((prev) => (prev.slug ? prev : { ...prev, slug: d.slug }));
      clearMirror(row.id);
    },
  });

  const commit = useCallback(
    async (next: Partial<Draft>) => {
      if (commitBusy) return;
      const snapshot: Draft = { ...draft, ...next };
      if (snapshot.status !== 'draft' && !snapshot.body.trim()) {
        setCommitError('Write something before it goes out.');
        return;
      }
      setCommitBusy(true);
      setCommitError(null);
      try {
        const row = await persist(snapshot);
        const d = fromRow(row);
        if (d.status !== 'draft') slugTouched.current = true;
        setSaved(d);
        setDraft(d);
        autosave.markSaved();
        clearMirror(row.id);
      } catch (err) {
        setCommitError(
          err instanceof LogError && err.kind === 'offline'
            ? 'No connection. Your words are kept on this phone; try again when you are back online.'
            : err instanceof Error
              ? err.message
              : 'Could not save.'
        );
      } finally {
        setCommitBusy(false);
      }
    },
    [commitBusy, draft, persist, autosave]
  );

  // Leaving the page: push what we have, and warn if something would be lost.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') void autosave.flush({ keepalive: true });
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty && (isPublic || autosave.status === 'pending' || autosave.status === 'saving')) {
        e.preventDefault();
      }
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [autosave, dirty, isPublic]);

  // --- editing helpers --------------------------------------------------------------
  const setTitle = (title: string) =>
    setDraft((prev) => ({
      ...prev,
      title,
      slug: !slugTouched.current && prev.status === 'draft' ? slugify(title) : prev.slug,
    }));

  const setSlug = (slug: string) => {
    slugTouched.current = true;
    setDraft((prev) => ({ ...prev, slug: slugify(slug) }));
  };

  // Textarea grows with the text; no inner scrollbar on a phone.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [draft.body, preview, phase]);

  const copyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked; the link is visible to select.
    }
  };

  const shareLink = async () => {
    if (!publicUrl || !saved) return;
    try {
      await navigator.share({ title: postTitle({ ...saved, created_at: '' }), url: publicUrl });
    } catch {
      // Dismissed.
    }
  };

  const remove = async () => {
    if (postId === null) {
      clearMirror('new');
      navigate('/desk', { replace: true });
      return;
    }
    setCommitBusy(true);
    try {
      await deletePost(postId);
      clearMirror(postId);
      navigate('/desk', { replace: true });
    } catch (err) {
      setCommitError(err instanceof Error ? err.message : 'Could not delete.');
      setCommitBusy(false);
      setConfirmDelete(false);
    }
  };

  // --- status line ------------------------------------------------------------------
  const statusText = (() => {
    if (commitBusy) return 'Saving…';
    if (isPublic) {
      if (dirty) return 'Unsaved changes';
      return autosave.savedAt ? `Saved ${timeOf(autosave.savedAt)}` : 'Saved';
    }
    switch (autosave.status) {
      case 'pending':
        return 'Unsaved';
      case 'saving':
        return 'Saving…';
      case 'saved':
        return autosave.savedAt ? `Saved ${timeOf(autosave.savedAt)}` : 'Saved';
      case 'offline':
        return 'Offline · kept on this phone';
      case 'error':
        return 'Could not save · retrying';
      default:
        return saved ? 'Saved' : 'New';
    }
  })();

  // --- render -------------------------------------------------------------------------
  if (phase === 'loading') {
    return (
      <div className="py-12 flex items-center gap-2 font-mono">
        <span
          className="inline-block w-[7px] h-[14px] bg-[#2563EB] animate-caret-blink"
          aria-hidden
        />
        <span className="text-[10px] uppercase tracking-widest text-[#525252]">Opening</span>
      </div>
    );
  }
  if (phase === 'missing') {
    return (
      <div className="py-12 font-mono text-xs text-[#737373]">
        <p className="mb-3">That piece is not on the desk.</p>
        <button
          onClick={() => navigate('/desk')}
          className="text-[#2563EB] hover:text-white uppercase tracking-widest border-b border-[#2563EB] pb-0.5 transition-colors"
        >
          Back to the desk
        </button>
      </div>
    );
  }
  if (phase === 'error') {
    return (
      <div className="py-12 font-mono text-xs text-[#737373]">
        <p className="mb-3">{loadError}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-[#2563EB] hover:text-white uppercase tracking-widest border-b border-[#2563EB] pb-0.5 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  const chip = (active: boolean, extra = '') =>
    `px-3 py-1.5 text-[10px] font-bold font-mono uppercase tracking-widest border pressable ${
      active
        ? 'bg-white text-black border-white'
        : 'bg-transparent text-[#737373] border-[#262626] hover:text-white hover:border-[#404040]'
    } ${extra}`;

  return (
    <div className="py-6 sm:py-10 pb-44">
      {restore && (
        <div className="mb-6 p-4 border border-[#2563EB]/40 bg-[#2563EB]/5 font-mono text-xs text-[#D4D4D4]">
          <p className="mb-3">
            This phone has newer text for this piece from {timeOf(new Date(restore.at))}.
          </p>
          <div className="flex gap-4 uppercase tracking-widest text-[10px]">
            <button
              onClick={() => {
                setDraft((prev) => ({ ...prev, title: restore.title, body: restore.body }));
                setRestore(null);
              }}
              className="text-[#2563EB] hover:text-white border-b border-[#2563EB] pb-0.5 transition-colors"
            >
              Restore it
            </button>
            <button
              onClick={() => {
                clearMirror(mirrorId);
                setRestore(null);
              }}
              className="text-[#737373] hover:text-white transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {publicUrl && (
        <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-widest text-[#737373]">
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="normal-case tracking-normal text-[#A3A3A3] hover:text-white truncate max-w-full transition-colors"
          >
            {publicUrl.replace('https://', '')}
          </a>
          <button onClick={copyLink} className="hover:text-white transition-colors">
            {copied ? 'Copied' : 'Copy'}
          </button>
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button onClick={shareLink} className="hover:text-white transition-colors">
              Share
            </button>
          )}
        </div>
      )}

      <input
        type="text"
        value={draft.title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title, if it wants one"
        autoComplete="off"
        className="desk-input w-full bg-transparent border-0 outline-none font-space-grotesk font-bold text-white tracking-tight leading-tight placeholder-[#333] !text-[1.75rem] sm:!text-[2.25rem]"
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setDraft((p) => ({ ...p, kind: 'note', discipline: null }))}
          className={chip(draft.kind === 'note')}
        >
          Note
        </button>
        <button
          onClick={() =>
            setDraft((p) => ({ ...p, kind: 'work', discipline: p.discipline ?? 'SWE' }))
          }
          className={chip(draft.kind === 'work')}
        >
          Work
        </button>
        {draft.kind === 'work' && (
          <>
            <span className="w-px h-4 bg-[#262626] mx-1" aria-hidden />
            {DISCIPLINES.map((d) => (
              <button
                key={d}
                onClick={() => setDraft((p) => ({ ...p, discipline: d }))}
                className={chip(draft.discipline === d)}
              >
                {d}
              </button>
            ))}
          </>
        )}
        <span className="flex-1" />
        <button onClick={() => setPreview((v) => !v)} className={chip(preview)}>
          {preview ? 'Edit' : 'Preview'}
        </button>
      </div>

      <div className="mt-6">
        {preview ? (
          <div
            className="prose-log text-[1.1875rem] min-h-[12rem]"
            dangerouslySetInnerHTML={{ __html: renderPost(draft.body) }}
          />
        ) : (
          <textarea
            ref={bodyRef}
            value={draft.body}
            onChange={(e) => setDraft((p) => ({ ...p, body: e.target.value }))}
            placeholder="Write."
            spellCheck
            className="desk-body desk-input w-full min-h-[12rem] bg-transparent border-0 outline-none resize-none text-[#D4D4D4] placeholder-[#333] leading-[1.7] overflow-hidden"
          />
        )}
      </div>

      <details className="mt-10 group">
        <summary className="cursor-pointer list-none font-mono text-[10px] uppercase tracking-widest text-[#525252] hover:text-white transition-colors w-max">
          <span className="inline-block group-open:rotate-90 transition-transform mr-2">›</span>
          Details
        </summary>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">
              Address
            </span>
            <div className="flex items-center border border-[#262626] focus-within:border-[#2563EB] transition-colors">
              <span className="pl-3 font-mono text-xs text-[#525252]">/log/</span>
              <input
                type="text"
                value={draft.slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="named by date"
                autoCapitalize="off"
                autoComplete="off"
                className="desk-input flex-1 min-w-0 px-2 py-2.5 bg-transparent outline-none font-mono text-[#D4D4D4]"
              />
            </div>
          </label>
          <label className="block">
            <span className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">
              Date
            </span>
            <input
              type="date"
              value={draft.published_at ? draft.published_at.slice(0, 10) : ''}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  published_at: e.target.value
                    ? new Date(`${e.target.value}T12:00:00`).toISOString()
                    : null,
                }))
              }
              className="desk-input w-full px-3 py-2.5 bg-transparent border border-[#262626] focus:border-[#2563EB] outline-none font-mono text-[#D4D4D4] transition-colors [color-scheme:dark]"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="block text-[10px] uppercase tracking-widest text-[#525252] font-mono mb-2">
              Excerpt{' '}
              <span className="normal-case tracking-normal">
                · for link previews; the opening lines otherwise
              </span>
            </span>
            <textarea
              value={draft.excerpt}
              onChange={(e) => setDraft((p) => ({ ...p, excerpt: e.target.value }))}
              rows={2}
              className="desk-input w-full px-3 py-2.5 bg-transparent border border-[#262626] focus:border-[#2563EB] outline-none font-serif text-[#D4D4D4] resize-y transition-colors"
            />
          </label>
        </div>

        <div className="mt-10 pt-6 border-t border-[#262626]">
          {confirmDelete ? (
            <div className="flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-widest">
              <span className="text-[#A3A3A3] normal-case tracking-normal">
                Delete “{postTitle({ ...draft, created_at: new Date().toISOString() })}”? This
                cannot be undone.
              </span>
              <button
                onClick={remove}
                disabled={commitBusy}
                className="text-red-400 hover:text-white border-b border-red-400 pb-0.5 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[#737373] hover:text-white transition-colors"
              >
                Keep
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="font-mono text-[10px] uppercase tracking-widest text-[#525252] hover:text-red-400 transition-colors"
            >
              Delete this piece
            </button>
          )}
        </div>
      </details>

      {/* Action bar: what the piece is, and whether it is saved. */}
      <div
        className="fixed bottom-0 inset-x-0 z-30 bg-[#050505]/95 backdrop-blur border-t border-[#1f1f1f]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0 font-mono text-[10px] uppercase tracking-widest text-[#737373] truncate">
            <span
              className={
                autosave.status === 'offline' || autosave.status === 'error' || (isPublic && dirty)
                  ? 'text-[#F59E0B]'
                  : ''
              }
            >
              {statusText}
            </span>
            <span className="text-[#404040]">
              {' '}
              · {words} {words === 1 ? 'word' : 'words'}
            </span>
            {commitError && (
              <span className="block normal-case tracking-normal text-red-400 truncate">
                {commitError}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex border border-[#262626] bg-[#0A0A0A]">
              {(
                [
                  ['draft', 'Draft'],
                  ['unlisted', 'Link only'],
                  ['published', 'Published'],
                ] as [PostStatus, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  disabled={commitBusy}
                  onClick={() => value !== draft.status && void commit({ status: value })}
                  className={`px-3 sm:px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] pressable border-r border-[#262626] last:border-r-0 disabled:opacity-60 ${
                    draft.status === value
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-[#0A0A0A] text-[#A3A3A3] hover:bg-white hover:text-black'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {isPublic && (
              <button
                disabled={commitBusy || !dirty}
                onClick={() => void commit({})}
                className="px-4 py-2.5 bg-white text-black text-[10px] font-bold uppercase tracking-[0.14em] pressable disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2563EB] hover:text-white"
              >
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeskEditor;
