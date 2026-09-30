import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";
import { login } from "../api";
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
