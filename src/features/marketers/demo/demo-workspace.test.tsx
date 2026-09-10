import { useState, type MouseEvent } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DemoWorkspace } from "./demo-workspace";
import { initialDemoState, resetDemo } from "./store";

/** Simulate Next's query-string navigation while exercising the real demo links and views. */
function DemoNavigation({ initialView = "services" }: { initialView?: string }) {
  const [view, setView] = useState(initialView);

  function navigate(event: MouseEvent<HTMLDivElement>) {
    const anchor = (event.target as Element).closest("a");
    if (!anchor) return;
    const url = new URL(anchor.href);
    if (url.pathname !== "/demo/marketer") return;
    event.preventDefault();
    setView(url.searchParams.get("view") ?? "dashboard");
  }

  return (
    <div onClickCapture={navigate}>
      <DemoWorkspace view={view} />
    </div>
  );
}

function visit(label: "Overview" | "Services" | "Profile" | "Creator view") {
  const navigation = within(screen.getByRole("navigation", { name: "Demo views" }));
  fireEvent.click(navigation.getByRole("link", { name: label }));
}

const noNetwork = vi.fn<typeof fetch>(() =>
  Promise.reject(new Error("The demo must never call fetch.")),
);

beforeEach(() => {
  sessionStorage.clear();
  resetDemo();
  noNetwork.mockClear();
  vi.stubGlobal("fetch", noNetwork);
});

afterEach(() => {
  expect(noNetwork).not.toHaveBeenCalled();
  cleanup();
  vi.unstubAllGlobals();
});

