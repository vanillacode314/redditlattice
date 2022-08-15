import { defineNuxtConfig } from "nuxt";

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  css: ["vuetify/lib/styles/main.sass"],
  modules: ["@pinia/nuxt", "@vueuse/nuxt", "@unocss/nuxt"],
  unocss: {
    uno: false,
    icons: true,
    attributify: false,
  },
  ssr: false,
  build: {
    transpile: ["vuetify"],
    extractCSS: true,
  },
  vite: {
    define: {
      "process.env.DEBUG": false,
    },
  },
  app: {
    head: {
      title: "RedditLattice",
      link: [
        {
          rel: "icon",
          href: "/favicon.png",
        },
        { rel: "manifest", href: "/manifest.webmanifest" },
      ],
      meta: [
        {
          name: "description",
          content:
            "A FOSS reddit viewer for image based subreddits. Lays out the images in a tight lattice. Created with NuxtJS, VueJS, and Vuetify.",
        },
        {
          name: "theme-color",
          content: "#000000",
        },
      ],
      script: [{ src: "/registerSW.js", defer: true }],
    },
  },
});
