import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchBackend } from "@/lib/api/backend-client";
import { ApiError } from "@/lib/api/errors";
import { isAllowedFrontendOrigin } from "@/lib/auth/origin";
import { getSession } from "@/lib/auth/session";
import {
  listInvitations,
  listMarketerOffers,
  mutateInvitation,
  withdrawOfferRoute,
} from "./api-route";
import { getInvitations, getMarketerOffers } from "./api";
import { invitationEntry, receivedRequest, savedOffer } from "./test-fixtures";

vi.mock("@/lib/api/backend-client", () => ({
  fetchBackend: vi.fn(),
  readBackendPayload: async (response: Response) => response.json().catch(() => null),
}));
vi.mock("@/lib/auth/origin", () => ({ isAllowedFrontendOrigin: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn() }));
vi.mock("./api", () => ({ getInvitations: vi.fn(), getMarketerOffers: vi.fn() }));
function request(body?: unknown) {
  return new Request("http://localhost:3000/api/job-requests/7/offers", {
    method: "POST",
    headers: { Origin: "http://localhost:3000" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(isAllowedFrontendOrigin).mockReturnValue(true);
  vi.mocked(getSession).mockResolvedValue({
    token: "test-session",
    userId: 2,
    role: "user",
    expiresAt: 9999999999,
  });
});

describe("live invitation BFF", () => {
  it("serves fresh authenticated offer history and preserves upstream failures", async () => {
    const snapshot = {
      offers: [{ request: receivedRequest(), offer: savedOffer() }],
      offersUnavailable: false,
    };
    vi.mocked(getMarketerOffers).mockResolvedValue(snapshot);
    const response = await listMarketerOffers();
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ status: "success", data: snapshot });
    vi.mocked(getMarketerOffers).mockRejectedValue(new ApiError(403, "forbidden", "Forbidden"));
    expect((await listMarketerOffers()).status).toBe(403);
    vi.mocked(getSession).mockResolvedValue(null);
    expect((await listMarketerOffers()).status).toBe(401);
    expect(getMarketerOffers).toHaveBeenCalledTimes(2);
  });

  it.each([
    { ...savedOffer("Withdrawn"), offer_id: 99 },
    { ...savedOffer("Withdrawn"), marketer_id: 99 },
    savedOffer("Pending"),
  ])("rejects a withdrawal success with the wrong identity or status", async (offer) => {
    vi.mocked(fetchBackend).mockResolvedValue(Response.json({ status: "success", data: offer }));
    expect((await withdrawOfferRoute(request(), "5")).status).toBe(502);
  });

  it("requires the frontend origin and session before forwarding mutations", async () => {
    vi.mocked(isAllowedFrontendOrigin).mockReturnValue(false);
    expect((await mutateInvitation(request(), "7", "accept")).status).toBe(403);
    vi.mocked(isAllowedFrontendOrigin).mockReturnValue(true);
    vi.mocked(getSession).mockResolvedValue(null);
    expect((await mutateInvitation(request(), "7", "accept")).status).toBe(401);
    expect(fetchBackend).not.toHaveBeenCalled();
  });
  it("rejects invalid IDs, JSON, and owner fields", async () => {
    expect((await mutateInvitation(request(), "0", "accept")).status).toBe(422);
    expect((await mutateInvitation(request(), "7", "decline")).status).toBe(422);
    expect(
      (await mutateInvitation(request({ reason: null, note: "", user_id: 9 }), "7", "decline"))
        .status,
    ).toBe(422);
    expect(fetchBackend).not.toHaveBeenCalled();
  });
  it("forwards decimal strings with the server token and sanitizes the result", async () => {
    const body = {
      offered_price: "9000.00",
      delivery_date: "2099-10-25",
      message: "Faculty groups",
    };
    vi.mocked(fetchBackend).mockResolvedValue(
      Response.json(
        { status: "success", data: { ...savedOffer(), access_token: "must-not-escape" } },
        { status: 201 },
      ),
    );
    const response = await mutateInvitation(request(body), "7", "offers");
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ status: "success", data: savedOffer() });
    expect(fetchBackend).toHaveBeenCalledWith(
      "/api/v1/me/job-requests/7/offers",
      expect.objectContaining({
        headers: { Authorization: "Bearer test-session" },
        body: JSON.stringify(body),
      }),
    );
  });
  it("saves responses and normalizes empty decline notes", async () => {
    vi.mocked(fetchBackend).mockResolvedValue(
      Response.json({ status: "success", data: receivedRequest("Declined") }),
    );
    expect(
      (await mutateInvitation(request({ reason: null, note: "   " }), "7", "decline")).status,
    ).toBe(200);
    expect(fetchBackend).toHaveBeenCalledWith(
      "/api/v1/me/job-requests/7/decline",
      expect.objectContaining({ body: JSON.stringify({ reason: null, note: null }) }),
    );
  });
  it("preserves conflicts and handles malformed success or backend failure", async () => {
    vi.mocked(fetchBackend).mockResolvedValueOnce(
      Response.json(
        {
          status: "error",
          error: { code: "offer_already_exists", message: "An active offer already exists." },
        },
        { status: 409 },
      ),
    );
    expect((await mutateInvitation(request(), "7", "accept")).status).toBe(409);
    vi.mocked(fetchBackend).mockResolvedValueOnce(Response.json({ status: "success", data: {} }));
    expect((await mutateInvitation(request(), "7", "accept")).status).toBe(502);
    vi.mocked(fetchBackend).mockRejectedValueOnce(new Error("offline"));
    expect((await mutateInvitation(request(), "7", "accept")).status).toBe(503);
  });
  it("loads fresh snapshots and checks read-session and ID boundaries", async () => {
    vi.mocked(getInvitations).mockResolvedValue([invitationEntry()]);
    const response = await listInvitations(
      new Request("http://localhost:3000/api/job-requests?requestId=7"),
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(getInvitations).toHaveBeenCalledWith("7");
    expect(
      (await listInvitations(new Request("http://localhost:3000/api/job-requests?requestId=bad")))
        .status,
    ).toBe(422);
    vi.mocked(getSession).mockResolvedValue(null);
    expect(
      (await listInvitations(new Request("http://localhost:3000/api/job-requests"))).status,
    ).toBe(401);
  });
  it("handles withdrawOfferRoute origin, auth, validation, and forwarding", async () => {
    function withdrawReq() {
      return new Request("http://localhost:3000/api/offers/11/withdraw", {
        method: "POST",
        headers: { Origin: "http://localhost:3000" },
      });
    }

    vi.mocked(isAllowedFrontendOrigin).mockReturnValue(false);
    expect((await withdrawOfferRoute(withdrawReq(), "11")).status).toBe(403);

    vi.mocked(isAllowedFrontendOrigin).mockReturnValue(true);
    vi.mocked(getSession).mockResolvedValue(null);
    expect((await withdrawOfferRoute(withdrawReq(), "11")).status).toBe(401);

    vi.mocked(getSession).mockResolvedValue({
      token: "test-session",
      userId: 2,
      role: "user",
      expiresAt: 9999999999,
    });
    expect((await withdrawOfferRoute(withdrawReq(), "0")).status).toBe(422);

    const withdrawnOfferData = {
      ...savedOffer(),
      offer_id: 11,
      offer_status: "Withdrawn",
    };
    vi.mocked(fetchBackend).mockResolvedValueOnce(
      Response.json({ status: "success", data: withdrawnOfferData }),
    );
    const response = await withdrawOfferRoute(withdrawReq(), "11");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "success", data: withdrawnOfferData });
    expect(fetchBackend).toHaveBeenCalledWith(
      "/api/v1/me/offers/11/withdraw",
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer test-session" },
      }),
    );

    // Conflict error propagation
    vi.mocked(fetchBackend).mockResolvedValueOnce(
      Response.json(
        {
          status: "error",
          error: { code: "offer_not_pending", message: "only a pending offer can be withdrawn" },
        },
        { status: 409 },
      ),
    );
    const conflictRes = await withdrawOfferRoute(withdrawReq(), "11");
    expect(conflictRes.status).toBe(409);
  });
});
