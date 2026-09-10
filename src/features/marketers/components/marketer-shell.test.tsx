import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MarketerShell } from "./marketer-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/marketer/services",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
  vi.stubGlobal("matchMedia", (query: string) => {
    const media = Object.assign(new EventTarget(), {
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    });
    return media;
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("MarketerShell navigation and theme", () => {
  it.each([375, 767, 768, 1440])("never mounts a mobile bar on desktop at %ipx", (width) => {
    vi.stubGlobal("innerWidth", width);
    render(<MarketerShell device="desktop">Live workspace</MarketerShell>);
    const nav = within(screen.getByRole("navigation", { name: "Marketer navigation" }));
    expect(nav.getByRole("link", { name: "Services" })).toHaveAttribute("aria-current", "page");
    expect(
      screen.queryByRole("navigation", { name: "Mobile marketer navigation" }),
    ).not.toBeInTheDocument();
    expect(document.querySelector(".mk-navigation-mobile")).toBeNull();
    expect(screen.queryByRole("button", { name: "Open navigation menu" })).not.toBeInTheDocument();
  });

  it("keeps creator preview in bottom navigation and shows the reference menu", async () => {
    render(
      <MarketerShell device="mobile" demo demoView="viewer">
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
    expect(within(dialog).getByRole("menuitem", { name: /Jobs.*Coming soon/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(within(dialog).getByRole("menuitem", { name: /Messages.*Coming soon/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    const preview = within(dialog).getByRole("menuitem", { name: "Profile" });
    expect(preview).toHaveAttribute("href", "/demo/marketer?view=profile");
    preview.addEventListener("click", (event) => event.preventDefault(), { once: true });
    fireEvent.click(preview);
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("restores hamburger focus on Escape and keeps mobile navigation after resizing", async () => {
    render(<MarketerShell device="mobile">Live workspace</MarketerShell>);
    const trigger = await screen.findByRole("button", { name: "Open navigation menu" });
    trigger.focus();
    fireEvent.click(trigger);
    const close = await screen.findByRole("menu", { name: "Open navigation menu" });
    fireEvent.keyDown(close, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    fireEvent.click(trigger);
    await screen.findByRole("menu");
    act(() => {
      vi.stubGlobal("innerWidth", 1440);
      window.dispatchEvent(new Event("resize"));
    });
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Mobile marketer navigation" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Marketer navigation" }),
    ).not.toBeInTheDocument();
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
