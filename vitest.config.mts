import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  // MDX is compiled for the ecosystem detail pages, exactly as @next/mdx does at build time.
  plugins: [{ enforce: "pre", ...mdx({ providerImportSource: "@mdx-js/react" }) }, react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "server-only": path.resolve(import.meta.dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    // api-check tests spawn node/git/tsc and the UI tests run axe; 5 s is too tight on a loaded machine.
    testTimeout: 30_000,
    include: ["tests/unit/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: [
        "src/components/ui/**",
        "src/components/ecosystem-graphic/**",
        "src/components/site/**",
        "src/components/pwa/**",
        "src/components/brand/**",
        // The 3D scene runs in jsdom with only WebGLRenderer and the 2D canvas faked in its tests.
        "src/components/workflow-3d/**",
        "src/lib/**",
        "scripts/**/*.{js,mjs,ts}",
      ],
      exclude: ["src/lib/api/generated/**"],
      thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
    },
  },
});
