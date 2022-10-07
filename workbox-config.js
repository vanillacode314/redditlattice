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
        expiration: {
          maxEntries: 250,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        },
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
