import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CreatorShell } from "./creator-shell";

const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: () => "/creator/discovery",
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

beforeEach(() => {
  push.mockClear();
  vi.stubGlobal("matchMedia", () => Object.assign(new EventTarget(), { matches: false }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("CreatorShell", () => {
  it("switches to the marketer workspace in one click, without a header workspace link", () => {
    render(<CreatorShell>Creator workspace</CreatorShell>);

    expect(screen.queryByRole("link", { name: "Workspace" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Switch to Marketer, current: Creator" }));
    expect(push).toHaveBeenCalledOnce();
    expect(push).toHaveBeenCalledWith("/marketer/dashboard");
  });

  it("opens the creator menu with the current page marked", async () => {
    render(<CreatorShell>Creator workspace</CreatorShell>);

    fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));
    const menu = within(await screen.findByRole("menu"));
    expect(menu.getByRole("menuitem", { name: "Overview" })).toHaveAttribute(
      "href",
      "/creator/dashboard",
    );
    expect(menu.getByRole("menuitem", { name: "Marketer discovery" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(menu.getByRole("menuitem", { name: "Workspace" })).toHaveAttribute("href", "/dashboard");
    expect(menu.getByRole("menuitem", { name: "Sign out" })).toBeInTheDocument();
  });
});
