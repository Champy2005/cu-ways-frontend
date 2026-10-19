import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserProfileCard } from "./user-profile-card";
import { updateCurrentUser } from "@/features/users/browser-api";
import { ApiError } from "@/lib/api/errors";
import type { User } from "@/features/users/types";

vi.mock("@/features/users/browser-api", () => ({
  updateCurrentUser: vi.fn(),
}));

const mockUser: User = {
  user_id: 1,
  name: "Jane Doe",
  email: "jane@example.com",
  phone: "0812345678",
  line_id: "jane.line",
  created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(cleanup);

describe("UserProfileCard", () => {
  it("requires a phone and preserves changes when a blank phone is submitted", () => {
    render(<UserProfileCard user={mockUser} />);
    const phone = screen.getByRole("textbox", { name: "Phone number" });
    expect(phone).toBeRequired();
    expect(screen.getByText("Phone number is required. LINE ID is optional.")).toBeInTheDocument();
    fireEvent.change(phone, { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("LINE ID"), { target: { value: "updated.line" } });
    fireEvent.submit(
      screen.getByRole("button", { name: "Save contact information" }).closest("form")!,
    );
    expect(updateCurrentUser).not.toHaveBeenCalled();
    expect(phone).toHaveAccessibleDescription("Phone number is required.");
    expect(screen.getByLabelText("LINE ID")).toHaveValue("updated.line");
  });

  it("submits valid contact information and updates profile", async () => {
    vi.mocked(updateCurrentUser).mockResolvedValue({
      ...mockUser,
      phone: "0898765432",
      line_id: null,
    });

    render(<UserProfileCard user={mockUser} />);

    const phoneField = screen.getByRole("textbox", { name: "Phone number" });

    fireEvent.change(phoneField, { target: { value: "0898765432" } });
    fireEvent.change(screen.getByLabelText("LINE ID"), { target: { value: "" } });

    fireEvent.click(screen.getByRole("button", { name: "Save contact information" }));

    await waitFor(() => {
      expect(updateCurrentUser).toHaveBeenCalledWith({
        phone: "0898765432",
        line_id: null,
      });
    });

    expect(await screen.findByText("Contact information saved.")).toBeInTheDocument();
  });

  it("displays inline error when backend rejects duplicate phone number and clears on edit", async () => {
    vi.mocked(updateCurrentUser).mockRejectedValue(
      new ApiError(409, "phone_already_exists", "phone already exists"),
    );

    render(<UserProfileCard user={mockUser} />);

    const phoneField = screen.getByRole("textbox", { name: "Phone number" });
    fireEvent.change(phoneField, { target: { value: "0899999999" } });

    fireEvent.click(screen.getByRole("button", { name: "Save contact information" }));

    await waitFor(() => {
      expect(phoneField).toHaveAccessibleDescription("Phone number is already registered.");
    });
    expect(phoneField).toHaveAttribute("aria-invalid", "true");

    // Clear error on edit
    fireEvent.change(phoneField, { target: { value: "0811111111" } });
    expect(phoneField).not.toHaveAccessibleDescription("Phone number is already registered.");
    expect(phoneField).not.toHaveAttribute("aria-invalid", "true");
  });
});
