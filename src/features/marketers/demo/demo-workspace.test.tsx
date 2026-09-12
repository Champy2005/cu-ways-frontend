import { MarketerNavigation } from "../components/marketer-navigation";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DemoWorkspace } from "./demo-workspace";
import { initialDemoState, resetDemo } from "./store";

vi.mock("next/navigation", () => ({
  usePathname: () => "/demo/marketer",
  useRouter: () => ({ refresh: vi.fn() }),
}));
function DemoNavigation({ initialView = "services" }: { initialView?: string }) {
  return (
    <>
      <MarketerNavigation demo selected={initialView} />
      <DemoWorkspace view={initialView} />
    </>
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
  window.history.replaceState(null, "", "/demo/marketer");
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
          experience_years: 1,
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
      sessionStorage.setItem("cuways-marketer-demo-v2", JSON.stringify(stored));
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
          expect(await serverView.findByLabelText(/^Bio/)).toHaveValue(stored.profile.bio);
          expect(await serverView.findByLabelText(/^Years of experience/)).toHaveValue("1");
          expect(await serverView.findByLabelText(/^Availability text/)).toHaveValue(
            "Monday evenings",
          );
        } else {
          expect(
            await serverView.findByRole("heading", { name: stored.services[0].service_type }),
          ).toBeInTheDocument();
          expect(serverView.getByText("฿725.25")).toBeInTheDocument();
          expect(serverView.queryByText("On-Campus Distribution")).not.toBeInTheDocument();
          fireEvent.click(
            serverView.getByRole("button", { name: "Edit Package saved before reloading" }),
          );
          expect(await serverView.findByLabelText(/Standard pricing \(THB\)/)).toHaveValue(
            "725.25",
          );
          expect(await serverView.findByLabelText(/Scope description/)).toHaveValue(
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
    fireEvent.click(await screen.findByRole("button", { name: "Publish a service" }));
    fireEvent.click(await screen.findByRole("combobox", { name: /Service type/ }));
    fireEvent.keyDown(await screen.findByRole("option", { name: "Custom service" }), {
      key: "Enter",
    });
    fireEvent.change(await screen.findByLabelText(/Custom service name/), {
      target: { value: "Research interview outreach" },
    });
    fireEvent.change(await screen.findByLabelText(/Scope description/), {
      target: { value: "Invite student participants\nProvide an outreach summary" },
    });
    fireEvent.change(await screen.findByLabelText(/Standard pricing \(THB\)/), {
      target: { value: "425.50" },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Publish" }));
    await screen.findByText("Service published successfully.");

    visit("Creator view");
    expect(
      await screen.findByRole("heading", { name: "Mali Srisai’s services" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Research interview outreach" }),
    ).toBeInTheDocument();
    expect(screen.getByText("฿425.50")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Publish a service|Edit |Delete / }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/earnings|Only visible to you|12,400/)).not.toBeInTheDocument();

    visit("Services");
    fireEvent.click(
      await screen.findByRole("button", { name: "Edit Research interview outreach" }),
    );
    expect(await screen.findByLabelText(/Scope description/)).toHaveValue(
      "Invite student participants\nProvide an outreach summary",
    );
    fireEvent.change(await screen.findByLabelText(/Standard pricing \(THB\)/), {
      target: { value: "500.25" },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Save changes" }));
    await screen.findByText("Service updated successfully.");
    visit("Creator view");
    expect(screen.getByText("฿500.25")).toBeInTheDocument();
    expect(screen.queryByText("฿425.50")).not.toBeInTheDocument();
  });

  it("retains saved professional information across navigation and a fresh workspace mount", async () => {
    const { unmount } = render(<DemoNavigation initialView="profile" />);
    fireEvent.change(await screen.findByLabelText(/^Bio/), {
      target: { value: "Available for thoughtful campus outreach." },
    });
    fireEvent.change(await screen.findByLabelText(/^Years of experience/), {
      target: { value: "0" },
    });
    fireEvent.change(await screen.findByLabelText(/^Availability text/), {
      target: { value: "Weekdays" },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Confirm changes" }));
    await screen.findByText("Professional information saved.");

    visit("Overview");
    expect(await screen.findByText("12,400.00")).toBeInTheDocument();
    visit("Creator view");
    expect(screen.queryByText(/earnings|12,400|Only visible to you/)).not.toBeInTheDocument();
    visit("Profile");
    expect(await screen.findByLabelText(/^Bio/)).toHaveValue(
      "Available for thoughtful campus outreach.",
    );
    expect(await screen.findByLabelText(/^Years of experience/)).toHaveValue("0");
    expect(await screen.findByLabelText(/^Availability text/)).toHaveValue("Weekdays");

    unmount();
    render(<DemoNavigation initialView="profile" />);
    expect(await screen.findByLabelText(/^Bio/)).toHaveValue(
      "Available for thoughtful campus outreach.",
    );
    expect(await screen.findByLabelText(/^Years of experience/)).toHaveValue("0");
    expect(sessionStorage.getItem("cuways-marketer-demo-v2")).toContain(
      "Available for thoughtful campus outreach.",
    );
  });

  it("resets saved and unsaved profile values and removes validation state", async () => {
    render(<DemoNavigation initialView="profile" />);
    fireEvent.change(await screen.findByLabelText(/^Bio/), {
      target: { value: "Previously saved demo bio" },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Confirm changes" }));
    await screen.findByText("Professional information saved.");
    fireEvent.change(await screen.findByLabelText(/^Bio/), {
      target: { value: "An unsaved edit" },
    });
    fireEvent.change(await screen.findByLabelText(/^Years of experience/), {
      target: { value: "-1" },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Confirm changes" }));
    expect(await screen.findByLabelText(/^Years of experience/)).toHaveAttribute(
      "aria-invalid",
      "true",
    );

    fireEvent.click(await screen.findByRole("button", { name: "Reset demo" }));
    await waitFor(async () =>
      expect(await screen.findByLabelText(/^Bio/)).toHaveValue(initialDemoState.profile.bio),
    );
    expect(await screen.findByLabelText(/^Years of experience/)).toHaveValue("2");
    expect(await screen.findByLabelText(/^Years of experience/)).toHaveAttribute(
      "aria-invalid",
      "false",
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("Professional information saved.")).not.toBeInTheDocument();
    visit("Overview");
    visit("Profile");
    expect(await screen.findByLabelText(/^Bio/)).toHaveValue(initialDemoState.profile.bio);
  });

  it("restores deleted service fixtures in both owner and viewer catalogs after reset", async () => {
    render(<DemoNavigation />);
    fireEvent.click(await screen.findByRole("button", { name: "Delete On-Campus Distribution" }));
    fireEvent.click(await screen.findByRole("button", { name: "Delete service" }));
    await screen.findByText("Service deleted successfully.");
    visit("Creator view");
    expect(
      screen.queryByRole("heading", { name: "On-Campus Distribution" }),
    ).not.toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: "Reset demo" }));
    expect(
      await screen.findByRole("heading", { name: "On-Campus Distribution" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Edit |Delete / })).not.toBeInTheDocument();
    visit("Services");
    expect(
      await screen.findByRole("button", { name: "Edit On-Campus Distribution" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 services")).toBeInTheDocument();
  });
});
