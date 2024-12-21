import pluginVue from "eslint-plugin-vue";
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
  // your custom flat configs go here, for example:
  //   {
  //   files: ['**/*.ts', '**/*.tsx'],
  //   rules: {
  //     'no-console': 'off' // allow console.log in TypeScript files
  //   }
  // },
  // {
  //   ...
  // }
  {
    rules: {
      "@stylistic/quotes": ["error", "double"],
      "@stylistic/semi": ["error", "always"],
      "@typescript-eslint/no-explicit-any": ["off"],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/unified-signatures": [
        "warn",
        {
          ignoreDifferentlyNamedParameters: true,
        },
      ],
    },
  },
  ...pluginVue.configs["flat/strongly-recommended"],
  {
    files: ["**/*.vue"],
    rules: {
      "vue/multi-word-component-names": ["off"],
      "vue/html-closing-bracket-newline": [
        "error",
        {
          singleline: "never",
          multiline: "never",
          selfClosingTag: {
            singleline: "never",
            multiline: "always",
          },
        },
      ],
      "vue/first-attribute-linebreak": "off",
      "vue/require-v-for-key": "off",
    },
  },
);