describe("DemoWorkspace integration", () => {
  it.each(["profile", "services"])(
    "hydrates the %s view from stored browser data before mounting local editing state",
    async (view) => {
      // Write storage directly, leaving the module's cached snapshot at the default fixture.
      // This reproduces a hard reload where SSR cannot read the existing browser session.
      const stored = {
        ...initialDemoState,
        profile: {
          ...initialDemoState.profile,
          bio: "A biography saved before reloading",
          experience_years: 1.75,
          availability_text: "Monday evenings",
        },
        services: [
          {
            ...initialDemoState.services[0],
            service_id: 777,
            service_type: "Package saved before reloading",
            scope_text: "Previously saved delivery scope",
            price: "725.25",
          },
        ],
      };
      sessionStorage.setItem("cuways-marketer-demo-v1", JSON.stringify(stored));
      const container = document.createElement("div");
      document.body.append(container);
      container.innerHTML = renderToString(<DemoWorkspace view={view} />);
      const serverView = within(container);
      expect(serverView.getByRole("status")).toHaveTextContent("Loading demo…");
      expect(container.querySelector("input, textarea, form")).toBeNull();
      expect(serverView.queryByText("On-Campus Distribution")).not.toBeInTheDocument();

      const recoverableError = vi.fn();
      let root: Root | undefined;
      try {
        await act(async () => {
          root = hydrateRoot(container, <DemoWorkspace view={view} />, {
            onRecoverableError: recoverableError,
          });
        });
        if (view === "profile") {
          expect(serverView.getByLabelText("Bio")).toHaveValue(stored.profile.bio);
          expect(serverView.getByLabelText("Years of experience")).toHaveValue("1.75");
          expect(serverView.getByLabelText("Availability text")).toHaveValue("Monday evenings");
        } else {
          expect(
            serverView.getByRole("heading", { name: stored.services[0].service_type }),
          ).toBeInTheDocument();
          expect(serverView.getByText("฿725.25")).toBeInTheDocument();
          expect(serverView.queryByText("On-Campus Distribution")).not.toBeInTheDocument();
          fireEvent.click(
            serverView.getByRole("button", { name: "Edit Package saved before reloading" }),
          );
          expect(serverView.getByLabelText(/Standard pricing \(THB\)/)).toHaveValue("725.25");
          expect(serverView.getByLabelText(/Scope description/)).toHaveValue(
            "Previously saved delivery scope",
          );
        }
        expect(recoverableError).not.toHaveBeenCalled();
      } finally {
        await act(async () => root?.unmount());
        container.remove();
      }
    },
  );

  it("publishes and edits packages through the owner view and shows the latest catalog to creators", async () => {
    render(<DemoNavigation />);
    fireEvent.click(screen.getByRole("button", { name: "Publish a service" }));
    fireEvent.change(screen.getByLabelText(/Service type/), { target: { value: "custom" } });
    fireEvent.change(screen.getByLabelText(/Custom service name/), {
      target: { value: "Research interview outreach" },
    });
    fireEvent.change(screen.getByLabelText(/Scope description/), {
      target: { value: "Invite student participants\nProvide an outreach summary" },
    });
    fireEvent.change(screen.getByLabelText(/Standard pricing \(THB\)/), {
      target: { value: "425.50" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));
    await screen.findByText("Service published successfully.");

    visit("Creator view");
    expect(screen.getByRole("heading", { name: "Mali Srisai’s services" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Research interview outreach" }),
    ).toBeInTheDocument();
    expect(screen.getByText("฿425.50")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Publish a service|Edit |Delete / }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/earnings|Only visible to you|12,400/)).not.toBeInTheDocument();

    visit("Services");
    fireEvent.click(screen.getByRole("button", { name: "Edit Research interview outreach" }));
    expect(screen.getByLabelText(/Scope description/)).toHaveValue(
      "Invite student participants\nProvide an outreach summary",
    );
    fireEvent.change(screen.getByLabelText(/Standard pricing \(THB\)/), {
      target: { value: "500.25" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByText("Service updated successfully.");
    visit("Creator view");
    expect(screen.getByText("฿500.25")).toBeInTheDocument();
    expect(screen.queryByText("฿425.50")).not.toBeInTheDocument();
  });

  it("retains saved professional information across navigation and a fresh workspace mount", async () => {
    const { unmount } = render(<DemoNavigation initialView="profile" />);
    fireEvent.change(screen.getByLabelText("Bio"), {
      target: { value: "Available for thoughtful campus outreach." },
    });
    fireEvent.change(screen.getByLabelText("Years of experience"), { target: { value: "0.5" } });
    fireEvent.change(screen.getByLabelText("Availability text"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm changes" }));
    await screen.findByText("Professional information saved.");

    visit("Overview");
    expect(screen.getByText("12,400.00")).toBeInTheDocument();
    visit("Creator view");
    expect(screen.queryByText(/earnings|12,400|Only visible to you/)).not.toBeInTheDocument();
    visit("Profile");
    expect(screen.getByLabelText("Bio")).toHaveValue("Available for thoughtful campus outreach.");
    expect(screen.getByLabelText("Years of experience")).toHaveValue("0.5");
    expect(screen.getByLabelText("Availability text")).toHaveValue("");

    unmount();
    render(<DemoNavigation initialView="profile" />);
    expect(screen.getByLabelText("Bio")).toHaveValue("Available for thoughtful campus outreach.");
    expect(screen.getByLabelText("Years of experience")).toHaveValue("0.5");
    expect(sessionStorage.getItem("cuways-marketer-demo-v1")).toContain(
      "Available for thoughtful campus outreach.",
    );
  });

  it("resets saved and unsaved profile values and removes validation state", async () => {
    render(<DemoNavigation initialView="profile" />);
    fireEvent.change(screen.getByLabelText("Bio"), {
      target: { value: "Previously saved demo bio" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm changes" }));
    await screen.findByText("Professional information saved.");
    fireEvent.change(screen.getByLabelText("Bio"), { target: { value: "An unsaved edit" } });
    fireEvent.change(screen.getByLabelText("Years of experience"), { target: { value: "-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm changes" }));
    expect(screen.getByLabelText("Years of experience")).toHaveAttribute("aria-invalid", "true");

    fireEvent.click(screen.getByRole("button", { name: "Reset demo" }));
    await waitFor(() =>
      expect(screen.getByLabelText("Bio")).toHaveValue(initialDemoState.profile.bio),
    );
    expect(screen.getByLabelText("Years of experience")).toHaveValue("2.5");
    expect(screen.getByLabelText("Years of experience")).toHaveAttribute("aria-invalid", "false");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("Professional information saved.")).not.toBeInTheDocument();
    visit("Overview");
    visit("Profile");
    expect(screen.getByLabelText("Bio")).toHaveValue(initialDemoState.profile.bio);
  });

  it("restores deleted service fixtures in both owner and viewer catalogs after reset", async () => {
    render(<DemoNavigation />);
    fireEvent.click(screen.getByRole("button", { name: "Delete On-Campus Distribution" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete service" }));
    await screen.findByText("Service deleted successfully.");
    visit("Creator view");
    expect(
      screen.queryByRole("heading", { name: "On-Campus Distribution" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reset demo" }));
    expect(screen.getByRole("heading", { name: "On-Campus Distribution" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Edit |Delete / })).not.toBeInTheDocument();
    visit("Services");
    expect(screen.getByRole("button", { name: "Edit On-Campus Distribution" })).toBeInTheDocument();
    expect(screen.getByText("2 services")).toBeInTheDocument();
  });
});
