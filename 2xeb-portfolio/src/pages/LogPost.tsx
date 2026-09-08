import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePost, usePosts } from '../hooks/usePosts';
import { useScrollReveal } from '../hooks/useAnimations';
import { renderPost } from '../lib/markdown';
import { formatDate, postDate, postTitle, Post } from '../lib/log';
import DisciplineChip from '../components/DisciplineChip';
import { Discipline } from '../lib/types';

const SITE_ORIGIN = 'https://2xeb.me';

const ShareRow: React.FC<{ post: Post }> = ({ post }) => {
  const [copied, setCopied] = useState(false);
  const url = `${SITE_ORIGIN}/log/${post.slug}`;
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable: the URL bar still has it.
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title: postTitle(post), url });
    } catch {
      // Dismissed or unsupported; nothing to recover.
    }
  };

  return (
    <div className="flex items-center gap-5 font-mono text-[10px] uppercase tracking-widest text-[#737373]">
      <button
        onClick={copy}
        className="hover:text-white border-b border-transparent hover:border-white pb-0.5 transition-colors"
      >
        {copied ? 'Copied' : 'Copy link'}
      </button>
      {canShare && (
        <button
          onClick={share}
          className="hover:text-white border-b border-transparent hover:border-white pb-0.5 transition-colors"
        >
          Share
        </button>
      )}
    </div>
  );
};

const NotFound: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center text-white bg-[#050505] px-6">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4 font-space-grotesk">404</h1>
      <p className="text-[#A3A3A3] mb-8 font-mono">This piece is not here.</p>
      <Link
        to="/log"
        className="text-[#2563EB] hover:text-white transition-colors uppercase tracking-widest text-xs font-bold border-b border-[#2563EB]"
      >
        Back to the log
      </Link>
    </div>
  </div>
);

const LogPost: React.FC = () => {
  const { slug = '' } = useParams();
  const post = usePost(slug);
  const index = usePosts();
  const revealRef = useScrollReveal<HTMLElement>({ y: 14, interval: 60 }, [slug]);

  const data = post.data;
  const title = data ? postTitle(data) : '';
  const hasTitle = !!data?.title?.trim();
  const html = useMemo(() => (data ? renderPost(data.body) : ''), [data]);

  useEffect(() => {
    if (data) document.title = `eb - ${title}`;
  }, [data, title]);

  // Previous / next among published pieces (unlisted ones sit outside the sequence).
  const neighbours = useMemo(() => {
    if (!data || data.status !== 'published' || !index.data) return null;
    const list = index.data;
    const i = list.findIndex((p) => p.slug === data.slug);
    if (i === -1) return null;
    return { newer: list[i - 1] ?? null, older: list[i + 1] ?? null };
  }, [data, index.data]);

  if (post.status === 'loading') {
    return (
      <div className="min-h-screen bg-[#050505] pt-32 px-6 max-w-[42rem] mx-auto">
        <div className="flex items-center gap-2 font-mono">
          <span
            className="inline-block w-[7px] h-[14px] bg-[#2563EB] animate-caret-blink"
            aria-hidden
          />
          <span className="text-[10px] uppercase tracking-widest text-[#525252]">Opening</span>
        </div>
      </div>
    );
  }

  if (post.status === 'error') {
    return (
      <div className="min-h-screen bg-[#050505] pt-32 px-6 max-w-[42rem] mx-auto font-mono text-xs text-[#737373]">
        <p className="mb-3">
          {post.error.kind === 'offline'
            ? 'This piece is out of reach without a connection.'
            : 'The log did not answer. It will be back.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-[#2563EB] hover:text-white uppercase tracking-widest border-b border-[#2563EB] pb-0.5 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return <NotFound />;

  const date = postDate(data);

  return (
    <article
      ref={revealRef}
      className="min-h-screen bg-[#050505] pt-28 md:pt-36 pb-24 px-5 sm:px-6"
    >
      <div className="max-w-[42rem] mx-auto">
        <header className="mb-10 md:mb-12">
          <div data-animate className="flex items-center gap-4 mb-5">
            <time
              dateTime={date.toISOString()}
              className="font-mono text-[11px] uppercase tracking-widest text-[#A3A3A3]"
            >
              {formatDate(date)}
            </time>
            {data.kind === 'work' && data.discipline && (
              <DisciplineChip discipline={data.discipline as Discipline} />
            )}
            {data.status === 'unlisted' && (
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#525252] border border-[#262626] px-2 py-0.5">
                Link only
              </span>
            )}
          </div>
          {hasTitle && (
            <h1
              data-animate
              className="font-bold text-white font-space-grotesk tracking-tight leading-[1.02]"
              style={{ fontSize: 'clamp(2rem, 3.5vw + 1rem, 3.25rem)', textWrap: 'balance' }}
            >
              {data.title}
            </h1>
          )}
        </header>

        <div
          data-animate
          className="prose-log text-[1.1875rem] sm:text-[1.25rem]"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        <footer className="mt-16 pt-8 border-t border-[#262626] space-y-10">
          <ShareRow post={data} />

          {neighbours && (neighbours.newer || neighbours.older) && (
            <nav aria-label="Log navigation" className="grid grid-cols-2 gap-4">
              <div>
                {neighbours.newer && (
                  <Link to={`/log/${neighbours.newer.slug}`} viewTransition className="group block">
                    <span className="block font-mono text-[10px] uppercase tracking-widest text-[#525252] mb-2">
                      ← Newer
                    </span>
                    <span className="block font-space-grotesk font-bold text-white group-hover:text-[#2563EB] transition-colors leading-tight">
                      {postTitle(neighbours.newer)}
                    </span>
                  </Link>
                )}
              </div>
              <div className="text-right">
                {neighbours.older && (
                  <Link to={`/log/${neighbours.older.slug}`} viewTransition className="group block">
                    <span className="block font-mono text-[10px] uppercase tracking-widest text-[#525252] mb-2">
                      Older →
                    </span>
                    <span className="block font-space-grotesk font-bold text-white group-hover:text-[#2563EB] transition-colors leading-tight">
                      {postTitle(neighbours.older)}
                    </span>
                  </Link>
                )}
              </div>
            </nav>
          )}

          <Link
            to="/log"
            viewTransition
            className="inline-flex items-center text-[#A3A3A3] hover:text-[#2563EB] transition-colors text-xs uppercase tracking-widest font-mono"
          >
            ← The log
          </Link>
        </footer>
      </div>
    </article>
  );
};

export default LogPost;
