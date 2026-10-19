import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/surveys/route";
import { fetchBackend } from "@/lib/api/backend-client";
import { isAllowedFrontendOrigin } from "@/lib/auth/origin";
import { getSession } from "@/lib/auth/session";
import { savedSurvey } from "./test-fixtures";

vi.mock("@/lib/api/backend-client", () => ({
  fetchBackend: vi.fn(),
  readBackendPayload: async (response: Response) => response.json().catch(() => null),
}));
vi.mock("@/lib/auth/origin", () => ({ isAllowedFrontendOrigin: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn() }));
const input = {
  title: " Campus research ",
  survey_link: savedSurvey.survey_link,
  deadline: "2026-12-31",
};
function request(body: unknown = input) {
  return new Request("http://localhost:3000/api/surveys", {
    method: "POST",
    headers: { Origin: "http://localhost:3000", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(isAllowedFrontendOrigin).mockReturnValue(true);
  vi.mocked(getSession).mockResolvedValue({
    userId: 2,
    role: "user",
    token: "test-token",
    expiresAt: 9999999999,
  });
});
describe("survey creation BFF", () => {
  it("requires origin and session before calling the API", async () => {
    vi.mocked(isAllowedFrontendOrigin).mockReturnValueOnce(false);
    expect((await POST(request())).status).toBe(403);
    vi.mocked(getSession).mockResolvedValue(null);
    expect((await POST(request())).status).toBe(401);
    expect(fetchBackend).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON and caller supplied ownership", async () => {
    expect(
      (await POST(new Request("http://localhost/api/surveys", { method: "POST", body: "{" })))
        .status,
    ).toBe(422);
    expect((await POST(request({ ...input, user_id: 9 }))).status).toBe(422);
    expect((await POST(request({ ...input, desired_responses: 1.5 }))).status).toBe(422);
    expect(fetchBackend).not.toHaveBeenCalled();
  });
  it("forwards normalized metadata with the server token and sanitizes the response", async () => {
    vi.mocked(fetchBackend).mockResolvedValue(
      Response.json(
        { status: "success", data: { ...savedSurvey, access_token: "must-not-escape" } },
        { status: 201 },
      ),
    );
    const response = await POST(request());
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ status: "success", data: savedSurvey });
    expect(fetchBackend).toHaveBeenCalledWith(
      "/api/v1/surveys",
      expect.objectContaining({
        headers: { Authorization: "Bearer test-token" },
        body: JSON.stringify({
          title: "Campus research",
          survey_link: savedSurvey.survey_link,
          description: null,
          target_group: null,
          desired_responses: null,
          deadline: "2026-12-31T00:00:00.000Z",
        }),
      }),
    );
  });
  it.each([401, 403, 404, 422, 500])(
    "preserves backend failure %i without fake success",
    async (status) => {
      vi.mocked(fetchBackend).mockResolvedValue(
        Response.json(
          { status: "error", error: { code: "backend_error", message: "Unavailable" } },
          { status },
        ),
      );
      const response = await POST(request());
      expect(response.status).toBe(status);
      expect(await response.json()).not.toHaveProperty("data");
    },
  );
  it.each([null, {}, { ...savedSurvey, user_id: 99 }, { ...savedSurvey, survey_id: 0 }])(
    "rejects unconfirmed successful responses %#",
    async (data) => {
      vi.mocked(fetchBackend).mockResolvedValue(
        Response.json({ status: "success", data }, { status: 201 }),
      );
      expect((await POST(request())).status).toBe(502);
    },
  );
  it("handles connection failures without claiming a saved record", async () => {
    vi.mocked(fetchBackend).mockRejectedValue(new TypeError("connection lost"));
    expect((await POST(request())).status).toBe(503);
  });
});
