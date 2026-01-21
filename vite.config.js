import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: process.env.UI_API_PROXY_TARGET || "http://localhost:3001",
        changeOrigin: true,
        secure: false, // Cho phép self-signed certificates nếu có
        // Đảm bảo query params được forward
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, res) => {
            console.error('[Vite Proxy] Proxy error:', err.message);
            console.error('[Vite Proxy] Request URL:', req.url);
            console.error('[Vite Proxy] Make sure backend server is running on port 3001');
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Log tất cả API requests để debug
            if (process.env.DEBUG_PROXY === 'true') {
              console.log('[Vite Proxy] Forwarding:', req.method, req.url, '→', proxyReq.path);
            }
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            // Log response status cho tất cả requests
            if (process.env.DEBUG_PROXY === 'true' || proxyRes.statusCode >= 400) {
              console.log('[Vite Proxy] Response:', proxyRes.statusCode, req.method, req.url);
            }
          });
        },
      },
    },
  },
});
