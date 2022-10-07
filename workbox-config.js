/** @type {Parameters<import('workbox-build').generateSW>[0]} */
const options = {
  globDirectory: "dist",
  globPatterns: ["**/*.{mjs,css,ttf,svg,eot,woff,woff2,html,png,json}"],
  swDest: "dist/sw.js",
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.destination === "image",
      handler: "CacheFirst",
      options: {
        cacheName: "images-assets",
        expiration: {
          maxEntries: 250,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        },
      },
    },
  ],
};

module.exports = options;
