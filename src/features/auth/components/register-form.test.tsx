import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterForm } from "./register-form";
import { register } from "../api";
import { ApiError } from "@/lib/api/errors";
vi.mock("../api", () => ({ register: vi.fn() }));
const navigation = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);
function fillForm() {
  for (const [name, value] of [
    ["First name", " Mali "],
    ["Last name", " Srisai "],
    ["Email", "mali@example.test"],
    ["Phone number", " 0812345678 "],
    ["Password", "test-password"],
  ])
    fireEvent.change(screen.getByLabelText(name, { exact: false }), { target: { value } });
}
describe("required registration identity", () => {
  it("blocks empty and whitespace-only required fields and leaves phone optional", () => {
    render(<RegisterForm />);
    for (const name of ["First name", "Last name", "Email", "Password"]) {
      const field = screen.getByLabelText(name, { exact: false });
      expect(field).toBeRequired();
      fireEvent.change(field, { target: { value: "   " } });
    }
    const phoneField = screen.getByLabelText("Phone number", { exact: false });
    expect(phoneField).not.toBeRequired();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(register).not.toHaveBeenCalled();
    expect(screen.getByLabelText("First name", { exact: false })).toHaveAccessibleDescription(
      "Enter your first name.",
    );
    expect(screen.getByLabelText("Last name", { exact: false })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(phoneField).not.toHaveAttribute("aria-invalid", "true");
  });
  it("combines trimmed names for the backend and leaves LINE optional", async () => {
    vi.mocked(register).mockResolvedValue({} as Awaited<ReturnType<typeof register>>);
    render(<RegisterForm />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/dashboard"));
    expect(register).toHaveBeenCalledWith({
      name: "Mali Srisai",
      email: "mali@example.test",
      phone: "0812345678",
      password: "test-password",
      line_id: null,
    });
  });
  it("submits successfully with empty phone and passes null to backend", async () => {
    vi.mocked(register).mockResolvedValue({} as Awaited<ReturnType<typeof register>>);
    render(<RegisterForm />);
    for (const [name, value] of [
      ["First name", "Mali"],
      ["Last name", "Srisai"],
      ["Email", "mali@example.test"],
      ["Password", "test-password"],
    ]) {
      fireEvent.change(screen.getByLabelText(name, { exact: false }), { target: { value } });
    }
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/dashboard"));
    expect(register).toHaveBeenCalledWith({
      name: "Mali Srisai",
      email: "mali@example.test",
      phone: null,
      password: "test-password",
      line_id: null,
    });
  });
  it("displays inline error when backend rejects duplicate email and clears on edit", async () => {
    vi.mocked(register).mockRejectedValue(
      new ApiError(409, "email_already_exists", "email already exists"),
    );
    render(<RegisterForm />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    const emailField = screen.getByLabelText("Email", { exact: false });
    await waitFor(() =>
      expect(emailField).toHaveAccessibleDescription("Email is already registered."),
    );
    expect(emailField).toHaveAttribute("aria-invalid", "true");

    fireEvent.change(emailField, { target: { value: "different@example.test" } });
    expect(emailField).not.toHaveAccessibleDescription("Email is already registered.");
    expect(emailField).not.toHaveAttribute("aria-invalid", "true");
  });
  it("displays inline error when backend rejects duplicate phone number and clears on edit", async () => {
    vi.mocked(register).mockRejectedValue(
      new ApiError(409, "phone_already_exists", "phone already exists"),
    );
    render(<RegisterForm />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    const phoneField = screen.getByLabelText("Phone number", { exact: false });
    await waitFor(() =>
      expect(phoneField).toHaveAccessibleDescription("Phone number is already registered."),
    );
    expect(phoneField).toHaveAttribute("aria-invalid", "true");

    fireEvent.change(phoneField, { target: { value: "0899999999" } });
    expect(phoneField).not.toHaveAccessibleDescription("Phone number is already registered.");
    expect(phoneField).not.toHaveAttribute("aria-invalid", "true");
  });
  it("retains fields after a failed request", async () => {
    vi.mocked(register).mockRejectedValue(new Error("Connection unavailable"));
    render(<RegisterForm />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    await screen.findByRole("alert");
    expect(screen.getByLabelText("First name", { exact: false })).toHaveValue(" Mali ");
    expect(navigation.push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Create account" })).toBeEnabled();
  });
});
