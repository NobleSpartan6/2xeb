import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAllPosts, LogError, openingLines, postTitle, Post, PostStatus } from '../../lib/log';

const GROUPS: { status: PostStatus; label: string }[] = [
  { status: 'draft', label: 'Drafts' },
  { status: 'unlisted', label: 'Link only' },
  { status: 'published', label: 'Published' },
];

function relative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 14) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const DeskList: React.FC = () => {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState<LogError | null>(null);

  useEffect(() => {
    let alive = true;
    fetchAllPosts()
      .then((rows) => alive && setPosts(rows))
      .catch(
        (err) =>
          alive && setError(err instanceof LogError ? err : new LogError('server', String(err)))
      );
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="py-8 sm:py-12">
      <Link
        to="/desk/new"
        className="flex items-center justify-between w-full px-5 py-4 bg-[#2563EB] text-white font-space-grotesk font-bold text-sm uppercase tracking-widest pressable hover:bg-white hover:text-black"
      >
        <span>New piece</span>
        <span aria-hidden>+</span>
      </Link>

      {error && (
        <p className="mt-10 font-mono text-xs text-[#737373]">
          {error.kind === 'offline'
            ? 'No connection. Your pieces are still there.'
            : `Could not load the desk: ${error.message}`}
        </p>
      )}

      {!error && posts === null && (
        <div className="mt-10 flex items-center gap-2 font-mono">
          <span
            className="inline-block w-[7px] h-[14px] bg-[#2563EB] animate-caret-blink"
            aria-hidden
          />
          <span className="text-[10px] uppercase tracking-widest text-[#525252]">
            Opening the desk
          </span>
        </div>
      )}

      {posts && posts.length === 0 && (
        <p className="mt-10 font-mono text-xs text-[#525252] uppercase tracking-widest">
          Nothing yet. Start one.
        </p>
      )}

      {posts &&
        GROUPS.map(({ status, label }) => {
          const rows = posts.filter((p) => p.status === status);
          if (rows.length === 0) return null;
          return (
            <section key={status} className="mt-10">
              <h2 className="text-[10px] font-bold text-[#2563EB] uppercase tracking-[0.2em] font-mono mb-2">
                {label} <span className="text-[#525252] font-normal">· {rows.length}</span>
              </h2>
              <ul className="border-t border-[#262626]">
                {rows.map((p) => {
                  const first = openingLines(p.body, 1)[0];
                  return (
                    <li key={p.id} className="border-b border-[#262626]">
                      <Link
                        to={`/desk/${p.id}`}
                        className="group flex items-start gap-4 py-4 -mx-2 px-2 hover:bg-[#0A0A0A] transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-space-grotesk font-bold text-white group-hover:text-[#2563EB] transition-colors leading-tight truncate">
                            {postTitle(p)}
                          </div>
                          {first && (
                            <div className="mt-1 font-serif text-[#A3A3A3] text-[15px] leading-snug truncate">
                              {first}
                            </div>
                          )}
                        </div>
                        <time
                          dateTime={p.updated_at}
                          className="shrink-0 pt-1 font-mono text-[10px] uppercase tracking-wider text-[#525252]"
                        >
                          {relative(p.updated_at)}
                        </time>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
    </div>
  );
};

export default DeskList;
