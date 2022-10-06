import VueGtag from "vue-gtag";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueGtag, {
    config: {
      id: "G-XDR9E19TGZ",
      params: {
        cookie_domain: window.location.hostname,
        cookie_flags: "SameSite=None;Secure",
      },
    },
  });
});
