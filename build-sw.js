const { injectManifest } = require("workbox-build");

/** @type {Parameters<import('workbox-build').injectManifest>[0]} */
const options = {
  globDirectory: "dist",
  globPatterns: ["**/*.{mjs,css,ttf,svg,eot,woff,woff2,html,png,json}"],
  swDest: "dist/sw.js",
  swSrc: "./sw.js",
};

injectManifest(options).then(({ count, size, warnings }) => {
  if (warnings.length > 0) {
    console.warn(
      "Warnings encountered while injecting the manifest:",
      warnings.join("\n")
    );
  }

  console.log(
    `Injected a manifest which will precache ${count} files, totaling ${size} bytes.`
  );
});
