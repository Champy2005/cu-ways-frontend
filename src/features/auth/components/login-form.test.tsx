import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";
import { login } from "../api";
import { ApiError } from "@/lib/api/errors";
vi.mock("../api", () => ({ login: vi.fn() }));
const navigation = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);
function fillForm() {
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "mali@example.test" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "test-password" } });
}
describe("login redirect", () => {
  it("redirects a regular user to the dashboard", async () => {
    vi.mocked(login).mockResolvedValue({ role: "user" } as Awaited<ReturnType<typeof login>>);
    render(<LoginForm />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/dashboard"));
  });
  it("redirects an admin to the admin area", async () => {
    vi.mocked(login).mockResolvedValue({ role: "admin" } as Awaited<ReturnType<typeof login>>);
    render(<LoginForm />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/admin"));
  });
});
describe("password visibility toggle", () => {
  it("reveals and hides the password", () => {
    render(<LoginForm />);
    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password).toHaveAttribute("type", "password");
  });
});

describe("login error states", () => {
  it("shows per-field errors and disables Sign in until a field is edited", () => {
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "maiouan99gmail.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByText("Enter a valid email.")).toBeInTheDocument();
    expect(screen.getByText("Enter your password.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "mali@example.test" } });
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
  });

  it("shows the banner without calling the API for a password outside 8-128 chars", () => {
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "mali@example.test" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByText("Incorrect email or password. Please try again.")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("shows the incorrect-credentials banner on a 401", async () => {
    vi.mocked(login).mockRejectedValue(
      new ApiError(401, "invalid_credentials", "invalid email or password"),
    );
    render(<LoginForm />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(
      await screen.findByText("Incorrect email or password. Please try again."),
    ).toBeInTheDocument();
    expect(navigation.push).not.toHaveBeenCalled();
  });
});
