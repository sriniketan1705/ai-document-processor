import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During development, requests to /api are forwarded to the Express server,
// so we don't need to deal with CORS or hard-coded URLs in the frontend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
