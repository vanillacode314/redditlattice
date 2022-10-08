const { update } = require("idb-keyval");
const { registerRoute, Route } = require("workbox-routing");
const { CacheFirst } = require("workbox-strategies");
const { precacheAndRoute } = require("workbox-precaching");

const IDB_LRU_CACHE_KEY = "image-assets";

registerRoute(
  ({ request, url }) =>
    request.destination === "image" &&
    url.origin === "https://redditlattice-server-production.up.railway.app",
  new CacheFirst({
    cacheName: "image-assets",
    fetchOptions: {
      mode: "cors",
    },
    plugins: [
      {
        cacheWillUpdate: async ({ request, response }) => {
          console.log("SERVICE-WORKER:WillUpdate", { request, response });
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
          console.log("SERVICE-WORKER:WillBeUsed", { request, response });
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
  })
);

precacheAndRoute(self.__WB_MANIFEST);
