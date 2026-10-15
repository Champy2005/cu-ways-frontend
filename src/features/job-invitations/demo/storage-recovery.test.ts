import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initialState } from "./transitions";

const storageKey = "cuways-job-invitations-demo-v1";
const input = { price: "8500", deliveryDate: "2026-10-25", message: "Saved in memory" };

beforeEach(() => {
  sessionStorage.clear();
  vi.resetModules();
});
afterEach(() => vi.restoreAllMocks());

function blockStorage() {
  const read = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("Reads blocked");
  });
  const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Writes blocked");
  });
  return { read, write };
}

describe("storage recovery after blocked startup", () => {
  it.each([
    { label: "empty", stored: null },
    { label: "stale", stored: JSON.stringify(initialState) },
    { label: "invalid", stored: "invalid JSON" },
  ])("preserves local changes while recovering from $label storage", async ({ stored }) => {
    if (stored !== null) sessionStorage.setItem(storageKey, stored);
    const { read, write } = blockStorage();
    const store = await import("./store");
    const changed = vi.fn();
    const unsubscribe = store.subscribe(changed);
    try {
      await store.demoInvitationActions.accept("request-041");
      const accepted = store.getSnapshot();
      expect(accepted.invitations[0].status).toBe("Accepted");
      read.mockRestore();
      expect(store.getSnapshot()).toBe(accepted);
      await store.demoInvitationActions.submit("request-041", input);
      await store.demoInvitationActions.withdraw("request-041");
      const memory = store.getSnapshot();
      expect(memory.offers.at(-1)?.status).toBe("Withdrawn");
      expect(sessionStorage.getItem(storageKey)).toBe(stored);

      write.mockRestore();
      expect(store.getSnapshot()).toBe(memory);
      expect(store.getSnapshot()).toBe(memory);
      expect(changed).toHaveBeenCalledTimes(3);
      const persisted = JSON.parse(sessionStorage.getItem(storageKey)!);
      expect(persisted.invitations).toEqual(memory.invitations);
      expect(persisted.offers).toEqual(memory.offers);

      vi.resetModules();
      const reloaded = await import("./store");
      expect(reloaded.getSnapshot().invitations).toEqual(memory.invitations);
      expect(reloaded.getSnapshot().offers).toEqual(memory.offers);
      sessionStorage.removeItem(storageKey);
      expect(store.getSnapshot().invitations).toEqual(initialState.invitations);
    } finally {
      unsubscribe();
    }
  });

  it("persists the latest mutation when writes recover before reads", async () => {
    const { read, write } = blockStorage();
    const store = await import("./store");
    await store.demoInvitationActions.accept("request-041");
    write.mockRestore();
    await store.demoInvitationActions.submit("request-041", input);
    read.mockRestore();
    expect(store.getSnapshot().offers.at(-1)).toMatchObject({
      price: "8500.00",
      status: "Pending",
    });
    expect(JSON.parse(sessionStorage.getItem(storageKey)!).offers).toEqual(
      store.getSnapshot().offers,
    );
  });

  it("retains a blocked reset and persists fixtures when storage recovers", async () => {
    const { read, write } = blockStorage();
    const store = await import("./store");
    await store.demoInvitationActions.accept("request-041");
    await store.demoInvitationActions.submit("request-041", input);
    store.resetInvitationsDemo();
    const reset = store.getSnapshot();
    expect(reset.invitations).toEqual(initialState.invitations);
    expect(reset.offers).toEqual(initialState.offers);
    expect(reset.revision).toBe(1);
    read.mockRestore();
    expect(store.getSnapshot()).toBe(reset);
    write.mockRestore();
    expect(store.getSnapshot()).toBe(reset);
    vi.resetModules();
    const reloaded = await import("./store");
    expect(reloaded.getSnapshot().invitations).toEqual(initialState.invitations);
    expect(reloaded.getSnapshot().offers).toEqual(initialState.offers);
  });
});
