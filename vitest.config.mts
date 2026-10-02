import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/components/ui/**", "src/lib/**", "scripts/**/*.{js,mjs,ts}"],
      exclude: ["src/lib/api/generated/**"],
      thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
    },
  },
});
