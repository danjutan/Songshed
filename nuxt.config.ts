// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  devServer: {
    port: 3001,
  },
  modules: [
    "@nuxt/eslint",
  ],
  eslint: {
    config: {
      // the stylistic config object doesn't actually do anything, so just set true
      stylistic: true,
    },
  },
});
