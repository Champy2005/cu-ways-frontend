import { defineConfig, devices } from "@playwright/test";

const backendURL = process.env.LIVE_BACKEND_API_URL || "http://127.0.0.1:8081";
if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(backendURL).hostname))
  throw new Error("Survey browser tests require a local development backend.");
const baseURL = "http://127.0.0.1:3103";
export default defineConfig({
  testDir: "./e2e-surveys",
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 90_000,
  expect: { timeout: 10_000 },
  outputDir: ".artifacts/verification/surveys-live",
  reporter: "list",
  use: {
    baseURL,
    channel: process.env.PLAYWRIGHT_CHANNEL,
    trace: "off",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3103",
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
