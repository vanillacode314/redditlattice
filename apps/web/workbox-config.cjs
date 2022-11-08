const BASE_DIR = process.env.NETLIFY ? 'netlify' : 'dist/public';

/** @type {Parameters<import('workbox-build').injectManifest>[0]} */
const options = {
  globDirectory: BASE_DIR,
  globPatterns: [
    '**/*.{js,webmanifest,mjs,css,ttf,svg,eot,woff,woff2,html,png,json}',
  ],
  swSrc: 'public/sw.js',
  swDest: BASE_DIR + '/sw.js',
  dontCacheBustURLsMatching: /\..*\./,
};

module.exports = options;
