import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Service, ServiceInput } from "@/features/marketers/types";
import { ApiError } from "@/lib/api/errors";

import { ServiceCatalog, type ServiceCatalogProps } from "./service-catalog";

const marketer = { user_id: 17, name: "Mali Demo" };
const service: Service = {
  service_id: 4,
  service_type: "On-Campus Distribution",
  scope_text: "LINE groups\n30 responses in three days",
  price: "599.00",
  created_at: "2026-09-01T00:00:00Z",
};

function setup(services: Service[] = [service]) {
  const actions = {
    createService: vi.fn(async (input: ServiceInput) => ({ ...service, ...input, service_id: 5 })),
    updateService: vi.fn(async (id: number, input: ServiceInput) => ({
      ...service,
      ...input,
      service_id: id,
    })),
    deleteService: vi.fn<(id: number) => Promise<void>>(async () => {}),
  };
  const onServicesChange = vi.fn();
  render(
    <ServiceCatalog
      services={services}
      marketer={marketer}
      actions={actions}
      onServicesChange={onServicesChange}
    />,
  );
  return { actions, onServicesChange };
}

function chooseService(type = "General Survey Boost", price = "250") {
  fireEvent.change(screen.getByLabelText(/Service type/), { target: { value: type } });
  fireEvent.change(screen.getByLabelText(/Standard pricing \(THB\)/), { target: { value: price } });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ServiceCatalog", () => {
  it("shows a read-only catalog with no management controls or private statistics", () => {
    render(<ServiceCatalog marketer={marketer} services={[{ ...service, scope_text: null }]} />);
    expect(screen.getByRole("heading", { name: "Mali Demo’s services" })).toBeInTheDocument();
    expect(screen.getByText("Not specified")).toBeInTheDocument();
    expect(screen.getByText("฿599.00")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText(/earnings/i)).not.toBeInTheDocument();
  });

  it("validates missing type and price without publishing", async () => {
    const { actions } = setup([]);
    fireEvent.click(screen.getByRole("button", { name: "Publish a service" }));
    fireEvent.click(await screen.findByRole("button", { name: "Publish" }));
    expect(
      await screen.findByText("Choose a service type or enter a custom service name."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Standard pricing \(THB\)/)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(actions.createService).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByLabelText(/Service type/)).toHaveFocus());
  });

  it("returns keyboard focus to the opener after cancelling a pristine form", async () => {
    setup([]);
    const opener = screen.getByRole("button", { name: "Publish a service" });
    opener.focus();
    fireEvent.click(opener);
    await screen.findByRole("dialog");
    fireEvent.click(screen.getByRole("button", { name: "Close service dialog" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(opener).toHaveFocus());
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("publishes a custom zero-price service and preserves scope line breaks", async () => {
    const { actions, onServicesChange } = setup([]);
    fireEvent.click(screen.getByRole("button", { name: "Publish a service" }));
    chooseService("custom", "0");
    fireEvent.change(screen.getByLabelText(/Custom service name/), {
      target: { value: "Survey translation" },
    });
    fireEvent.change(screen.getByLabelText(/Scope description/), {
      target: { value: "Translate questions\nDeliver a reviewed document" },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Publish" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Service published successfully.");
    expect(actions.createService).toHaveBeenCalledWith({
      service_type: "Survey translation",
      scope_text: "Translate questions\nDeliver a reviewed document",
      price: "0.00",
    });
    expect(screen.getByRole("heading", { name: "Survey translation" })).toBeInTheDocument();
    expect(onServicesChange).toHaveBeenCalledWith([
      expect.objectContaining({ service_id: 5, price: "0.00" }),
    ]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("retains values and maps backend field errors, then permits retry", async () => {
    const { actions } = setup([]);
    actions.createService.mockRejectedValueOnce(
      new ApiError(422, "invalid_input", "Please update the service price.", {
        price: "This price cannot be published.",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Publish a service" }));
    chooseService();
    fireEvent.click(await screen.findByRole("button", { name: "Publish" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Please update the service price.");
    expect(screen.getByText("This price cannot be published.")).toBeInTheDocument();
    expect(screen.getByLabelText(/Standard pricing \(THB\)/)).toHaveValue("250");
    expect(screen.getByLabelText(/Service type/)).toHaveValue("General Survey Boost");
    fireEvent.change(screen.getByLabelText(/Standard pricing \(THB\)/), {
      target: { value: "300" },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Publish" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Service published successfully.");
  });

  it("does not duplicate submissions or dismiss a pending publish", async () => {
    const { actions } = setup([]);
    let finish!: (value: Service) => void;
    actions.createService.mockImplementation(
      () =>
        new Promise<Service>((resolve) => {
          finish = resolve;
        }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Publish a service" }));
    chooseService();
    const publish = screen.getByRole("button", { name: "Publish" });
    fireEvent.click(publish);
    fireEvent.click(publish);
    expect(actions.createService).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Close service dialog" })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    finish({ ...service, service_id: 5 });
    await screen.findByRole("status");
  });

  it("edits a custom service without losing existing free text", async () => {
    const custom = {
      ...service,
      service_type: "Faculty workshop",
      scope_text: "  Recruit participants\n  Host session\n",
    };
    const { actions } = setup([custom]);
    fireEvent.click(screen.getByRole("button", { name: "Edit Faculty workshop" }));
    expect(screen.getByLabelText(/Service type/)).toHaveValue("custom");
    expect(screen.getByLabelText(/Custom service name/)).toHaveValue("Faculty workshop");
    expect(screen.getByLabelText(/Scope description/)).toHaveValue(custom.scope_text);
    fireEvent.change(screen.getByLabelText(/Standard pricing \(THB\)/), {
      target: { value: "650.25" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByRole("status");
    expect(actions.updateService).toHaveBeenCalledWith(4, {
      service_type: custom.service_type,
      scope_text: custom.scope_text,
      price: "650.25",
    });
    expect(screen.getByText("฿650.25")).toBeInTheDocument();
  });

  it("confirms discarding dirty form values and allows continuing to edit", async () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Edit On-Campus Distribution" }));
    fireEvent.change(screen.getByLabelText(/Standard pricing \(THB\)/), {
      target: { value: "700" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Close service dialog" }));
    expect(await screen.findByRole("alertdialog")).toHaveAccessibleName("Discard your changes?");
    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getByLabelText(/Standard pricing \(THB\)/)).toHaveValue("700");
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await screen.findByRole("alertdialog");
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("฿599.00")).toBeInTheDocument();
  });

  it("names the service before deletion, retains it on cancel and failure, and removes after success", async () => {
    const { actions, onServicesChange } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Delete On-Campus Distribution" }));
    expect(
      within(screen.getByRole("alertdialog")).getByText("On-Campus Distribution"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(actions.deleteService).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    actions.deleteService.mockRejectedValueOnce(
      new ApiError(403, "forbidden", "This service belongs to another marketer."),
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete On-Campus Distribution" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete service" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This service belongs to another marketer.",
    );
    expect(onServicesChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Delete service" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Service deleted successfully.");
    expect(screen.getByText("No published services yet")).toBeInTheDocument();
    expect(onServicesChange).toHaveBeenCalledWith([]);
  });

  it("reflects successful catalog changes when switching into viewer mode", async () => {
    function SharedCatalog() {
      const [services, setServices] = useState<Service[]>([]);
      const [owner, setOwner] = useState(true);
      const actions: ServiceCatalogProps["actions"] = {
        createService: async (input) => ({ ...service, ...input }),
        updateService: async (id, input) => ({ ...service, ...input, service_id: id }),
        deleteService: async () => {},
      };
      return (
        <>
          <button onClick={() => setOwner(false)}>Viewer preview</button>
          <ServiceCatalog
            key={String(owner)}
            marketer={marketer}
            services={services}
            actions={owner ? actions : undefined}
            onServicesChange={setServices}
          />
        </>
      );
    }
    render(<SharedCatalog />);
    fireEvent.click(screen.getByRole("button", { name: "Publish a service" }));
    chooseService();
    fireEvent.click(await screen.findByRole("button", { name: "Publish" }));
    await screen.findByRole("status");
    fireEvent.click(screen.getByRole("button", { name: "Viewer preview" }));
    expect(screen.getByRole("heading", { name: "General Survey Boost" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Edit General/ })).not.toBeInTheDocument();
  });
});
