import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Hello, friend.
console.log('%c👋 Hello, friend.', 'color: #33ff33; font-size: 14px; font-family: monospace;');

// Every animation on the site honors the OS "reduce motion" setting; say so
// out loud, because from the outside an honored preference and a broken
// render loop look identical.
if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
  console.log(
    '%c🐢 Motion is gentled because this OS has "reduce motion" enabled — the 3D scenes run slowed, entrance animations are skipped (Windows: Settings → Accessibility → Visual effects → Animation effects · macOS: System Settings → Accessibility → Display → Reduce motion). Flip it off and full motion resumes live.',
    'color: #a3a3a3; font-family: monospace;'
  );
}

// A deploy landing mid-session strands the open page: its index.html asks
// for chunk URLs the new deployment no longer serves (or a transient
// fallback got cached under one). Vite reports those as preload errors —
// reload once to pick up the fresh manifest instead of surfacing the
// router's raw error page. Time-gated so a genuinely missing chunk
// degrades to the error state rather than a reload loop.
window.addEventListener('vite:preloadError', (event) => {
  const last = Number(sessionStorage.getItem('chunk-reload-at') ?? 0);
  if (Date.now() - last < 30_000) return;
  sessionStorage.setItem('chunk-reload-at', String(Date.now()));
  event.preventDefault();
  window.location.reload();
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
