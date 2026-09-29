import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CreatorShell } from "./creator-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/creator/discovery",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

beforeEach(() => {
  vi.stubGlobal("matchMedia", () => Object.assign(new EventTarget(), { matches: false }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("CreatorShell", () => {
  it("shows the role switcher on Creator without a header workspace link", () => {
    render(<CreatorShell>Creator workspace</CreatorShell>);

    expect(
      screen.getByRole("button", { name: "Switch role preview, current: Creator" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Workspace" })).not.toBeInTheDocument();
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
