// eslint.config.js
import js from "@eslint/js"
import typescript from "@typescript-eslint/eslint-plugin"
import typescriptParser from "@typescript-eslint/parser"
import react from "eslint-plugin-react"
import reactHooks from "eslint-plugin-react-hooks"

export default [
  // Ignore common directories
  {
    ignores: ["*", "!plugins", "plugins/*", "!plugins/kubernetes_ng", "!plugins/smartops"],
  },

  // JavaScript/JSX files
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        // Browser/DOM globals
        window: "readonly",
        document: "readonly",
        console: "readonly",
        navigator: "readonly", // Add navigator
        HTMLElement: "readonly", // Add HTMLElement
        HTMLDivElement: "readonly", // Add HTMLDivElement
        RequestInit: "readonly", // Add RequestInit
        Response: "readonly",
        fetch: "readonly",

        // Vitest globals
        describe: "readonly",
        it: "readonly",
        test: "readonly", // Add test
        expect: "readonly",
        vi: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
    },
    rules: {
      ...js.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": "warn",
      "no-debugger": "error",
    },
    settings: {
      react: { version: "detect" },
    },
  },

  // TypeScript/TSX files
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        // Browser/DOM globals
        window: "readonly",
        document: "readonly",
        console: "readonly",
        navigator: "readonly", // Add navigator
        HTMLElement: "readonly", // Add HTMLElement
        HTMLDivElement: "readonly", // Add HTMLDivElement
        RequestInit: "readonly", // Add RequestInit
        Response: "readonly",
        fetch: "readonly",

        // Vitest globals
        describe: "readonly",
        it: "readonly",
        test: "readonly", // Add test
        expect: "readonly",
        vi: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
      react,
      "react-hooks": reactHooks,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...typescript.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "no-unused-vars": "off",
      "no-console": "warn",
      "no-debugger": "error",
      "no-undef": "off", // Turn off for TypeScript files - TS handles this better
    },
    settings: {
      react: { version: "detect" },
    },
  },

  // Test files
  {
    files: ["**/*.test.{js,jsx,ts,tsx}"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-undef": "off", // TypeScript handles undefined variables
    },
  },
]
