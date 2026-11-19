import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const commonApiBaseUrl =
    env.VITE_API_BASE_URL ||
    'https://zodiac-excursion-rendition.ngrok-free.dev'

  const apiProxyConfig = {
    '/api/vendor-profile': {
      target: commonApiBaseUrl,
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path.replace(/^\/api\/vendor-profile/, '/api/v1/vendor/profile'),
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    },
    '/api': {
      target: commonApiBaseUrl,
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
