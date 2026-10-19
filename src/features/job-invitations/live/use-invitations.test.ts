import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { reloadInvitations } from "./browser-api";
import { invitationEntry, savedOffer } from "./test-fixtures";
import { useInvitations } from "./use-invitations";
import type { InvitationEntry } from "./types";

vi.mock("./browser-api", () => ({ reloadInvitations: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("live refresh reconciliation", () => {
  it("prevents an older refresh from overwriting the saved current offer", async () => {
    let oldRefresh!: (value: InvitationEntry[]) => void;
    vi.mocked(reloadInvitations).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          oldRefresh = resolve;
        }),
    );
    vi.mocked(reloadInvitations).mockResolvedValueOnce([
      { ...invitationEntry(), offer: savedOffer() },
    ]);
    const initial = [invitationEntry()];
    const { result } = renderHook(() => useInvitations(initial));
    let older!: Promise<boolean>;
    act(() => {
      older = result.current.refresh();
    });
    await act(async () => {
      await result.current.refresh(true);
    });
    await act(async () => {
      oldRefresh(initial);
      await older;
    });
    expect(result.current.entries[0].offer?.offer_id).toBe(5);
  });
  it("blocks further mutations after failed save-refresh and clears the warning after retry", async () => {
    vi.mocked(reloadInvitations)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce([{ ...invitationEntry(), offer: savedOffer() }]);
    const initial = [{ ...invitationEntry(), offer: savedOffer() }];
    const { result } = renderHook(() => useInvitations(initial));
    await act(async () => {
      await result.current.refresh(true);
    });
    expect(result.current.blocked).toBe(true);
    expect(result.current.notice).toContain("Your change was saved");
    expect(result.current.entries[0].offer?.offer_id).toBe(5);
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.blocked).toBe(false);
    expect(result.current.notice).toBe("");
  });
  it("retains a confirmed offer and the saved warning through partial and complete refresh failures", async () => {
    const initial = [{ ...invitationEntry(), offer: savedOffer() }];
    const partial = { ...invitationEntry("Closed"), offersUnavailable: true };
    const updatedOffer = { ...savedOffer("Accepted"), offered_price: "9500.50" };
    vi.mocked(reloadInvitations)
      .mockResolvedValueOnce([partial])
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce([partial])
      .mockResolvedValueOnce([{ ...partial, offer: updatedOffer, offersUnavailable: false }]);
    const { result } = renderHook(() => useInvitations(initial, "7"));
    await act(async () => {
      expect(await result.current.refresh(true)).toBe(false);
    });
    expect(result.current.entries[0]).toMatchObject({
      offer: savedOffer(),
      offersUnavailable: true,
      request: { request_status: "Closed" },
    });
    expect(result.current.blocked).toBe(true);
    expect(result.current.notice).toContain("Your change was saved");
    for (let retry = 0; retry < 2; retry++) {
      await act(async () => {
        expect(await result.current.refresh()).toBe(false);
      });
      expect(result.current.entries[0].offer).toEqual(savedOffer());
      expect(result.current.notice).toContain("Your change was saved");
    }
    await act(async () => {
      expect(await result.current.refresh()).toBe(true);
    });
    expect(result.current.entries[0].offer).toEqual(updatedOffer);
    expect(result.current.blocked).toBe(false);
    expect(result.current.notice).toBe("");
  });
  it("keeps an unknown offer unavailable and accepts a later authoritative empty list", async () => {
    const initial = [invitationEntry()];
    vi.mocked(reloadInvitations)
      .mockResolvedValueOnce([{ ...invitationEntry(), offersUnavailable: true }])
      .mockResolvedValueOnce(initial);
    const { result } = renderHook(() => useInvitations(initial));
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.entries[0].offer).toBeNull();
    expect(result.current.entries[0].offersUnavailable).toBe(true);
    expect(result.current.blocked).toBe(true);
    expect(result.current.notice).not.toContain("was saved");
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.blocked).toBe(false);
    expect(result.current.entries[0].offersUnavailable).toBe(false);
  });
  it("also preserves known offers when a server prop refresh has a partial lookup failure", () => {
    const initial = [{ ...invitationEntry(), offer: savedOffer() }];
    const { result, rerender } = renderHook(({ data }) => useInvitations(data), {
      initialProps: { data: initial as InvitationEntry[] },
    });
    rerender({ data: [{ ...invitationEntry(), offersUnavailable: true }] });
    expect(result.current.entries[0].offer).toEqual(savedOffer());
    rerender({ data: [invitationEntry()] });
    expect(result.current.entries[0].offer).toBeNull();
  });
});
