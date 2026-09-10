import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  decodeDemoState,
  demoActions,
  getDemoSnapshot,
  initialDemoState,
  resetDemo,
  saveDemoContact,
} from "./store";

beforeEach(() => {
  sessionStorage.clear();
  resetDemo();
});

describe("isolated marketer demo", () => {
  it("keeps current edits in memory when storage rejects a write", async () => {
    const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage full", "QuotaExceededError");
    });
    try {
      await demoActions.saveProfile({
        bio: "Kept in memory",
        experience_years: 1,
        availability_text: "Weekdays",
        availability_status: "available",
      });
      expect(getDemoSnapshot().profile.bio).toBe("Kept in memory");
    } finally {
      write.mockRestore();
    }
  });
  it("persists a profile and service changes across a fresh snapshot", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await demoActions.saveProfile({
      bio: "Saved demo bio",
      experience_years: 0,
      availability_text: "Weekdays",
      availability_status: "available",
    });
    const created = await demoActions.createService({
      service_type: "Custom outreach",
      scope_text: "Line one\nLine two",
      price: "0.00",
    });
    await demoActions.updateService(created.service_id, {
      service_type: "Updated outreach",
      scope_text: null,
      price: "125.50",
    });
    const persisted = decodeDemoState(sessionStorage.getItem("cuways-marketer-demo-v2"));
    expect(persisted.profile.bio).toBe("Saved demo bio");
    expect(persisted.profile.experience_years).toBe(0);
    expect(persisted.services[0]).toMatchObject({
      service_type: "Updated outreach",
      price: "125.50",
    });
    await demoActions.deleteService(created.service_id);
    expect(getDemoSnapshot().services).toHaveLength(initialDemoState.services.length);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("reset restores fixtures without retaining private form changes", async () => {
    await demoActions.deleteService(1);
    resetDemo();
    expect(getDemoSnapshot().services).toEqual(initialDemoState.services);
    expect(getDemoSnapshot().profile).toEqual(initialDemoState.profile);
  });

  it("rejects invalid or missing service mutations", async () => {
    await expect(demoActions.deleteService(500)).rejects.toThrow("no longer available");
    await expect(
      demoActions.createService({ service_type: "", scope_text: null, price: "-1" }),
    ).rejects.toThrow();
    expect(getDemoSnapshot().services).toEqual(initialDemoState.services);
  });

  it.each([
    "not json",
    "null",
    '{"profile":{},"services":[]}',
    JSON.stringify({
      ...initialDemoState,
      services: [{ ...initialDemoState.services[0], price: "NaN" }],
    }),
  ])("recovers malformed saved state", (raw) => {
    expect(decodeDemoState(raw)).toEqual(initialDemoState);
  });
});

it("restores old sessions without losing profile or service edits", () => {
  const old = {
    ...initialDemoState,
    contact: undefined,
    profile: { ...initialDemoState.profile, bio: "Saved before upgrade" },
    services: [],
  };
  const restored = decodeDemoState(JSON.stringify(old));
  expect(restored.contact).toEqual(initialDemoState.contact);
  expect(restored.profile.bio).toBe("Saved before upgrade");
  expect(restored.services).toEqual([]);
});
it("persists contact changes in the session and resets both profile sections", async () => {
  await saveDemoContact({ phone: "123", line_id: null });
  expect(decodeDemoState(sessionStorage.getItem("cuways-marketer-demo-v2")).contact.phone).toBe(
    "123",
  );
  await demoActions.saveProfile({
    bio: "Changed",
    experience_years: 0,
    availability_text: "Weekdays",
    availability_status: "available",
  });
  resetDemo();
  expect(getDemoSnapshot().contact).toEqual(initialDemoState.contact);
  expect(getDemoSnapshot().profile).toEqual(initialDemoState.profile);
});
