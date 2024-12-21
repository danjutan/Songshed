// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    rules: {
      "@typescript-eslint/unified-signatures": [
        "warn",
        {
          ignoreDifferentlyNamedParameters: true,
        },
      ],
    }
  },
  {
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
