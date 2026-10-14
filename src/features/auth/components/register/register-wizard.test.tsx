import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { RegisterWizard } from "@/features/auth/components/register/register-wizard";
import { ApiError } from "@/lib/api/errors";

const push = vi.fn();
const refresh = vi.fn();
const register = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("@/features/auth/api", () => ({ register: (input: unknown) => register(input) }));

function type(label: string | RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function next() {
  fireEvent.click(screen.getByRole("button", { name: /^(Next|Confirm)$/ }));
}

function fillAccount(role: "Creator" | "Marketer" | "I’m not sure", email = "jane@example.com") {
  type("First name *", "Jane");
  type("Last name *", "Doe");
  type("Email *", email);
  type("Password *", "strong-password");
  type("Password confirmation *", "strong-password");
  fireEvent.click(screen.getByRole("radio", { name: role }));
  fireEvent.click(screen.getByRole("checkbox", { name: "Accept Terms of Service" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "Accept Privacy Policy" }));
}

beforeEach(() => {
  register.mockResolvedValue({ user: { user_id: 1 } });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("RegisterWizard", () => {
  it("signs a creator up after step 2 and opens the creator workspace", async () => {
    render(<RegisterWizard />);
    fillAccount("Creator");
    next();
    type("Phone Number", "081-234-5678");
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
    next();

    expect(await screen.findByRole("status")).toHaveTextContent("You are all set up.");
    expect(register).toHaveBeenCalledWith({
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "0812345678",
      password: "strong-password",
      line_id: null,
    });
    fireEvent.click(screen.getByRole("button", { name: "Let’s start" }));
    expect(push).toHaveBeenCalledWith("/creator/dashboard");
  });

  it("takes a marketer through the experience step and sends the profile", async () => {
    render(<RegisterWizard />);
    fillAccount("Marketer");
    next();
    type("Phone Number", "0812345678");
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    next();

    expect(
      screen.getByRole("heading", { name: "Talk about your experience." }),
    ).toBeInTheDocument();
    type("Bio", "Survey recruiter");
    type("Year of experience", "3");
    type("Availability Text", "Weekends");
    next();

    await screen.findByRole("status");
    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({
        marketer_profile: {
          bio: "Survey recruiter",
          availability_text: "Weekends",
          experience_years: 3,
        },
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Let’s start" }));
    expect(push).toHaveBeenCalledWith("/marketer/dashboard");
  });

  it("registers “I’m not sure” as a creator", async () => {
    render(<RegisterWizard />);
    fillAccount("I’m not sure");
    next();
    type("Phone Number", "0812345678");
    next();

    await screen.findByRole("status");
    expect(register.mock.calls[0][0]).not.toHaveProperty("marketer_profile");
  });

  it("stays on step 1 and greys out Next while passwords don’t match", () => {
    render(<RegisterWizard />);
    fillAccount("Creator");
    type("Password confirmation *", "different-password");
    next();

    expect(screen.getByText("Passwords don’t match.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.queryByLabelText("Phone Number")).not.toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it("returns to step 1 with the design’s error when the email is taken", async () => {
    register.mockRejectedValue(new ApiError(409, "email_already_exists", "email already exists"));
    render(<RegisterWizard />);
    fillAccount("Creator");
    next();
    type("Phone Number", "0812345678");
    next();

    expect(await screen.findByText("This email is already registered.")).toBeInTheDocument();
    expect(screen.getByText("Couldn’t create your account.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email *")).toHaveAttribute("aria-invalid", "true");

    type("Email *", "jane2@example.com");
    await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toBeEnabled());
    expect(screen.queryByText("Couldn’t create your account.")).not.toBeInTheDocument();
  });

  it("keeps the phone error on step 2 when the phone is taken", async () => {
    register.mockRejectedValue(new ApiError(409, "phone_already_exists", "phone already exists"));
    render(<RegisterWizard />);
    fillAccount("Creator");
    next();
    type("Phone Number", "0812345678");
    next();

    expect(await screen.findByText("This phone number is already registered.")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone Number")).toBeInTheDocument();
  });

  it("keeps entered values when going back", () => {
    render(<RegisterWizard />);
    fillAccount("Creator");
    next();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(screen.getByLabelText("First name *")).toHaveValue("Jane");
    expect(screen.getByRole("radio", { name: "Creator" })).toHaveAttribute("aria-checked", "true");
  });
});
