import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePosts } from '../hooks/usePosts';
import { useScrollReveal, useTextScramble } from '../hooks/useAnimations';
import { openingLines, postDate, Post } from '../lib/log';
import DisciplineChip from '../components/DisciplineChip';
import { Discipline } from '../lib/types';

type Filter = 'all' | 'work' | 'note';

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Work', value: 'work' },
  { label: 'Notes', value: 'note' },
];

const Row: React.FC<{ post: Post }> = ({ post }) => {
  const date = postDate(post);
  const lines = openingLines(post.body, 4);
  const hasTitle = !!post.title?.trim();

  return (
    <Link
      to={`/log/${post.slug}`}
      viewTransition
      data-animate
      className="group grid md:grid-cols-12 gap-3 md:gap-8 py-8 md:py-10 px-4 md:px-8 -mx-4 md:mx-0 border-b border-[#262626] hover:bg-[#0A0A0A] transition-colors"
    >
      <div className="md:col-span-3 flex md:flex-col items-center md:items-start gap-3 md:gap-2">
        <time
          dateTime={date.toISOString()}
          className="font-mono text-xs text-[#A3A3A3] uppercase tracking-wider group-hover:text-white transition-colors"
        >
          {date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
        </time>
        {post.kind === 'work' && post.discipline ? (
          <DisciplineChip discipline={post.discipline as Discipline} />
        ) : (
          <span className="text-[10px] text-[#525252] font-mono uppercase tracking-wider">
            {post.kind === 'work' ? 'Work' : 'Note'}
          </span>
        )}
      </div>

      <div className="md:col-span-9 min-w-0">
        {hasTitle && (
          <h2 className="text-2xl md:text-3xl font-bold text-white font-space-grotesk tracking-tight leading-[1.05] mb-3 group-hover:text-[#2563EB] transition-colors">
            {post.title}
          </h2>
        )}
        {lines.length > 0 && (
          <p className="log-opening font-serif text-[#D4D4D4] text-lg md:text-xl leading-relaxed max-w-[60ch]">
            {lines.join('\n')}
          </p>
        )}
      </div>
    </Link>
  );
};

const Log: React.FC = () => {
  const [filter, setFilter] = useState<Filter>('all');
  const posts = usePosts();
  const kickerRef = useTextScramble<HTMLSpanElement>();
  const headerRef = useScrollReveal<HTMLDivElement>({ y: 18, interval: 70 });

  const visible = useMemo(() => {
    const all = posts.data ?? [];
    return filter === 'all' ? all : all.filter((p) => p.kind === filter);
  }, [posts.data, filter]);

  const hasWork = useMemo(() => (posts.data ?? []).some((p) => p.kind === 'work'), [posts.data]);
  const listRef = useScrollReveal<HTMLDivElement>({ y: 14, interval: 45 }, [visible]);

  return (
    <div className="min-h-screen bg-[#050505] pt-28 md:pt-36 pb-20 px-4 sm:px-6 lg:px-12">
      <div
        ref={headerRef}
        className="max-w-5xl xl:max-w-6xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 lg:mb-14 gap-8 lg:gap-14 border-b border-[#262626] pb-8 lg:pb-10"
      >
        <div data-animate>
          <span
            ref={kickerRef}
            className="text-[#2563EB] font-mono text-[11px] sm:text-xs uppercase tracking-widest block mb-3 sm:mb-4"
          >
            Log
          </span>
          <h1
            className="font-bold text-white font-space-grotesk tracking-tighter leading-[0.85]"
            style={{ fontSize: 'clamp(3rem, 5vw + 1rem, 8rem)' }}
          >
            SHORT
            <br />
            <span className="text-[#2563EB]">FORM</span>
          </h1>
        </div>

        {hasWork && (
          <div
            data-animate
            className="flex border border-[#262626] bg-[#0A0A0A] overflow-hidden w-full lg:w-auto"
          >
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex-1 lg:flex-none px-4 sm:px-5 lg:px-6 py-3 text-[11px] font-bold uppercase tracking-[0.16em] pressable border-r border-[#262626] last:border-r-0 ${
                  filter === f.value
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-[#0A0A0A] text-[#A3A3A3] hover:bg-white hover:text-black'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div ref={listRef} className="max-w-5xl xl:max-w-6xl mx-auto">
        {posts.status === 'loading' && (
          <div className="flex items-center gap-2 py-16 font-mono">
            <span
              className="inline-block w-[7px] h-[14px] bg-[#2563EB] animate-caret-blink"
              aria-hidden
            />
            <span className="text-[10px] uppercase tracking-widest text-[#525252]">
              Opening the log
            </span>
          </div>
        )}

        {posts.status === 'error' && (
          <div className="py-16 font-mono text-xs text-[#737373]">
            <p className="mb-3">
              {posts.error.kind === 'offline'
                ? 'The log is out of reach without a connection.'
                : 'The log did not answer. It will be back.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-[#2563EB] hover:text-white uppercase tracking-widest border-b border-[#2563EB] pb-0.5 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {posts.status === 'ready' && visible.length === 0 && (
          <p className="py-16 font-mono text-xs text-[#525252] uppercase tracking-widest">
            nothing here yet.
          </p>
        )}

        {posts.status === 'ready' && visible.length > 0 && (
          <div className="border-t border-[#262626]">
            {visible.map((post) => (
              <Row key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Log;
