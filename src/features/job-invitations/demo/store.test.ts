import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  demoInvitationActions as actions,
  getSnapshot,
  resetInvitationsDemo,
  STORAGE_KEY,
  subscribe,
} from "./store";

beforeEach(() => {
  sessionStorage.clear();
  resetInvitationsDemo();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("preview persistence", () => {
  it("notifies subscribers and saves responses across reload-style reads", async () => {
    const changed = vi.fn();
    const unsubscribe = subscribe(changed);
    await actions.accept("request-041");
    expect(changed).toHaveBeenCalledOnce();
    expect(JSON.parse(sessionStorage.getItem(STORAGE_KEY)!).invitations[0].status).toBe("Accepted");
    const saved = sessionStorage.getItem(STORAGE_KEY)!;
    sessionStorage.removeItem(STORAGE_KEY);
    expect(getSnapshot().invitations[0].status).toBe("Pending");
    sessionStorage.setItem(STORAGE_KEY, saved);
    expect(getSnapshot().invitations[0].status).toBe("Accepted");
    unsubscribe();
    await actions.decline("request-052", { reason: null, note: "" });
    expect(changed).toHaveBeenCalledOnce();
  });
  it("retains in-memory edits when storage is blocked", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Blocked");
    });
    await actions.accept("request-041");
    await actions.submit("request-041", { price: "8500", deliveryDate: "2026-10-25", message: "" });
    await actions.withdraw("request-041");
    expect(getSnapshot().offers.at(-1)?.status).toBe("Withdrawn");
    resetInvitationsDemo();
    expect(getSnapshot().invitations[0].status).toBe("Pending");
  });
  it("reset restores fixtures without altering the theme", async () => {
    localStorage.setItem("cuways-marketer-theme", "dark");
    await actions.accept("request-041");
    resetInvitationsDemo();
    expect(getSnapshot().invitations[0].status).toBe("Pending");
    expect(localStorage.getItem("cuways-marketer-theme")).toBe("dark");
  });
});
