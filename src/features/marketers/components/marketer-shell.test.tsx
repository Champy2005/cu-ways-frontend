import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MarketerShell } from "./marketer-shell";

vi.mock("next/navigation", () => ({ usePathname: () => "/marketer/services" }));

let desktopQuery: (EventTarget & { matches: boolean }) | undefined;

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
  desktopQuery = undefined;
  vi.stubGlobal("matchMedia", (query: string) => {
    const media = Object.assign(new EventTarget(), {
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    });
    if (query === "(min-width: 768px)") desktopQuery = media;
    return media;
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("MarketerShell navigation and theme", () => {
  it("uses the same live destinations and current page in desktop and mobile navigation", () => {
    render(<MarketerShell>Live workspace</MarketerShell>);
    for (const name of ["Marketer navigation", "Mobile marketer navigation"]) {
      const nav = within(screen.getByRole("navigation", { name }));
      expect(nav.getByRole("link", { name: "Services" })).toHaveAttribute("aria-current", "page");
      expect(nav.getByRole("link", { name: "Profile" })).toHaveAttribute(
        "href",
        "/marketer/profile",
      );
      expect(nav.queryByRole("link", { name: "Creator view" })).not.toBeInTheDocument();
    }
  });

  it("exposes the creator preview through mobile navigation and closes its menu after selecting it", async () => {
    render(
      <MarketerShell demo demoView="viewer">
        Demo workspace
      </MarketerShell>,
    );
    const mobile = within(screen.getByRole("navigation", { name: "Mobile demo views" }));
    expect(mobile.getByRole("link", { name: "Creator view" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    fireEvent.click(await screen.findByRole("button", { name: "Open navigation menu" }));
    const dialog = await screen.findByRole("menu", { name: "Open navigation menu" });
    // Navigation is an anchored menu, with no dialog backdrop or scroll locking.
    expect(document.querySelector("[data-slot=dialog-overlay]")).toBeNull();
    expect(document.body.style.overflow).not.toBe("hidden");
    const preview = within(dialog).getByRole("menuitem", { name: "Creator view" });
    expect(preview).toHaveAttribute("href", "/demo/marketer?view=viewer");
    preview.addEventListener("click", (event) => event.preventDefault(), { once: true });
    fireEvent.click(preview);
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("restores hamburger focus on Escape and dismisses the menu when resized to desktop", async () => {
    render(<MarketerShell>Live workspace</MarketerShell>);
    const trigger = await screen.findByRole("button", { name: "Open navigation menu" });
    trigger.focus();
    fireEvent.click(trigger);
    const close = await screen.findByRole("menu", { name: "Open navigation menu" });
    fireEvent.keyDown(close, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    fireEvent.click(trigger);
    await screen.findByRole("menu");
    expect(desktopQuery).toBeDefined();
    act(() => {
      if (desktopQuery) {
        desktopQuery.matches = true;
        desktopQuery.dispatchEvent(new Event("change"));
      }
    });
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("defaults to light, persists dark mode across remounts, and switches to the transparent dark logo", () => {
    const first = render(<MarketerShell>Theme preview</MarketerShell>);
    fireEvent.click(screen.getByRole("button", { name: "Switch to dark theme" }));
    expect(localStorage.getItem("cuways-marketer-theme")).toBe("dark");
    expect(screen.getByRole("img", { name: "CU Ways" })).toHaveAttribute(
      "src",
      "/marketer-assets/logo-dark.svg",
    );
    first.unmount();
    render(<MarketerShell>Theme preview</MarketerShell>);
    expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Switch to light theme" }));
    expect(localStorage.getItem("cuways-marketer-theme")).toBe("light");
  });
});
