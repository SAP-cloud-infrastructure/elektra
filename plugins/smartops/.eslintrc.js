const path = require("path")

module.exports = {
  root: true,
  extends: path.resolve(__dirname, "../../.eslintrc.json"), // base config
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  plugins: ["@typescript-eslint"],
  overrides: [
    {
      files: ["*.ts", "*.tsx"], // only TypeScript files
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: path.join(__dirname, "tsconfig.json"),
        tsconfigRootDir: __dirname,
      },
      rules: {
        "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      },
    },
    {
      files: ["*.js", "*.jsx"], // JS files parsed normally
      rules: {
        "no-console": "warn",
      },
    },
  ],
  settings: {
    react: { version: "detect" },
  },
}
