import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Proxy API calls to the Express backend during development so that
    // root-relative requests (e.g. "/api/...") reach the backend on :5001.
    proxy: {
      '/api': 'http://localhost:5001',
    },
  },
  build: {
    // The Express server serves the SPA from frontend/build (see backend/server.js),
    // so keep Vite's output there instead of the default "dist".
    outDir: 'build',
  },
});
