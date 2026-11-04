import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const base = process.env.VITE_BASE ?? '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: '小兔语文 · 认字乐园',
        short_name: '小兔语文',
        description: '一到六年级人教版字表识字，和麻薯一起认汉字。',
        theme_color: '#FFF7F0',
        background_color: '#FFF7F0',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: `${base}index.html`,
        // Fetch only the current reading; retain complete files for subsequent
        // plays and let the media element request ranges from those cached files.
        runtimeCaching: [{
          urlPattern: /\/audio\/readings\/[^/]+\.mp3$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'bunny-chinese-audio-v1',
            cacheableResponse: { statuses: [200] },
            rangeRequests: true,
            expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 365 },
          },
        }],
      },
    }),
  ],
});
