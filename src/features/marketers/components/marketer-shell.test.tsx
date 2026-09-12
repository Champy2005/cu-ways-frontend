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
  it("follows the system until a theme is explicitly selected", () => {
    const media = Object.assign(new EventTarget(), { matches: true });
    vi.stubGlobal("matchMedia", () => media);
    render(<MarketerShell>System theme</MarketerShell>);
    expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeInTheDocument();
    expect(localStorage.getItem("cuways-marketer-theme")).toBeNull();
    act(() => {
      media.matches = false;
      media.dispatchEvent(new Event("change"));
    });
    fireEvent.click(screen.getByRole("button", { name: "Switch to dark theme" }));
    act(() => media.dispatchEvent(new Event("change")));
    expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeInTheDocument();
    expect(localStorage.getItem("cuways-marketer-theme")).toBe("dark");
  });

  it("uses the system for an invalid saved theme and honors saved light over system dark", () => {
    vi.stubGlobal("matchMedia", () => Object.assign(new EventTarget(), { matches: true }));
    localStorage.setItem("cuways-marketer-theme", "invalid");
    const first = render(<MarketerShell>Theme</MarketerShell>);
    expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeInTheDocument();
    first.unmount();
    localStorage.setItem("cuways-marketer-theme", "light");
    render(<MarketerShell>Theme</MarketerShell>);
    expect(screen.getByRole("button", { name: "Switch to dark theme" })).toBeInTheDocument();
  });

  it("closes an open desktop menu when crossing the wide breakpoint", async () => {
    const media = Object.assign(new EventTarget(), { matches: false });
    vi.stubGlobal("matchMedia", () => media);
    render(<MarketerShell device="desktop">Live workspace</MarketerShell>);
    fireEvent.click(await screen.findByRole("button", { name: "Open navigation menu" }));
    const menu = await screen.findByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: "Services" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    act(() => {
      media.matches = true;
      media.dispatchEvent(new Event("change"));
    });
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("previews both roles without requests or session changes and resets on remount", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const cookie = document.cookie;
    const first = render(<MarketerShell>Role preview</MarketerShell>);
    fireEvent.click(screen.getByRole("button", { name: "Switch role preview, current: Marketer" }));
    fireEvent.click(await screen.findByRole("menuitemradio", { name: "Creator" }));
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    const trigger = screen.getByRole("button", { name: "Switch role preview, current: Creator" });
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.getByRole("status")).toHaveTextContent("Creator preview selected");
    fireEvent.click(trigger);
    expect(await screen.findByRole("menuitemradio", { name: "Creator" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Marketer" }));
    expect(screen.getByRole("status")).toHaveTextContent("Marketer preview selected");
    expect(fetch).not.toHaveBeenCalled();
    expect(document.cookie).toBe(cookie);
    first.unmount();
    render(<MarketerShell>Role preview</MarketerShell>);
    const reset = screen.getByRole("button", { name: "Switch role preview, current: Marketer" });
    reset.focus();
    fireEvent.click(reset);
    fireEvent.keyDown(await screen.findByRole("menu"), { key: "Escape" });
    await waitFor(() => expect(reset).toHaveFocus());
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it.each([375, 767, 768, 1440])("never mounts a mobile bar on desktop at %ipx", (width) => {
    vi.stubGlobal("innerWidth", width);
    render(<MarketerShell device="desktop">Live workspace</MarketerShell>);
    const nav = within(screen.getByRole("navigation", { name: "Marketer navigation" }));
    expect(nav.getByRole("link", { name: "Services" })).toHaveAttribute("aria-current", "page");
    expect(
      screen.queryByRole("navigation", { name: "Mobile marketer navigation" }),
    ).not.toBeInTheDocument();
    expect(document.querySelector(".mk-navigation-mobile")).toBeNull();
    // CSS hides the compact trigger at wide desktop widths.
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
    expect(within(dialog).getByRole("menuitem", { name: "Services" })).toHaveAttribute(
      "href",
      "/demo/marketer?view=services",
    );
    expect(within(dialog).getByRole("menuitem", { name: "Creator view" })).toHaveAttribute(
      "aria-current",
      "page",
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
