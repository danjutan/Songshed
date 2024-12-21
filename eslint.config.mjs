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
    },
  },
  ...pluginVue.configs["flat/strongly-recommended"],
  {
    files: ["**/*.vue"],
    rules: {
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
    },
  },
);
