import { defineNuxtConfig } from "nuxt";

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  css: ["vuetify/lib/styles/main.sass", "mdi/css/materialdesignicons.min.css"],
  modules: ["@pinia/nuxt", "@vueuse/nuxt"],
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
