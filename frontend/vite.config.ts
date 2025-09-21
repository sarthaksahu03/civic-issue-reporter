import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import mkcert from 'vite-plugin-mkcert';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    plugins: [
      react(),
      // HTTPS certificates for local development
      mkcert(),
      VitePWA({
        devOptions: {
          enabled: false, // disable SW in dev to prevent request interception
        },
        registerType: 'prompt',
        injectRegister: null, // we'll manually register in src/main.tsx
        // Only set up Workbox precaching for production builds to avoid dev warnings
        ...(isDev
          ? {}
          : {
              workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg}'],
                navigateFallback: '/index.html',
                runtimeCaching: [
                  {
                    urlPattern: ({ request }) => request.destination === 'document',
                    handler: 'NetworkFirst',
                    options: {
                      cacheName: 'html-cache',
                    },
                  },
                  {
                    urlPattern: ({ request }) => request.destination === 'script' || request.destination === 'style',
                    handler: 'StaleWhileRevalidate',
                    options: {
                      cacheName: 'asset-cache',
                    },
                  },
                  {
                    urlPattern: ({ request }) => request.destination === 'image',
                    handler: 'CacheFirst',
                    options: {
                      cacheName: 'image-cache',
                      expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
                    },
                  },
                ],
              },
            }),
        includeAssets: ['favicon.ico', 'icons/icon-192.png', 'icons/icon-512.png'],
        manifest: {
          name: 'CivicEyes - Public Grievance Reporter',
          short_name: 'CivicEyes',
          description: 'Report and track public grievances with offline support.',
          theme_color: '#0ea5e9',
          background_color: '#0ea5e9',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icons/icon-192-maskable.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/icons/icon-512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ],
        },
      }),
    ],
    server: {
      // Cast to any to satisfy types in strict environments; mkcert injects certs.
      https: true as any,
      host: true, // expose on LAN
    },
    base: './',
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
