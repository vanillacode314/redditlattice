const path = require("path");

const esbuild = require("esbuild");
const alias = require("esbuild-plugin-alias");

esbuild.build({
  entryPoints: ["src/server.ts"],
  outfile: "./index.cjs",
  minify: true,
  bundle: true,
  platform: "node",
  external: ["sharp"],
  plugins: [
    alias({
      "@image-server/*": path.resolve(__dirname, "./src/*"),
    }),
  ],
});
