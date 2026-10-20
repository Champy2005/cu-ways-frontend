import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SuccessToast } from "./success-toast";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("shared success toast", () => {
  it("announces success and dismisses without moving keyboard focus", () => {
    render(
      <>
        <button>Save</button>
        <SuccessToast message="Changes saved." />
      </>,
    );
    const save = screen.getByRole("button", { name: "Save" });
    save.focus();
    expect(screen.getByRole("status")).toHaveTextContent("Changes saved.");
    expect(save).toHaveFocus();
    act(() => {
      vi.advanceTimersByTime(5200);
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
  it("keeps the message available while hovered, then resumes dismissal", () => {
    render(<SuccessToast message="Offer accepted." />);
    const toast = screen.getByRole("status");
    fireEvent.mouseEnter(toast);
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(toast).toBeInTheDocument();
    fireEvent.mouseLeave(toast);
    act(() => {
      vi.advanceTimersByTime(5200);
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
