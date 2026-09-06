import { beforeEach, describe, expect, it, vi } from "vitest";
import { serverApiGet } from "./server-client";

const mocks = vi.hoisted(() => ({ fetchBackend: vi.fn(), getSession: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getSession: mocks.getSession }));
vi.mock("@/lib/api/backend-client", () => ({
  fetchBackend: mocks.fetchBackend,
  readBackendPayload: (response: Response) => response.json(),
}));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSession.mockResolvedValue({ token: "test-token" });
});

describe("server API envelope handling", () => {
  it("rejects a successful response without a data envelope", async () => {
    mocks.fetchBackend.mockResolvedValue(Response.json({ status: "success" }));
    await expect(serverApiGet("/api/v1/marketers/me")).rejects.toMatchObject({
      code: "request_failed",
    });
  });
  it("preserves explicit nullable data and forwards the server session", async () => {
    mocks.fetchBackend.mockResolvedValue(Response.json({ status: "success", data: null }));
    await expect(serverApiGet<null>("/nullable")).resolves.toBeNull();
    const headers = mocks.fetchBackend.mock.calls[0][1].headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer test-token");
  });
});
