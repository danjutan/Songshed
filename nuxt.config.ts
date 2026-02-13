// https://nuxt.com/docs/api/configuration/nuxt-config

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

  compatibilityDate: "2026-02-13",
});
