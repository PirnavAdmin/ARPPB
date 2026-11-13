import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

const apiProxyConfig = {
  '/api': {
    target:
      process.env.VITE_API_BASE_URL ||
      'https://zodiac-excursion-rendition.ngrok-free.dev',
    changeOrigin: true,
    secure: false,
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: apiProxyConfig,
  },
  preview: {
    proxy: apiProxyConfig,
  },
})