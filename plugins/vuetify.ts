import { createVuetify, ThemeDefinition } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

const myDarkTheme: ThemeDefinition = {
  dark: true,
  colors: {
    background: "#000000",
    surface: "#000000",
  },
};

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    theme: {
      defaultTheme: "myDarkTheme",
      themes: {
        myDarkTheme,
      },
    },
    components,
    directives,
  });

  nuxtApp.vueApp.use(vuetify);
});
