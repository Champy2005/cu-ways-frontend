import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

/**
 * EPC-08 Payment & Financial Settlements: automated black-box tests.
 *
 * Runs the production build against a real local backend and database.
 * Needs: the backend running on LIVE_BACKEND_API_URL (default http://127.0.0.1:8081)
 * and `pnpm build` done first. See e2e-epc08/README.md.
 */
const backendURL = process.env.LIVE_BACKEND_API_URL || "http://127.0.0.1:8081";
if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(backendURL).hostname))
  throw new Error("EPC-08 tests create accounts, so they only run against a local backend.");
const baseURL = "http://127.0.0.1:3108";

export default defineConfig({
  testDir: "./e2e-epc08",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 60_000,
  expect: { timeout: 10_000 },
  outputDir: resolve(".artifacts/verification/epc08/test-results"),
  reporter: [
    ["list"],
    ["html", { outputFolder: resolve(".artifacts/verification/epc08/html"), open: "never" }],
  ],
  use: {
    baseURL,
    // Authenticated traces can contain tokens; keep them off by default.
    trace: "off",
    screenshot: "only-on-failure",
    video: "off",
    // DEMO_SLOWMO=500 slows each browser action so the audience can follow it.
    launchOptions: { slowMo: Number(process.env.DEMO_SLOWMO || 0) },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3108",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      BACKEND_API_URL: backendURL,
      FRONTEND_ORIGIN: baseURL,
      MARKETER_DEMO_ENABLED: "false",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
