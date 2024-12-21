// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  devServer: {
    port: 3001,
  },

  modules: ["@nuxt/eslint", "@nuxthub/core", "@vueuse/nuxt"],

  hub: {
    kv: true,
  },

  hooks: {
    "vite:extend"({ config }) {
      if (config.server && config.server.hmr) {
        // @ts-ignore
        config.server.hmr.protocol = "wss";
      }
    },
  },

  compatibilityDate: "2024-12-12",
});