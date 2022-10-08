import { get, set, update } from "idb-keyval";
import { IDB_LRU_CACHE_KEY } from "./consts";

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
        plugins: [
          {
            async cacheWillUpdate({ request, response }) {
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
            async cachedResponseWillBeUsed({ request, response }) {
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
        cacheName: "images-assets",
        fetchOptions: {
          mode: "cors",
        },
        cacheableResponse: {
          statuses: [200],
        },
      },
    },
  ],
};

module.exports = options;
