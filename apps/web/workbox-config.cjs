/** @type {Parameters<import('workbox-build').generateSW>[0]} */
const BASE_DIR = 'netlify';

const options = {
  skipWaiting: true,
  globDirectory: BASE_DIR,
  globPatterns: [
    '**/*.{js,webmanifest,mjs,css,ttf,svg,eot,woff,woff2,html,png,json}',
  ],
  swDest: BASE_DIR + '/sw.js',
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
              console.time(request.url);
              return await caches
                .open('images-assets')
                .then((cache) => cache.keys())
                .then((keys) => {
                  console.time(request.url + 'loop');
                  for (const response of keys) {
                    const oldUrl = new URL(response.url);
                    const newUrl = new URL(request.url);
                    const oldAsset = oldUrl.searchParams.get('url');
                    const newAsset = newUrl.searchParams.get('url');
                    if (oldAsset !== newAsset) continue;

                    const oldWidth = +oldUrl.searchParams.get('width');
                    const newWidth = +newUrl.searchParams.get('width');
                    if (newWidth <= oldWidth) {
                      console.timeEnd(request.url + 'loop');
                      console.timeEnd(request.url);
                      return new Request(oldUrl);
                    }
                    cache.delete(oldUrl);
                  }
                  console.timeEnd(request.url + 'loop');
                  console.timeEnd(request.url);
                  return request;
                });
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
