// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from "@primevue/themes/aura";
import Material from "@primevue/themes/material";

export default defineNuxtConfig({
  devtools: { enabled: true },

  devServer: {
    port: 3001,
  },

  modules: [
    "@nuxt/eslint",
    "@vueuse/nuxt",
    "@primevue/nuxt-module",
    "@nuxt/fonts",
    "@nuxthub/core",
  ],

  hub: {
    kv: true,
  },

  primevue: {
    options: {
      // theme: {
      //   preset: Aura,
      // },
    },
    importTheme: { from: "@/themes/theme.ts" },
  },

  compatibilityDate: "2024-12-12",
});
