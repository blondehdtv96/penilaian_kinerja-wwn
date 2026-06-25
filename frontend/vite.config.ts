import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { resolve } from 'path';

// Dev server proxies /api and /socket.io to the backend (port 3001). Using the proxy
// (with a relative '/api' baseURL in the axios client) avoids CORS entirely — the
// backend only whitelists a single origin, and going through the proxy keeps requests
// same-origin for the browser.
//
// HTTPS (basicSsl) is enabled so the camera (getUserMedia) works when the app is opened
// from a phone over the LAN (e.g. https://192.168.137.1:5173). Browsers block camera
// access on non-secure origins; only localhost is exempt. Accept the self-signed
// certificate warning on the phone the first time.
export default defineConfig({
  plugins: [vue(), basicSsl()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    https: true,
    port: 5173,
    host: true,
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
