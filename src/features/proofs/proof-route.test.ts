import { beforeEach, describe, expect, it, vi } from "vitest";
import { isAllowedFrontendOrigin } from "@/lib/auth/origin";
import { checkJobProofs, saveJobProof } from "./proof-actions";
import { checkProofsRoute, saveProofRoute } from "./proof-route";

vi.mock("@/lib/auth/origin", () => ({ isAllowedFrontendOrigin: vi.fn() }));
vi.mock("./proof-actions", () => ({ saveJobProof: vi.fn(), checkJobProofs: vi.fn() }));

function post(body: string) {
  return new Request("http://localhost:3000/api/jobs/7/proofs", {
    method: "POST",
    headers: { Origin: "http://localhost:3000", "Content-Type": "application/json" },
    body,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(isAllowedFrontendOrigin).mockReturnValue(true);
});

describe("proof API route", () => {
  it("saves the proof and returns the result without caching", async () => {
    vi.mocked(saveJobProof).mockResolvedValue({ status: "saved" });
    const response = await saveProofRoute(post(JSON.stringify({ url: "https://x.test/a" })), "7");
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ status: "success", data: { status: "saved" } });
    expect(saveJobProof).toHaveBeenCalledExactlyOnceWith(7, "https://x.test/a");
  });

  it("refuses a save from another origin without touching the backend", async () => {
    vi.mocked(isAllowedFrontendOrigin).mockReturnValue(false);
    expect((await saveProofRoute(post("{}"), "7")).status).toBe(403);
    expect(saveJobProof).not.toHaveBeenCalled();
  });

  it.each(["0", "abc", "7.5", "-3", "99999999999"])("rejects job id %s", async (id) => {
    expect((await saveProofRoute(post("{}"), id)).status).toBe(422);
    expect((await checkProofsRoute(id)).status).toBe(422);
    expect(saveJobProof).not.toHaveBeenCalled();
    expect(checkJobProofs).not.toHaveBeenCalled();
  });

  it("rejects a body that is not JSON", async () => {
    expect((await saveProofRoute(post("not json"), "7")).status).toBe(422);
    expect(saveJobProof).not.toHaveBeenCalled();
  });

  it("returns the checked list", async () => {
    vi.mocked(checkJobProofs).mockResolvedValue({ status: "ok", proofs: [] });
    const response = await checkProofsRoute("7");
    expect(await response.json()).toEqual({
      status: "success",
      data: { status: "ok", proofs: [] },
    });
    expect(checkJobProofs).toHaveBeenCalledExactlyOnceWith(7);
  });
});
