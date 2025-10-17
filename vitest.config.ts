import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./setupVitestMock.js", "./vitest.setup.ts"],
    include: ["**/*.test.{js,jsx,ts,tsx}"],
    exclude: ["node_modules", "vendor"],
    globals: true,
  },
  resolve: {
    alias: {
      ajax_helper: path.resolve(__dirname, "app/javascript/lib/ajax_helper.js"),
      testHelper: path.resolve(__dirname, "app/javascript/test/support/testHelper.js"),
      lib: path.resolve(__dirname, "app/javascript/lib"),
      core: path.resolve(__dirname, "app/javascript/core"),
      plugins: path.resolve(__dirname, "plugins"),
      config: path.resolve(__dirname, "config"),
    },
  },
})
