// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  devServer: {
    port: 3001,
  },

  modules: ["@nuxt/eslint", "@nuxthub/core"],

  hub: {
    kv: true,
  },

  $development: {
    hub: {
      remote: true,
    },
  },
});
