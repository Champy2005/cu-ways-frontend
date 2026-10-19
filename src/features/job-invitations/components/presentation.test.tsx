import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEMO_NOW } from "../demo/fixtures";
import { initialState } from "../demo/transitions";
import { formatSentTime } from "../format";
import { InvitationCard } from "./invitation-card";
import { NotificationToast } from "./notification-toast";
import { OfferStatusText } from "./shared";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("invitation timing", () => {
  it.each([
    ["2026-10-07T12:00:00Z", "Invited just now"],
    ["2026-10-07T11:58:00Z", "Invited 2m ago"],
    ["2026-10-07T10:00:00Z", "Invited 2h ago"],
    ["2026-10-05T12:00:00Z", "Invited 2d ago"],
  ])("formats %s relative to the demo clock", (sent, expected) => {
    expect(formatSentTime(sent, DEMO_NOW)).toBe(expected);
  });
  it.each(["Pending", "Accepted", "Declined", "Closed"] as const)(
    "shows sent time with accessible %s status and exact date",
    (status) => {
      const request = { ...initialState.invitations[0], status };
      const { container } = render(
        <InvitationCard
          request={request}
          referenceTime={DEMO_NOW}
          onRespond={vi.fn()}
          onOffer={vi.fn()}
          onBrief={vi.fn()}
        />,
      );
      const time = container.querySelector("time")!;
      expect(time).toHaveAttribute("data-status", status);
      expect(time).toHaveAttribute("datetime", request.invitedAt);
      expect(time).toHaveAccessibleName(expect.stringContaining(`Status: ${status}`));
      expect(time).toHaveAccessibleDescription(expect.stringContaining("Asia/Bangkok"));
      expect(screen.getByText(request.job.id, { exact: true })).toBeInTheDocument();
      expect(container.querySelector(".ji-card-top .ji-status")).toBeNull();
    },
  );
});

describe("submission toast", () => {
  it("slides up before manual removal and dismisses immediately with reduced motion", () => {
    vi.useFakeTimers();
    const dismiss = vi.fn();
    const view = render(
      <NotificationToast
        notification={{ id: 1, kind: "success", message: "Saved" }}
        onDismiss={dismiss}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(screen.getByText("Saved").parentElement).toHaveAttribute("data-closing", "true");
    act(() => vi.advanceTimersByTime(179));
    expect(dismiss).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(dismiss).toHaveBeenCalledOnce();
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    view.rerender(
      <NotificationToast
        notification={{ id: 2, kind: "success", message: "Saved again" }}
        onDismiss={dismiss}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(dismiss).toHaveBeenCalledTimes(2);
  });
  it.each(["Pending", "Accepted", "Rejected", "Withdrawn"] as const)(
    "renders %s as text without a badge",
    (status) => {
      const { container } = render(<OfferStatusText status={status} />);
      expect(container.querySelector(".ji-status-text")).toHaveAttribute("data-status", status);
      expect(container.querySelector('[data-slot="badge"]')).toBeNull();
      expect(
        screen.getByText(
          status === "Pending" ? "Offer pending review" : `Offer ${status.toLowerCase()}`,
        ),
      ).toBeInTheDocument();
    },
  );
  it("announces errors assertively and restarts identical messages by notification ID", () => {
    vi.useFakeTimers();
    const dismiss = vi.fn();
    const view = render(
      <NotificationToast
        notification={{ id: 1, kind: "error", message: "Please try again." }}
        onDismiss={dismiss}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Please try again.");
    act(() => vi.advanceTimersByTime(4000));
    view.rerender(
      <NotificationToast
        notification={{ id: 2, kind: "error", message: "Please try again." }}
        onDismiss={dismiss}
      />,
    );
    act(() => vi.advanceTimersByTime(4000));
    expect(dismiss).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1000));
    act(() => vi.advanceTimersByTime(180));
    expect(dismiss).toHaveBeenCalledOnce();
  });
  it("announces success, dismisses after five seconds, and cleans up its timer", () => {
    vi.useFakeTimers();
    const dismiss = vi.fn();
    const view = render(
      <NotificationToast
        notification={{ id: 1, kind: "success", message: "Offer submitted successfully! ฿9,000" }}
        onDismiss={dismiss}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("฿9,000");
    act(() => vi.advanceTimersByTime(4999));
    expect(dismiss).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    act(() => vi.advanceTimersByTime(180));
    expect(dismiss).toHaveBeenCalledOnce();
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("pauses for both hover and focus, then resumes the remaining time", () => {
    vi.useFakeTimers();
    const dismiss = vi.fn();
    render(
      <NotificationToast
        notification={{ id: 1, kind: "success", message: "Submitted" }}
        onDismiss={dismiss}
      />,
    );
    const toast = screen.getByText("Submitted").parentElement!;
    const close = screen.getByRole("button", { name: "Dismiss notification" });
    act(() => vi.advanceTimersByTime(2000));
    fireEvent.mouseEnter(toast);
    fireEvent.focus(close);
    act(() => vi.advanceTimersByTime(6000));
    fireEvent.mouseLeave(toast);
    act(() => vi.advanceTimersByTime(6000));
    expect(dismiss).not.toHaveBeenCalled();
    fireEvent.blur(close, { relatedTarget: document.body });
    act(() => vi.advanceTimersByTime(2999));
    expect(dismiss).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    act(() => vi.advanceTimersByTime(180));
    expect(dismiss).toHaveBeenCalledOnce();
  });
  it("supports manual dismissal and resets for the next notification", () => {
    vi.useFakeTimers();
    const dismiss = vi.fn();
    const view = render(
      <NotificationToast
        notification={{ id: 1, kind: "success", message: "Submitted" }}
        onDismiss={dismiss}
      />,
    );
    fireEvent.mouseEnter(screen.getByText("Submitted").parentElement!);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    act(() => vi.advanceTimersByTime(180));
    expect(dismiss).toHaveBeenCalledOnce();
    view.rerender(<NotificationToast notification={null} onDismiss={dismiss} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    view.rerender(
      <NotificationToast
        notification={{ id: 2, kind: "success", message: "Submitted again" }}
        onDismiss={dismiss}
      />,
    );
    act(() => vi.advanceTimersByTime(5000));
    act(() => vi.advanceTimersByTime(180));
    expect(dismiss).toHaveBeenCalledTimes(2);
  });
});
