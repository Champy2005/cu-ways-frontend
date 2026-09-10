import { initialDemoState } from "./demo/store";
import { afterEach, describe, expect, it, vi } from "vitest";

import { liveMarketerActions } from "@/features/marketers/browser-api";

const input = { service_type: "Campus distribution", scope_text: null, price: "250.00" };
const service = { ...input, service_id: 7, created_at: "2026-09-06T00:00:00Z" };

afterEach(() => vi.unstubAllGlobals());

describe("live marketer browser adapter", () => {
  it("sends service writes only to same-origin BFF routes using decimal strings", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ status: "success", data: service }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await liveMarketerActions.createService(input)).toEqual(service);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/services",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        body: JSON.stringify(input),
      }),
    );
    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.has("Authorization")).toBe(false);
    fetchMock.mockResolvedValueOnce(
      Response.json({ status: "success", data: { ...service, price: "300.00" } }),
    );
    expect(await liveMarketerActions.updateService(7, { ...input, price: "300.00" })).toMatchObject(
      { price: "300.00" },
    );
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/services/7",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("saves required professional fields and reads back saved profile data", async () => {
    const profileInput = {
      bio: "Bio",
      experience_years: 0,
      availability_text: "Weekdays",
      availability_status: "available" as const,
    };
    const profile = { ...initialDemoState.profile, ...profileInput, name: "Demo marketer" };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ status: "success", data: profile }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await liveMarketerActions.saveProfile(profileInput)).toEqual(profile);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/marketer",
      expect.objectContaining({ method: "PUT", body: JSON.stringify(profileInput) }),
    );
  });

  it("completes empty 204 deletion without attempting to decode a service", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(liveMarketerActions.deleteService(7)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/services/7",
      expect.objectContaining({ method: "DELETE", credentials: "same-origin" }),
    );
  });

  it("propagates failed requests and never supplies demo fallback data", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json(
        {
          status: "error",
          error: { code: "forbidden", message: "This service belongs to another marketer." },
        },
        { status: 403 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(liveMarketerActions.deleteService(7)).rejects.toMatchObject({
      status: 403,
      code: "forbidden",
    });
    fetchMock.mockRejectedValueOnce(new Error("Network unavailable"));
    await expect(liveMarketerActions.createService(input)).rejects.toThrow("Network unavailable");
  });
});
