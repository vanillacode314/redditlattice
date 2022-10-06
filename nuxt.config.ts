// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  experimental: {
    reactivityTransform: true,
  },
  ssr: false,
  modules: ["@pinia/nuxt", "@vueuse/nuxt", "@unocss/nuxt"],
  css: ["@unocss/reset/tailwind.css"],
  unocss: {
    uno: true,
    icons: true,
    attributify: true,
    webFonts: {
      provider: "google",
      fonts: {
        sans: "Roboto",
      },
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
