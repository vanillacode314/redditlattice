/// <reference lib="webworker" />
importScripts('/third_party/workbox/workbox-v6.5.4/workbox-sw.js')
importScripts('third_party/idb/umd.js')

const { del, set, get, entries } = idbKeyval

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
        cacheDidUpdate: async ({ request }) => {
          const url = new URL(request.url)
          await set(
            JSON.stringify(Object.fromEntries(url.searchParams.entries())),
            request.url
          )
        },
        cacheKeyWillBeUsed: async ({ request }) => {
          const keys = await entries()

          for (const [data, response] of keys) {
            const newURL = new URL(request.url)
            const { url, width, format } = JSON.parse(data)
            if (format !== newURL.searchParams.get('format')) continue
            if (url !== newURL.searchParams.get('url')) continue
            if (width > +newURL.searchParams.get('width')) {
              return new Request(response)
            }
            caches.open('images-assets').then((cache) => cache.delete(url))
          }
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
