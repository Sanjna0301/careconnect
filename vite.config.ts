import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { fileURLToPath, URL } from 'node:url'

/**
 * HTTPS is opt-in via `bun run dev:https`.
 *
 * Geolocation, the microphone and service workers only run in a secure
 * context. `localhost` counts as one; `http://192.168.x.x` does not — so
 * testing on a real phone over the LAN needs TLS, even self-signed.
 */
const useHttps = process.env.HTTPS === 'true'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(useHttps ? [basicSsl()] : []),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // 0.0.0.0 so another device on the same Wi-Fi can reach the dev server.
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          router: ['react-router-dom'],
        },
      },
    },
  },
})
