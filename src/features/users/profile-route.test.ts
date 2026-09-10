import { beforeEach, describe, expect, it, vi } from "vitest";
import { PUT } from "@/app/api/profile/route";
import { fetchBackend } from "@/lib/api/backend-client";
import { getSession } from "@/lib/auth/session";
import { isAllowedFrontendOrigin } from "@/lib/auth/origin";
vi.mock("@/lib/api/backend-client", () => ({
  fetchBackend: vi.fn(),
  readBackendPayload: (response: Response) => response.json(),
}));
vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/auth/origin", () => ({ isAllowedFrontendOrigin: vi.fn() }));
const request = (body: unknown) =>
  new Request("http://localhost:3000/api/profile", {
    method: "PUT",
    headers: { Origin: "http://localhost:3000", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(isAllowedFrontendOrigin).mockReturnValue(true);
  vi.mocked(getSession).mockResolvedValue({
    userId: 101,
    role: "user",
    token: "test-only-session",
    expiresAt: 9999999999,
  });
});
describe("contact update boundary", () => {
  it("requires origin and session before forwarding", async () => {
    vi.mocked(isAllowedFrontendOrigin).mockReturnValue(false);
    expect((await PUT(request({ phone: "123", line_id: null }))).status).toBe(403);
    expect(getSession).not.toHaveBeenCalled();
    vi.mocked(isAllowedFrontendOrigin).mockReturnValue(true);
    vi.mocked(getSession).mockResolvedValue(null);
    expect((await PUT(request({ phone: "123", line_id: null }))).status).toBe(401);
    expect(fetchBackend).not.toHaveBeenCalled();
  });
  it.each([null, "", "   "])("rejects missing phone %j", async (phone) => {
    expect((await PUT(request({ phone, line_id: null }))).status).toBe(422);
    expect(fetchBackend).not.toHaveBeenCalled();
  });
  it("updates only the session user's contact endpoint and permits LINE clearing", async () => {
    vi.mocked(fetchBackend).mockResolvedValue(
      Response.json({ status: "success", data: { phone: "123", line_id: null } }),
    );
    const body = { phone: "123", line_id: null };
    expect((await PUT(request(body))).status).toBe(200);
    expect(fetchBackend).toHaveBeenCalledWith("/api/v1/users/101", {
      method: "PUT",
      headers: { Authorization: "Bearer test-only-session" },
      body: JSON.stringify(body),
    });
    expect((await PUT(request({ ...body, user_id: 102 }))).status).toBe(422);
  });
});
