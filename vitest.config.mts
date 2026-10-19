import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

const artifactDir = resolve(process.env.VERIFY_ARTIFACT_DIR || ".artifacts/verification/unit");

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    reporters:
      mode === "verification" || process.env.VERIFY_ARTIFACT_DIR
        ? [
            ...configDefaults.reporters,
            ["json", { outputFile: resolve(artifactDir, "results.json") }],
            ["junit", { outputFile: resolve(artifactDir, "junit.xml") }],
          ]
        : configDefaults.reporters,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      reportsDirectory: process.env.VERIFY_ARTIFACT_DIR
        ? resolve(artifactDir, "coverage")
        : "./coverage",
      reportOnFailure: true,
      include: [
        "src/components/**/*.{ts,tsx}",
        "src/features/**/*.{ts,tsx}",
        "src/lib/**/*.{ts,tsx}",
      ],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/types.ts", "src/lib/api/generated/**"],
      thresholds: {
        branches: 10,
        functions: 10,
        lines: 10,
        statements: 10,
      },
    },
  },
}));
