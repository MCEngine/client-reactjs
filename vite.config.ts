/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    /**
     * The API is same-origin in development, so the refresh cookie's `SameSite`
     * behaviour matches production. Talking to `localhost:3000` directly would
     * make it cross-site here and same-site there — a difference that shows up
     * only as an inexplicably missing cookie.
     */
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.{ts,tsx}'],
  },
});
