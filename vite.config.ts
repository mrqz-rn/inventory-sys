import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    server: {
      port: 3001,
      host: '0.0.0.0',
    },

    plugins: [
      react(),

      VitePWA({
        registerType: 'autoUpdate',
        // Use our hand-crafted service worker instead of Workbox's generated one
        strategies: 'injectManifest',
        srcDir: 'public',
        filename: 'service-worker.js',
        injectManifest: {
          injectionPoint: undefined, // We manage caching manually
        },
        includeAssets: ['favicon.ico'],

        manifest: {
          name: 'Nexus Warehouse Pro',
          short_name: 'Nexus',
          description: 'Offline-first warehouse inventory management',
          theme_color: '#4f46e5',
          background_color: '#f8fafc',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          orientation: 'any',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
      }),
    ],

    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});