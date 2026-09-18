import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'knust-ecounselling-icon-180.png',
        'knust-ecounselling-icon-192.png',
        'knust-ecounselling-icon-512.png',
        'knust-ecounselling-icon-maskable-192.png',
        'knust-ecounselling-icon-maskable-512.png',
      ],
      manifest: {
        name: 'MindConnect Admin',
        short_name: 'MindConnect Admin',
        description: 'MindConnect wellbeing administration portal.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        theme_color: '#790314',
        background_color: '#f8fafc',
        icons: [
          { src: '/knust-ecounselling-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/knust-ecounselling-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/knust-ecounselling-icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/knust-ecounselling-icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
          {
            urlPattern: ({ request, url }) =>
              request.method !== 'GET' || url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
