import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileWorkspace } from "./profile-workspace";
import { initialDemoState } from "../demo/store";
import type { ProfileInput } from "../types";
import type { UpdateUserRequest } from "@/features/users/types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
beforeEach(() => window.history.replaceState(null, "", "/marketer/profile"));
afterEach(cleanup);

function setup(overrides: Partial<React.ComponentProps<typeof ProfileWorkspace>> = {}) {
  const saveProfile = vi.fn(async (input: ProfileInput) => ({
    ...initialDemoState.profile,
    ...input,
  }));
  const saveContact = vi.fn(async (input: UpdateUserRequest) => ({
    ...initialDemoState.contact,
    ...input,
  }));
  render(
    <ProfileWorkspace
      profile={initialDemoState.profile}
      contact={initialDemoState.contact}
      saveProfile={saveProfile}
      saveContact={saveContact}
      {...overrides}
    />,
  );
  return { saveProfile, saveContact };
}
function select(name: string) {
  fireEvent.click(screen.getByRole("tab", { name }));
}

describe("Unified profile", () => {
  it("retains both drafts and saves each independently, including optional clearing", async () => {
    const { saveProfile, saveContact } = setup();
    fireEvent.change(screen.getByLabelText("Bio"), {
      target: { value: "Unsaved professional draft" },
    });
    select("Basic information");
    expect(window.location.search).toBe("?tab=basic");
    expect(screen.getByText("mali@example.test")).toBeVisible();
    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: " 0812345678 " } });
    fireEvent.change(screen.getByLabelText("LINE ID"), { target: { value: " " } });
    select("In-depth information");
    expect(screen.getByLabelText("Bio")).toHaveValue("Unsaved professional draft");
    fireEvent.click(screen.getByRole("button", { name: "Confirm changes" }));
    await screen.findByText("Professional information saved.");
    expect(saveContact).not.toHaveBeenCalled();
    select("Basic information");
    expect(screen.getByLabelText("Phone")).toHaveValue(" 0812345678 ");
    fireEvent.click(screen.getByRole("button", { name: "Save contact information" }));
    await screen.findByText("Contact information saved.");
    expect(saveContact).toHaveBeenCalledWith({ phone: "0812345678", line_id: null });
    expect(saveProfile).toHaveBeenCalledTimes(1);
  });

  it("uses direct tab links and reacts to browser history without remounting drafts", () => {
    window.history.replaceState(null, "", "/marketer/profile?tab=basic");
    setup({ initialTab: "basic" });
    expect(screen.getByRole("tab", { name: "Basic information" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "123" } });
    select("In-depth information");
    act(() => {
      window.history.replaceState(null, "", "/marketer/profile?tab=basic");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(screen.getByLabelText("Phone")).toHaveValue("123");
    expect(screen.getByRole("tab", { name: "Basic information" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("keeps contacts usable when professional data is unavailable", async () => {
    const { saveContact } = setup({ profile: undefined, professionalFailure: "unavailable" });
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
    select("Basic information");
    fireEvent.click(screen.getByRole("button", { name: "Save contact information" }));
    await screen.findByText("Contact information saved.");
    expect(saveContact).toHaveBeenCalledOnce();
  });

  it("retains contact input on request failure and blocks duplicate submissions", async () => {
    let reject!: (reason: Error) => void;
    const saveContact = vi.fn(
      () =>
        new Promise<never>((_, fail) => {
          reject = fail;
        }),
    );
    setup({ saveContact });
    select("Basic information");
    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "123" } });
    const button = screen.getByRole("button", { name: "Save contact information" });
    fireEvent.submit(button.closest("form")!);
    fireEvent.submit(button.closest("form")!);
    expect(saveContact).toHaveBeenCalledOnce();
    expect(button).toBeDisabled();
    await act(async () => reject(new Error("Network unavailable")));
    await waitFor(() => expect(button).not.toBeDisabled());
    expect(screen.getByLabelText("Phone")).toHaveValue("123");
    expect(screen.getByRole("alert")).toHaveTextContent("Your changes are still here");
  });
});
