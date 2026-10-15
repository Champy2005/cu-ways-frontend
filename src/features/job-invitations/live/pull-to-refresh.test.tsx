import { cleanup, createEvent, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PullToRefresh } from "./pull-to-refresh";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const point = (x: number, y: number) => ({ clientX: x, clientY: y });
function start(region: HTMLElement) {
  fireEvent.touchStart(region, { touches: [point(40, 100)] });
}
function move(region: HTMLElement, x: number, y: number) {
  const event = createEvent.touchMove(region, { touches: [point(x, y)], cancelable: true });
  fireEvent(region, event);
  return event;
}

describe("invitation pull-down refresh", () => {
  it("has no idle controls and refreshes once only after a full downward pull is released", async () => {
    let finish!: (value: boolean) => void;
    const refresh = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          finish = resolve;
        }),
    );
    render(
      <PullToRefresh onRefresh={refresh}>
        <p>Invitations</p>
      </PullToRefresh>,
    );
    const region = screen.getByRole("region", { name: "Invitation list" });
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    start(region);
    expect(move(region, 40, 160).defaultPrevented).toBe(true);
    expect(screen.getByRole("status")).toHaveTextContent("Pull to refresh");
    move(region, 40, 250);
    expect(screen.getByRole("status")).toHaveTextContent("Release to refresh");
    expect(refresh).not.toHaveBeenCalled();
    fireEvent.touchEnd(region, { touches: [] });
    expect(refresh).toHaveBeenCalledOnce();
    expect(region).toHaveAttribute("aria-busy", "true");
    start(region);
    move(region, 40, 280);
    fireEvent.touchEnd(region, { touches: [] });
    expect(refresh).toHaveBeenCalledOnce();
    finish(true);
    await waitFor(() => expect(region).toHaveAttribute("aria-busy", "false"));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
  it.each([
    [40, 130],
    [40, 50],
    [190, 130],
  ])("ignores short, upward or horizontal gestures (%i,%i)", (x, y) => {
    const refresh = vi.fn().mockResolvedValue(true);
    render(<PullToRefresh onRefresh={refresh}>Invitations</PullToRefresh>);
    const region = screen.getByRole("region");
    start(region);
    move(region, x, y);
    fireEvent.touchEnd(region, { touches: [] });
    expect(refresh).not.toHaveBeenCalled();
  });
  it("does not intercept normal scrolling below the top", () => {
    vi.stubGlobal("scrollY", 100);
    const refresh = vi.fn().mockResolvedValue(true);
    render(<PullToRefresh onRefresh={refresh}>Invitations</PullToRefresh>);
    const region = screen.getByRole("region");
    start(region);
    expect(move(region, 40, 280).defaultPrevented).toBe(false);
    fireEvent.touchEnd(region, { touches: [] });
    expect(refresh).not.toHaveBeenCalled();
  });
  it("ignores nested scroll positions, interactive targets, cancellation and multiple fingers", () => {
    const refresh = vi.fn().mockResolvedValue(true);
    render(
      <PullToRefresh onRefresh={refresh}>
        <button>Accept Request</button>
      </PullToRefresh>,
    );
    const region = screen.getByRole("region");
    Object.defineProperty(region, "scrollTop", { value: 20, configurable: true });
    start(region);
    move(region, 40, 280);
    fireEvent.touchEnd(region);
    Object.defineProperty(region, "scrollTop", { value: 0 });
    fireEvent.touchStart(screen.getByRole("button"), { touches: [point(40, 100)] });
    move(region, 40, 280);
    fireEvent.touchEnd(region);
    start(region);
    move(region, 40, 280);
    fireEvent.touchCancel(region);
    fireEvent.touchEnd(region);
    fireEvent.touchStart(region, { touches: [point(40, 100), point(50, 100)] });
    move(region, 40, 280);
    fireEvent.touchEnd(region);
    expect(refresh).not.toHaveBeenCalled();
  });
  it("blocks refreshing during a response and recovers from a rejected refresh", async () => {
    const refresh = vi.fn().mockRejectedValue(new Error("offline"));
    const view = render(
      <PullToRefresh onRefresh={refresh} disabled>
        Invitations
      </PullToRefresh>,
    );
    const region = screen.getByRole("region");
    start(region);
    move(region, 40, 280);
    fireEvent.touchEnd(region);
    expect(refresh).not.toHaveBeenCalled();
    view.rerender(<PullToRefresh onRefresh={refresh}>Invitations</PullToRefresh>);
    start(region);
    move(region, 40, 280);
    fireEvent.touchEnd(region);
    await screen.findByRole("alert");
    expect(region).toHaveAttribute("aria-busy", "false");
  });
});
