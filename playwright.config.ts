import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT || "3100");
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error("PLAYWRIGHT_PORT must be an integer between 1024 and 65535.");
}
const baseURL = `http://127.0.0.1:${port}`;
const artifactDir = resolve(process.env.VERIFY_ARTIFACT_DIR || ".artifacts/verification/e2e");

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  outputDir: resolve(artifactDir, "test-results"),
  reporter: [
    ["list"],
    ["html", { outputFolder: resolve(artifactDir, "html"), open: "never" }],
    ["json", { outputFile: resolve(artifactDir, "results.json") }],
    ["junit", { outputFile: resolve(artifactDir, "junit.xml") }],
  ],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      FRONTEND_ORIGIN: baseURL,
      MARKETER_DEMO_ENABLED: "false",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
