/**
 * Markdown for the Log. Imported only by log/desk routes so `marked` and
 * DOMPurify stay out of the main bundle.
 *
 * Hard line breaks are on: a single newline in a piece is a line break on the
 * page. Verse and deliberately short lines survive.
 */

import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.use({ gfm: true, breaks: true });

// External links open in a new tab and never carry a referrer back.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName !== 'A') return;
  const href = node.getAttribute('href') || '';
  if (/^https?:\/\//i.test(href) && !href.startsWith(window.location.origin)) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export function renderPost(markdown: string): string {
  const html = marked.parse(markdown, { async: false });
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['style', 'form', 'input', 'button'],
  });
}
