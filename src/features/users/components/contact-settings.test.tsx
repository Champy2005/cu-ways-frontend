import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { ContactSettings } from "@/features/users/components/contact-settings";
import { ApiError } from "@/lib/api/errors";

const updateCurrentUser = vi.fn();
vi.mock("@/features/users/browser-api", () => ({
  updateCurrentUser: (input: unknown) => updateCurrentUser(input),
}));

const user = {
  user_id: 7,
  name: "Mai Ouan",
  email: "maiouan99@gmail.com",
  phone: "0812345678",
  line_id: null,
  created_at: "2026-10-01T00:00:00Z",
};

function phoneInput() {
  return screen.getByLabelText("Phone number");
}

function save() {
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ContactSettings", () => {
  it("shows the email as read-only and the phone as xxx-xxx-xxxx", () => {
    render(<ContactSettings user={user} />);
    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Email")).toHaveValue("maiouan99@gmail.com");
    expect(screen.getByText("This is the email you signed up with")).toBeInTheDocument();
    expect(phoneInput()).toHaveValue("081-234-5678");
    expect(screen.getByText("Optional")).toBeInTheDocument();
  });

  it("saves digits only and shows the success banner", async () => {
    updateCurrentUser.mockResolvedValue({ ...user, phone: "0888888989", line_id: "mai.line" });
    render(<ContactSettings user={user} />);
    fireEvent.change(phoneInput(), { target: { value: "088-888-8989" } });
    fireEvent.change(screen.getByLabelText("Line ID"), { target: { value: " mai.line " } });
    save();

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Your contact info has been updated",
    );
    expect(updateCurrentUser).toHaveBeenCalledWith({ phone: "0888888989", line_id: "mai.line" });
    expect(phoneInput()).toHaveValue("088-888-8989");
  });

  it("blocks a phone that isn't 10 digits", () => {
    render(<ContactSettings user={user} />);
    fireEvent.change(phoneInput(), { target: { value: "088-88" } });
    save();

    expect(screen.getByText("Phone number must be 10 digits")).toBeInTheDocument();
    expect(phoneInput()).toHaveAttribute("aria-invalid", "true");
    expect(updateCurrentUser).not.toHaveBeenCalled();
  });

  it("keeps the phone required", () => {
    render(<ContactSettings user={user} />);
    fireEvent.change(phoneInput(), { target: { value: "  " } });
    save();

    expect(screen.getByText("Phone number is required.")).toBeInTheDocument();
    expect(updateCurrentUser).not.toHaveBeenCalled();
  });

  it("shows the banner and field error when the phone is taken", async () => {
    updateCurrentUser.mockRejectedValue(
      new ApiError(409, "phone_already_exists", "phone already exists"),
    );
    render(<ContactSettings user={user} />);
    fireEvent.change(phoneInput(), { target: { value: "088-888-8989" } });
    save();

    expect(await screen.findByText("Couldn’t save changes.")).toBeInTheDocument();
    expect(screen.getByText("Please check your phone number.")).toBeInTheDocument();
    expect(screen.getByText("This phone number is already in use")).toBeInTheDocument();
    expect(phoneInput()).toHaveValue("088-888-8989");

    fireEvent.change(phoneInput(), { target: { value: "088-888-8990" } });
    expect(screen.queryByText("Couldn’t save changes.")).not.toBeInTheDocument();
  });
});
