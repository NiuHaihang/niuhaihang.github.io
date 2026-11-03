import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Base path is env driven so the same build works at "/" (local),
// "/<repo>/" (GitHub Pages project site) or a custom domain.
const base = process.env.VITE_BASE ?? '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Bunny Math',
        short_name: 'Bunny Math',
        description: 'Cute addition & subtraction practice for 8-year-olds.',
        theme_color: '#FFF7F0',
        background_color: '#FFF7F0',
        display: 'standalone',
        orientation: 'any',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,svg,png}'],
        cleanupOutdatedCaches: true,
        navigateFallback: `${base}index.html`,
      },
      devOptions: { enabled: false },
    }),
  ],
});
