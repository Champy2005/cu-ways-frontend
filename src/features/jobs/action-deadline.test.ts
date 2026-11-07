import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ActionDeadlineError, withinDeadline } from "./action-deadline";

describe("withinDeadline", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the action's result when it answers in time", async () => {
    await expect(withinDeadline(Promise.resolve("saved"), 1_000)).resolves.toBe("saved");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("passes on the action's own failure", async () => {
    const lost = new TypeError("Simulated lost payment response");
    await expect(withinDeadline(Promise.reject(lost), 1_000)).rejects.toBe(lost);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("rejects when the action never answers", async () => {
    const result = withinDeadline(new Promise(() => undefined), 1_000);
    const assertion = expect(result).rejects.toBeInstanceOf(ActionDeadlineError);
    await vi.advanceTimersByTimeAsync(1_000);
    await assertion;
  });
});
