import type { SyntheticEvent } from 'react';

// YouTube thumbnail sizes, best first. maxresdefault and sddefault don't
// exist for every video (YouTube answers 404, or a 120x90 stub with HTTP
// 200); hqdefault always does, so the chain ends there.
const YT_THUMBS = ['maxresdefault', 'sddefault', 'hqdefault'];

// Wire to both onLoad and onError of a project <img>: steps a missing
// YouTube thumbnail down to the next size until one really loads.
export function fallbackYouTubeThumbnail(e: SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (e.type !== 'error' && img.naturalWidth > 120) return;
  const i = YT_THUMBS.findIndex((size) => img.src.includes(`/${size}.jpg`));
  if (i >= 0 && i < YT_THUMBS.length - 1) {
    img.src = img.src.replace(YT_THUMBS[i], YT_THUMBS[i + 1]);
  }
}
