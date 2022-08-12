import { defineNuxtConfig } from "nuxt";

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  css: ["vuetify/lib/styles/main.sass", "mdi/css/materialdesignicons.min.css"],
  modules: ["@vueuse/nuxt", "@unocss/nuxt"],
  buildModules: ["@pinia/nuxt"],
  unocss: {
    uno: false,
    icons: true,
    attributify: false,
  },
  ssr: false,
  build: {
    transpile: ["vuetify"],
  },
  vite: {
    define: {
      "process.env.DEBUG": false,
    },
  },
  app: {
    head: {
      script: [{ src: "/registerSW.js" }],
      link: [
        {
          rel: "icon",
          href: "/favicon.png",
        },
        { rel: "manifest", href: "/manifest.json" },
      ],
    },
  },
});
