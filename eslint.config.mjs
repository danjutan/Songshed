// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  files: ["**/*.vue"],
  rules: {
    "vue/require-v-for-key": "off",
    "vue/html-self-closing": ["error", {
      "html": {
        "void": "always", // match prettier
        "normal": "always",
        "component": "always"
      },
      "svg": "always",
      "math": "always"
    }]
  },
},
)
