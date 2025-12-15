import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Plugin to serve static HTML files for specific paths
function serveStaticHtml(): Plugin {
  return {
    name: 'serve-static-html',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Handle /auth/callback - serve static HTML
        if (req.url?.startsWith('/auth/callback')) {
          const filePath = path.resolve(__dirname, 'public/auth/callback/index.html');
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'text/html');
            fs.createReadStream(filePath).pipe(res);
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // Root is project root, source files are in /src
    root: '.',

    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    plugins: [serveStaticHtml(), react()],

    // Environment variables exposed to client
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      }
    },

    build: {
      outDir: 'dist',
      sourcemap: true,
    }
  };
});
