import { defineNuxtConfig } from "nuxt";

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  css: ["vuetify/lib/styles/main.sass", "mdi/css/materialdesignicons.min.css"],
  modules: ["@pinia/nuxt", "@vueuse/nuxt", "@unocss/nuxt"],
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
      meta: [
        {
          name: "description",
          content:
            "A reddit viewer for image based subreddits. Lays out the images in a tight lattice.",
        },
        {
          name: "theme-color",
          content: "#000000",
        },
      ],
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
