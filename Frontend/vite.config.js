import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const commonApiBaseUrl =
    env.VITE_API_BASE_URL ||
    'https://flatterer-exalted-anthem.ngrok-free.dev'

  const farmerCropsApiBaseUrl =
    env.VITE_FARMER_CROPS_API_BASE_URL ||
    'https://pogo-musty-monument.ngrok-free.dev'

  const farmerSalesApiBaseUrl =
    env.VITE_FARMER_SALES_API_BASE_URL ||
    farmerCropsApiBaseUrl

  const apiProxyConfig = {
    '/api/v1/farmer/crops': {
      target: farmerCropsApiBaseUrl,
      changeOrigin: true,
      secure: false,
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    },
    '/api/v1/farmer/sales': {
      target: farmerSalesApiBaseUrl,
      changeOrigin: true,
      secure: false,
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    },
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
