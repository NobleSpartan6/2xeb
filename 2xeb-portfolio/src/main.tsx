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
