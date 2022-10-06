export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.compilerOptions = {
    isCustomElement: (tag) => tag.includes("-"),
  };
});
