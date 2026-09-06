import { beforeEach, describe, expect, it, vi } from "vitest";

import { PUT as saveProfile } from "@/app/api/marketer/route";
import { POST as publish } from "@/app/api/services/route";
import { DELETE as remove, PUT as update } from "@/app/api/services/[id]/route";
import { fetchBackend } from "@/lib/api/backend-client";
import { isAllowedFrontendOrigin } from "@/lib/auth/origin";
import { getSession } from "@/lib/auth/session";

vi.mock("@/lib/api/backend-client", () => ({
  fetchBackend: vi.fn(),
  readBackendPayload: async (response: Response) => response.json().catch(() => null),
}));
vi.mock("@/lib/auth/origin", () => ({ isAllowedFrontendOrigin: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn() }));

const input = { service_type: "Custom distribution", scope_text: null, price: "50.00" };
const service = { ...input, service_id: 7, user_id: 2, created_at: "2026-09-06T00:00:00Z" };
const profileInput = { bio: null, experience_years: 1.5, availability_text: null };
const profile = { ...profileInput, user_id: 2, name: "Demo marketer" };
const context = { params: Promise.resolve({ id: "7" }) };

function request(method: string, body?: unknown): Request {
  return new Request("http://localhost:3000/api/services", {
    method,
    headers: { Origin: "http://localhost:3000", "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function upstream(data: unknown, status = 200): Response {
  return Response.json({ status: "success", data }, { status });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(isAllowedFrontendOrigin).mockReturnValue(true);
  vi.mocked(getSession).mockResolvedValue({
    userId: 2,
    role: "user",
    token: "test-session",
    expiresAt: 9999999999,
  });
});

describe("marketer mutation BFF boundary", () => {
  it("requires a session before calling the backend", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    expect((await publish(request("POST", input))).status).toBe(401);
    expect(fetchBackend).not.toHaveBeenCalled();
  });

  it("requires the configured frontend origin", async () => {
    vi.mocked(isAllowedFrontendOrigin).mockReturnValue(false);
    expect((await saveProfile(request("PUT", profileInput))).status).toBe(403);
    expect(fetchBackend).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON, invalid fields, and caller-supplied owner IDs", async () => {
    const malformed = new Request("http://localhost:3000/api/services", {
      method: "POST",
      body: "{",
    });
    expect((await publish(malformed)).status).toBe(422);
    expect((await publish(request("POST", { ...input, price: "-1" }))).status).toBe(422);
    expect((await publish(request("POST", { ...input, user_id: 99 }))).status).toBe(422);
    expect((await saveProfile(request("PUT", { ...profileInput, user_id: 99 }))).status).toBe(422);
    expect(fetchBackend).not.toHaveBeenCalled();
  });

  it("saves profiles using the server session and sanitizes successful responses", async () => {
    vi.mocked(fetchBackend).mockResolvedValue(
      upstream({ ...profile, access_token: "should-not-escape" }),
    );
    const response = await saveProfile(request("PUT", profileInput));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "success", data: profile });
    expect(fetchBackend).toHaveBeenCalledWith(
      "/api/v1/marketers/me",
      expect.objectContaining({
        method: "PUT",
        headers: { Authorization: "Bearer test-session" },
        body: JSON.stringify(profileInput),
      }),
    );
  });

  it("publishes and edits service announcements", async () => {
    vi.mocked(fetchBackend).mockResolvedValueOnce(upstream(service, 201));
    expect((await publish(request("POST", input))).status).toBe(201);
    vi.mocked(fetchBackend).mockResolvedValueOnce(upstream({ ...service, price: "75.00" }));
    const response = await update(request("PUT", { ...input, price: "75.00" }), context);
    expect(await response.json()).toMatchObject({ data: { service_id: 7, price: "75.00" } });
    expect(fetchBackend).toHaveBeenLastCalledWith(
      "/api/v1/services/7",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it.each(["not-a-number", "0", "-1", "1e2", "9007199254740992"])(
    "rejects invalid service identifier %s",
    async (id) => {
      expect((await remove(request("DELETE"), { params: Promise.resolve({ id }) })).status).toBe(
        422,
      );
      expect(fetchBackend).not.toHaveBeenCalled();
    },
  );

  it("preserves backend eligibility and foreign-owner rejection", async () => {
    const error = {
      status: "error",
      error: { code: "forbidden", message: "You cannot edit this service." },
    };
    vi.mocked(fetchBackend).mockResolvedValue(Response.json(error, { status: 403 }));
    const response = await update(request("PUT", input), context);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual(error);
  });

  it("preserves field validation details from the backend", async () => {
    const error = {
      status: "error",
      error: {
        code: "validation_error",
        message: "Check the price.",
        details: { price: "Price was rejected." },
      },
    };
    vi.mocked(fetchBackend).mockResolvedValue(Response.json(error, { status: 422 }));
    const response = await publish(request("POST", input));
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual(error);
  });

  it("passes through a successful empty 204 deletion response", async () => {
    vi.mocked(fetchBackend).mockResolvedValue(new Response(null, { status: 204 }));
    const response = await remove(request("DELETE"), context);
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(fetchBackend).toHaveBeenCalledWith(
      "/api/v1/services/7",
      expect.objectContaining({ method: "DELETE", body: undefined }),
    );
  });

  it("reports unavailable transport and rejects malformed success data", async () => {
    vi.mocked(fetchBackend).mockRejectedValueOnce(new Error("connection refused"));
    expect((await publish(request("POST", input))).status).toBe(503);
    vi.mocked(fetchBackend).mockResolvedValueOnce(upstream({ ...service, price: 50 }));
    expect((await publish(request("POST", input))).status).toBe(502);
    vi.mocked(fetchBackend).mockResolvedValueOnce(upstream(null));
    expect((await remove(request("DELETE"), context)).status).toBe(502);
  });
});
