import { describe, expect, it } from "vitest";
import { safeReturnPath } from "./workspace";

describe("login return destinations", () => {
  it.each(["/creator/jobs/41/offers", "/marketer/offers?tab=pending", "/surveys/new"])(
    "retains protected destination %s",
    (path) => {
      expect(safeReturnPath(path)).toBe(path);
    },
  );
  it.each([
    null,
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "/api/auth/login",
    "/login",
    "/creator\n/evil",
  ])("rejects unsafe or irrelevant destinations %s", (path) => {
    expect(safeReturnPath(path)).toBeNull();
  });
});
