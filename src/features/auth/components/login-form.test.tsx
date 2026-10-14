import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { LoginForm } from "@/features/auth/components/login-form";

const push = vi.fn();
const refresh = vi.fn();
const login = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("@/features/auth/api", () => ({ login: (input: unknown) => login(input) }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("LoginForm", () => {
  it("opens the creator dashboard after signing in", async () => {
    login.mockResolvedValue({ user: { user_id: 1 } });
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "jane@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "correct horse battery staple" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /sign in/i }).closest("form")!);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/creator/dashboard"));
    expect(push).not.toHaveBeenCalledWith("/dashboard");
  });
});
