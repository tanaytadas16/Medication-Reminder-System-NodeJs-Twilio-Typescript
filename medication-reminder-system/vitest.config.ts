// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/types/**", "**/*.d.ts"],
    },
    setupFiles: ["./tests/setup.ts"],
  },
});
