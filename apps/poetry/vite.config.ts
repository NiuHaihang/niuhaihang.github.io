import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const base = process.env.VITE_BASE ?? '/';

export default defineConfig({
  base,
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
    manifest: {
      name: '小兔古诗词 · 读诗小花园', short_name: '小兔古诗词',
      description: '和麻薯一起听诗、读诗、背诗。',
      theme_color: '#FFF7F0', background_color: '#FFF7F0',
      display: 'standalone', start_url: base, scope: base,
      icons: [
        { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      navigateFallback: `${base}index.html`,
      // Download only the open poem's full reading and selected verse, never
      // precache the library. Complete files also support offline byte ranges.
      runtimeCaching: [{
        urlPattern: /\/audio\/poems\/poem-\d+\/(?:full|\d+)\.mp3$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'bunny-poetry-audio-v1', cacheableResponse: { statuses: [200] },
          rangeRequests: true,
          expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      }],
    },
  })],
});
