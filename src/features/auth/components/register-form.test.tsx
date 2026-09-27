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
  it("blocks empty and whitespace-only fields with associated errors", () => {
    render(<RegisterForm />);
    for (const name of ["First name", "Last name", "Email"]) {
      const field = screen.getByLabelText(name, { exact: false });
      expect(field).toBeRequired();
      fireEvent.change(field, { target: { value: "   " } });
    }
    expect(screen.getByLabelText("Phone number", { exact: false })).not.toBeRequired();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(register).not.toHaveBeenCalled();
    expect(screen.getByLabelText("First name", { exact: false })).toHaveAccessibleDescription(
      "Enter your first name.",
    );
    expect(screen.getByLabelText("Last name", { exact: false })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
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
  it("submits successfully with phone left empty", async () => {
    vi.mocked(register).mockResolvedValue({} as Awaited<ReturnType<typeof register>>);
    render(<RegisterForm />);
    fillForm();
    fireEvent.change(screen.getByLabelText("Phone number", { exact: false }), {
      target: { value: "" },
    });
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
  it("shows a field error when the email is already registered", async () => {
    vi.mocked(register).mockRejectedValue(
      new ApiError(409, "email_already_exists", "Email is already registered."),
    );
    render(<RegisterForm />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("Email is already registered.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email", { exact: false })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
  it("shows a field error when the phone number is already registered", async () => {
    vi.mocked(register).mockRejectedValue(
      new ApiError(409, "phone_already_exists", "Phone number is already registered."),
    );
    render(<RegisterForm />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("Phone number is already registered.")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone number", { exact: false })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
