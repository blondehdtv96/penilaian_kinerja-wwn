import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

// Dev server proxies /api and /socket.io to the backend (port 3001). Using the proxy
// (with a relative '/api' baseURL in the axios client) avoids CORS entirely — the
// backend only whitelists a single origin, and going through the proxy keeps requests
// same-origin for the browser.
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true
      }
    }
  }
});
