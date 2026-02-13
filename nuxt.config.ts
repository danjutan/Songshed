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
    kv: {
      driver: "cloudflare-kv-binding",
      namespaceId: "14d4165918f64f2e989b109c372afffb",
    },
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
