import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Hello, friend.
console.log('%c👋 Hello, friend.', 'color: #33ff33; font-size: 14px; font-family: monospace;');

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
