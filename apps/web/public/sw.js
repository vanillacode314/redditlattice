/// <reference lib="webworker" />
importScripts('/third_party/workbox/workbox-v6.5.4/workbox-sw.js')

let CACHE

self.skipWaiting()

workbox.setConfig({
  modulePathPrefix: '/third_party/workbox/workbox-v6.5.4/',
})

workbox.loadModule('workbox-expiration')
workbox.loadModule('workbox-cacheable-response')

workbox.routing.registerRoute(
  ({ request, url }) =>
    request.destination === 'image' &&
    url.origin === 'https://redditlattice-server-production.up.railway.app',
  new workbox.strategies.CacheFirst({
    cacheName: 'images-assets',
    fetchOptions: {
      mode: 'cors',
    },
    plugins: [
      {
        cacheKeyWillBeUsed: async ({ request }) => {
          if (!CACHE) CACHE = caches.open('images-assets')
          const cache = await CACHE
          console.time(request.url)
          const keys = await cache.keys()

          console.time(request.url + 'loop')
          for (const response of keys) {
            const oldUrl = new URL(response.url)
            const newUrl = new URL(request.url)
            const oldAsset = oldUrl.searchParams.get('url')
            const newAsset = newUrl.searchParams.get('url')
            if (oldAsset !== newAsset) continue

            const oldWidth = +oldUrl.searchParams.get('width')
            const newWidth = +newUrl.searchParams.get('width')
            if (newWidth <= oldWidth) {
              console.timeEnd(request.url + 'loop')
              console.timeEnd(request.url)
              return new Request(oldUrl)
            }
            cache.delete(oldUrl)
          }
          console.timeEnd(request.url + 'loop')
          console.timeEnd(request.url)
          return request
        },
      },
      new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses: [200],
      }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 1000,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
)

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST)
