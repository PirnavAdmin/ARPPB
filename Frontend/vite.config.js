
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const apiProxyConfig = {
    '/api': {
      target:
        env.VITE_API_BASE_URL ||
        'https://flatterer-exalted-anthem.ngrok-free.dev',
      changeOrigin: true,
      secure: false,
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    },
  }

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: apiProxyConfig,
    },
    preview: {
      proxy: apiProxyConfig,
    },
  }
})
