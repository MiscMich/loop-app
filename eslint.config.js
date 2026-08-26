// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    rules: {
      // React Native Text safely renders apostrophes and quotes as text nodes.
      "react/no-unescaped-entities": "off",
    },
  },
  // Jest test files configuration
  {
    files: ["**/__tests__/**/*.[jt]s?(x)", "**/*.test.[jt]s?(x)", "**/*.spec.[jt]s?(x)"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        jest: "readonly",
      },
    },
  },
]);
