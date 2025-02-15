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
    "@nuxthub/core",
    "@vueuse/nuxt",
    "@primevue/nuxt-module",
  ],

  primevue: {
    options: {
      // theme: {
      //   preset: Aura,
      // },
    },
    importTheme: { from: "@/themes/theme.ts" },
  },

  hub: {
    kv: true,
  },

  hooks: {
    // Uncomment for IDX:
    // "vite:extend"({ config }) {
    //   if (config.server && config.server.hmr) {
    //     // @ts-ignore
    //     config.server.hmr.protocol = "wss";
    //   }
    // },
  },

  compatibilityDate: "2024-12-12",
});
