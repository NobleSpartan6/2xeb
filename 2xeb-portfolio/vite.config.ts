import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';
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
  return {
    // Root is project root, source files are in /src
    root: '.',

    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    plugins: [serveStaticHtml(), react()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      }
    },

    build: {
      outDir: 'dist',
      // Avoid publishing full source maps to production; keep them for other modes.
      sourcemap: mode !== 'production',
    }
  };
});
