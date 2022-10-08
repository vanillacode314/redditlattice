/** @type {Parameters<import('workbox-build').generateSW>[0]} */
const options = {
  globDirectory: "dist",
  globPatterns: [
    "**/*.{js,webmanifest,mjs,css,ttf,svg,eot,woff,woff2,html,png,json}",
  ],
  swDest: "dist/sw.js",
  dontCacheBustURLsMatching: /\..*\./,
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
          maxEntries: 1000,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
        fetchOptions: {
          mode: "cors",
        },
      },
    },
  ],
};

module.exports = options;
