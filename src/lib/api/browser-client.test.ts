import { afterEach, describe, expect, it, vi } from "vitest";
import { browserApiRequest } from "./browser-client";

afterEach(() => vi.unstubAllGlobals());

describe("browser API responses", () => {
  it("accepts an empty successful deletion response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(
      browserApiRequest<void>("/api/services/1", { method: "DELETE" }),
    ).resolves.toBeUndefined();
  });

  it("still rejects empty unsuccessful responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 403 })));
    await expect(browserApiRequest("/api/services/1")).rejects.toMatchObject({ status: 403 });
  });
});
