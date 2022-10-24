/** @type {Parameters<import('workbox-build').generateSW>[0]} */
const options = {
  skipWaiting: true,
  globDirectory: 'netlify',
  globPatterns: [
    '**/*.{js,webmanifest,mjs,css,ttf,svg,eot,woff,woff2,html,png,json}',
  ],
  swDest: 'netlify/sw.js',
  dontCacheBustURLsMatching: /\..*\./,
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
  runtimeCaching: [
    {
      urlPattern: ({ request, url }) =>
        request.destination === 'image' &&
        url.origin === 'https://redditlattice-server-production.up.railway.app',
      handler: 'CacheFirst',

      options: {
        cacheName: 'images-assets',
        plugins: [
          {
            cacheKeyWillBeUsed: async ({ request }) => {
              const cache = await caches.open('images-assets');
              const keys = await cache.keys();

              for (const response of keys) {
                const oldUrl = new URL(response.url);
                const newUrl = new URL(request.url);
                const oldAsset = oldUrl.searchParams.get('url');
                const newAsset = newUrl.searchParams.get('url');
                if (oldAsset !== newAsset) continue;

                const oldWidth = +oldUrl.searchParams.get('width');
                const newWidth = +newUrl.searchParams.get('width');
                if (newWidth <= oldWidth) return new Request(oldUrl);
                cache.delete(oldUrl);
              }

              return request;
            },
          },
        ],
        cacheableResponse: {
          statuses: [200],
        },
        expiration: {
          maxEntries: 1000,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
        fetchOptions: {
          mode: 'cors',
        },
      },
    },
  ],
};

module.exports = options;
