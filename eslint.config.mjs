import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import sonarjs from "eslint-plugin-sonarjs";
import { clientServerBoundary } from "./scripts/eslint-boundaries.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    plugins: {
      sonarjs,
      cuways: { rules: { "client-server-boundary": clientServerBoundary } },
    },
    rules: {
      complexity: ["error", 20],
      "max-depth": ["error", 4],
      "sonarjs/cognitive-complexity": ["error", 15],
      "sonarjs/no-identical-functions": "error",
      "cuways/client-server-boundary": "error",
    },
  },
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    ".artifacts/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
