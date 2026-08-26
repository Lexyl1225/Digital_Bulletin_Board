import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Reads .env / .env.local (gitignored) — set VITE_EXTRA_ALLOWED_HOST to
  // whatever public hostname (e.g. a Tailscale Funnel hostname) this dev
  // server should accept requests for. Never hardcode a real one here.
  const env = loadEnv(mode, process.cwd(), '');
  const extraAllowedHost = env.VITE_EXTRA_ALLOWED_HOST;

  return {
    plugins: [react()],
    server: {
      port: 5173,
      allowedHosts: extraAllowedHost ? [extraAllowedHost] : undefined,
      proxy: {
        '/users': {
          target: 'http://127.0.0.1:5000',
          changeOrigin: true,
          secure: false,
        },
        '/login': {
          target: 'http://127.0.0.1:5000',
          changeOrigin: true,
          secure: false,
        },
        '/logout': {
          target: 'http://127.0.0.1:5000',
          changeOrigin: true,
          secure: false,
        },
        '/me': {
          target: 'http://127.0.0.1:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
})
