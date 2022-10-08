const { update } = require("idb-keyval");

const IDB_LRU_CACHE_KEY = "image-assets";
/** @type {Parameters<import('workbox-build').generateSW>[0]} */
const options = {
  globDirectory: "dist",
  globPatterns: ["**/*.{mjs,css,ttf,svg,eot,woff,woff2,html,png,json}"],
  swDest: "dist/sw.js",
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
  runtimeCaching: [
    {
      urlPattern: ({ request, url }) =>
        request.destination === "image" &&
        url.origin === "https://redditlattice-server-production.up.railway.app",
      handler: "CacheFirst",
      options: {
        cacheName: "images-assets",
        fetchOptions: {
          mode: "cors",
        },
        plugins: [
          {
            cacheWillUpdate: async ({ request, response }) => {
              await update(IDB_LRU_CACHE_KEY, async (cacheDb) => {
                cacheDb = cacheDb || { urls: [], limit: 500 };
                if (cacheDb.urls.length + 1 > cacheDb.limit) {
                  const cache = await caches.open("images-assets");
                  cache.delete(cacheDb.urls.unshift());
                }
                cacheDb.urls.push(request.url);
                return cacheDb;
              });
              return response;
            },
            cachedResponseWillBeUsed: async ({ request, response }) => {
              await update(IDB_LRU_CACHE_KEY, async (cacheDb) => {
                cacheDb = cacheDb || { urls: [], limit: 500 };
                cacheDb.urls = cacheDb.urls.filter((url) => url != request.url);
                cacheDb.urls.push(request.url);
                return cacheDb;
              });
              return response;
            },
          },
        ],
      },
    },
  ],
};

module.exports = options;
