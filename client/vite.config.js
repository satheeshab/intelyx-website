import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Production build goes to dist/public (the Express server serves it; see server/src/static.js).
// In development `npm run dev` runs this dev server on :5173 and forwards /api to the Node server on :3001.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/public',
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: `http://localhost:${process.env.API_PORT || 3001}`, changeOrigin: false },
    },
  },
});
