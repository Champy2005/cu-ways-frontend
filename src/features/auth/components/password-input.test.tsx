import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { PasswordInput } from "@/features/auth/components/password-input";

afterEach(cleanup);

describe("PasswordInput", () => {
  it("hides the password until the eye is pressed", () => {
    render(<PasswordInput aria-label="Password" defaultValue="secret-value" />);
    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input).toHaveAttribute("type", "password");
  });
});
