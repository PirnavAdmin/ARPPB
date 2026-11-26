import https from 'node:https'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const commonApiBaseUrl =
    env.VITE_API_BASE_URL ||
    'https://zodiac-excursion-rendition.ngrok-free.dev'

  const farmerCropsApiBaseUrl =
    env.VITE_FARMER_CROPS_API_BASE_URL ||
    commonApiBaseUrl

  // Disable keepAlive on the proxy HTTPS agent to prevent Node 19+/20+/22+
  // from reusing stale/closing ngrok TLS sockets (which causes "Error: socket hang up").
  const proxyHttpsAgent = new https.Agent({
    keepAlive: false,
    rejectUnauthorized: false,
  })

  const configureProxy = (proxy) => {
    // Replace Vite's default noisy socket-hang-up logger with a clean JSON fallback response
    process.nextTick(() => {
      proxy.removeAllListeners('error')
      proxy.on('error', (err, _req, res) => {
        if (res && !res.headersSent && typeof res.writeHead === 'function') {
          res.writeHead(502, { 'Content-Type': 'application/json' })
          res.end(
            JSON.stringify({
              success: false,
              message: 'Upstream API connection busy or reset. Retrying automatically.',
              code: err?.code || 'PROXY_SOCKET_RESET',
            })
          )
        }
      })
    })
  }

  const apiProxyConfig = {
    '/api/vendor-profile': {
      target: commonApiBaseUrl,
      changeOrigin: true,
      secure: false,
      agent: proxyHttpsAgent,
      timeout: 30000,
      proxyTimeout: 30000,
      rewrite: (path) => path.replace(/^\/api\/vendor-profile/, '/api/v1/vendor/profile'),
      headers: {
        'ngrok-skip-browser-warning': 'true',
        Connection: 'close',
      },
      configure: configureProxy,
    },
    '/api': {
      target: commonApiBaseUrl,
      changeOrigin: true,
      secure: false,
      agent: proxyHttpsAgent,
      timeout: 30000,
      proxyTimeout: 30000,
      headers: {
        'ngrok-skip-browser-warning': 'true',
        Connection: 'close',
      },
      configure: configureProxy,
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
