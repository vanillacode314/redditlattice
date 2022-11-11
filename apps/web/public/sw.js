/// <reference lib="webworker" />
importScripts('/third_party/workbox/workbox-v6.5.4/workbox-sw.js')
importScripts('third_party/idb/umd.js')

const { del, set, get, entries } = idbKeyval

self.skipWaiting()
workbox.setConfig({
  modulePathPrefix: '/third_party/workbox/workbox-v6.5.4/',
})

workbox.core.clientsClaim()
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
          const key = url.searchParams.get('url')

          const oldData = await get(key)
          const newData = {
            ...Object.fromEntries(url.searchParams.entries()),
            requestUrl: request.url,
          }
          if (
            oldData?.width <= newData.width ||
            newData.format !== oldData?.format
          )
            await set(key, newData)
        },
        cacheKeyWillBeUsed: async ({ request }) => {
          async function removeFromCache() {
            await caches
              .open('images-assets')
              .then((cache) => cache.delete(requestUrl))
            await del(newURL.searchParams.get('url'))
          }

          const newURL = new URL(request.url)
          const data = await get(newURL.searchParams.get('url'))
          if (!data) return request

          const { requestUrl, width, format } = data
          if (format !== newURL.searchParams.get('format')) {
            await removeFromCache()
            return request
          }
          if (width >= +newURL.searchParams.get('width'))
            return new Request(requestUrl)
          else {
            await removeFromCache()
            return request
          }
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
