import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { test as base, expect } from "@playwright/test";

// Do not record query strings, fragments, headers, bodies, credentials, or console arguments.
// Unknown path segments (including account IDs) are replaced before writing diagnostics.
const routeSegments = new Set([
  "",
  "login",
  "register",
  "dashboard",
  "profile",
  "admin",
  "users",
  "marketer",
  "marketers",
  "services",
  "surveys",
  "jobs",
  "api",
  "auth",
  "logout",
]);

function safePath(rawUrl: string): string {
  try {
    const pathname = new URL(rawUrl).pathname;
    if (pathname.startsWith("/_next/")) return "/_next/:asset";
    return pathname
      .split("/")
      .map((segment) => (routeSegments.has(segment) ? segment : ":segment"))
      .join("/");
  } catch {
    return "[unavailable]";
  }
}

type Diagnostic = Record<string, string | number>;

export const test = base.extend<{ diagnostics: void }>({
  diagnostics: [
    async ({ page }, runTest, testInfo) => {
      const events: Diagnostic[] = [];
      const pageErrors: string[] = [];
      let droppedEvents = 0;
      const record = (event: Diagnostic) => {
        if (events.length < 250) events.push({ elapsedMs: Date.now() - started, ...event });
        else droppedEvents += 1;
      };
      const started = Date.now();
      page.on("console", (message) => {
        const location = message.location();
        record({
          event: "console",
          level: message.type(),
          path: safePath(location.url),
          line: location.lineNumber,
        });
      });
      page.on("pageerror", (error) => {
        // Error messages and stacks can contain user input; the trace supplies local context.
        pageErrors.push(error.name);
        record({ event: "pageerror", name: error.name });
      });
      page.on("request", (request) => {
        record({ event: "request", method: request.method(), path: safePath(request.url()) });
      });
      page.on("response", (response) => {
        const requestId = response.headers()["x-request-id"];
        record({
          event: "response",
          path: safePath(response.url()),
          status: response.status(),
          ...(requestId && /^[A-Za-z0-9._-]{1,128}$/.test(requestId) ? { requestId } : {}),
        });
      });
      page.on("requestfailed", (request) => {
        record({ event: "requestfailed", method: request.method(), path: safePath(request.url()) });
      });
      try {
        await runTest();
        if (testInfo.status === testInfo.expectedStatus) {
          const path = testInfo.outputPath("public-state.png");
          await page.screenshot({ path, fullPage: true });
          await testInfo.attach("public-state", { path, contentType: "image/png" });
        }
      } finally {
        const path = testInfo.outputPath("browser-diagnostics.json");
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, JSON.stringify({ events, droppedEvents }, null, 2));
        await testInfo.attach("browser-diagnostics", {
          path,
          contentType: "application/json",
        });
      }
      expect(pageErrors, "The real browser should have no uncaught application errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
