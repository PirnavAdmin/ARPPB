
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const apiProxyConfig = {
    '/api/v1/middleman-profile': {
      target:
        env.VITE_MIDDLEMAN_PROFILE_API_BASE_URL ||
        'https://zodiac-excursion-rendition.ngrok-free.dev',
      changeOrigin: true,
      secure: false,
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    },
    '/api/vendor-profile': {
      target:
        env.VITE_VENDOR_PROFILE_API_BASE_URL ||
        'https://banknote-cardinal-stifle.ngrok-free.dev',
      changeOrigin: true,
      secure: false,
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    },
    '/api/customer/profile': {
      target:
        env.VITE_CUSTOMER_PROFILE_API_BASE_URL ||
        'https://flatterer-exalted-anthem.ngrok-free.dev',
      changeOrigin: true,
      secure: false,
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    },
    '/api/v1/farmer/profile': {
      target:
        env.VITE_FARMER_PROFILE_API_BASE_URL ||
        'https://pogo-musty-monument.ngrok-free.dev',
      changeOrigin: true,
      secure: false,
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    },
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
