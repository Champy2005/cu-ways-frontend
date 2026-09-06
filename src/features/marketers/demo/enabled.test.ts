import { afterEach, describe, expect, it, vi } from "vitest";
import { isMarketerDemoEnabled } from "./enabled";

afterEach(() => vi.unstubAllEnvs());
describe("demo availability", () => {
  it("requires explicit opt-in outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("MARKETER_DEMO_ENABLED", "false");
    expect(isMarketerDemoEnabled()).toBe(false);
    vi.stubEnv("MARKETER_DEMO_ENABLED", "true");
    expect(isMarketerDemoEnabled()).toBe(true);
  });
  it("cannot be enabled in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MARKETER_DEMO_ENABLED", "true");
    expect(isMarketerDemoEnabled()).toBe(false);
  });
});
