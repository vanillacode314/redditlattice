importScripts("/third_party/workbox-v6.5.4/workbox-sw.js");
importScripts("/third_party/idb-keyval.js");

workbox.setConfig({
  modulePathPrefix: "/third_party/workbox-v6.5.4/",
});

const IDB_LRU_CACHE_KEY = "image-assets";

workbox.routing.registerRoute(
  ({ request, url }) =>
    request.destination === "image" &&
    url.origin === "https://redditlattice-server-production.up.railway.app",
  new workbox.strategies.CacheFirst({
    cacheName: "images-assets",
    fetchOptions: {
      mode: "cors",
    },
    plugins: [
      {
        cacheDidUpdate: async ({ request, response }) => {
          /* console.log("SERVICE-WORKER:WillUpdate", { request, response }); */
          await idbKeyval.update(IDB_LRU_CACHE_KEY, (cacheDb) => {
            cacheDb = cacheDb || { urls: [], limit: 500 };
            while (cacheDb.urls.length + 1 > cacheDb.limit) {
              const key = cacheDb.urls.unshift();
              if (key)
                caches.open("images-assets").then((cache) => {
                  cache.delete(key);
                });
            }
            if (!cacheDb.urls.includes(request.url))
              cacheDb.urls.push(request.url);
            return cacheDb;
          });
          return response;
        },
        cachedResponseWillBeUsed: async ({ request, response }) => {
          /* console.log("SERVICE-WORKER:WillBeUsed", { request, response }); */
          await idbKeyval.update(IDB_LRU_CACHE_KEY, (cacheDb) => {
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

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);
