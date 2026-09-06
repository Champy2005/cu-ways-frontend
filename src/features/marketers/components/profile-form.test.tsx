import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProfileForm } from "@/features/marketers/components/profile-form";
import type { MarketerProfile } from "@/features/marketers/types";
import { ApiError } from "@/lib/api/errors";

const profile: MarketerProfile = {
  user_id: 5,
  name: "Nila Example",
  bio: "Campus survey outreach",
  experience_years: 2,
  availability_text: "Weekday afternoons",
};

afterEach(cleanup);

describe("ProfileForm", () => {
  it("uses the existing basic information editor and displays unspecified optional fields", () => {
    render(
      <ProfileForm
        profile={{ ...profile, bio: null, experience_years: null, availability_text: null }}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByRole("link", { name: "Basic information" })).toHaveAttribute(
      "href",
      "/profile",
    );
    expect(screen.getAllByPlaceholderText("Not specified")).toHaveLength(3);
    expect(screen.getByLabelText("Years of experience")).toHaveValue("");
  });

  it("saves optional fields with fractional years and reflects the saved profile", async () => {
    const saved = {
      ...profile,
      bio: "A short bio",
      experience_years: 0.5,
      availability_text: null,
    };
    const onSave = vi.fn().mockResolvedValue(saved);
    const onProfileChange = vi.fn();
    render(<ProfileForm profile={profile} onSave={onSave} onProfileChange={onProfileChange} />);

    fireEvent.change(screen.getByLabelText("Bio"), { target: { value: "  A short bio  " } });
    fireEvent.change(screen.getByLabelText("Years of experience"), { target: { value: "0.5" } });
    fireEvent.change(screen.getByLabelText("Availability text"), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm changes" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Professional information saved."),
    );
    expect(onSave).toHaveBeenCalledWith({
      bio: "A short bio",
      experience_years: 0.5,
      availability_text: null,
    });
    expect(onProfileChange).toHaveBeenCalledWith(saved);
    expect(screen.getByLabelText("Bio")).toHaveValue("A short bio");
    expect(screen.getByLabelText("Availability text")).toHaveValue("");
  });

  it("keeps invalid input in place and attaches the validation message to the field", () => {
    const onSave = vi.fn();
    render(<ProfileForm profile={profile} onSave={onSave} />);
    const experience = screen.getByLabelText("Years of experience");
    fireEvent.change(experience, { target: { value: "-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm changes" }));

    expect(onSave).not.toHaveBeenCalled();
    expect(experience).toHaveValue("-1");
    expect(experience).toHaveAttribute("aria-invalid", "true");
    expect(experience).toHaveAccessibleDescription(/zero or greater/);
  });

  it("preserves edits after backend rejection, shows field feedback, and permits retry", async () => {
    const onSave = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError(422, "validation_error", "Please review your profile.", {
          bio: "Please shorten your bio.",
        }),
      )
      .mockResolvedValueOnce({ ...profile, bio: "Updated biography" });
    render(<ProfileForm profile={profile} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText("Bio"), { target: { value: "Updated biography" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm changes" }));

    await screen.findByText("Please shorten your bio.");
    expect(screen.getByLabelText("Bio")).toHaveValue("Updated biography");
    expect(screen.getByLabelText("Bio")).toHaveAccessibleDescription("Please shorten your bio.");
    expect(screen.getByText(/Your changes are still here/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm changes" }));
    await screen.findByText("Professional information saved.");
    expect(onSave).toHaveBeenCalledTimes(2);
  });

  it("prevents repeated submissions while a save is in flight", async () => {
    let finishSave!: (value: MarketerProfile) => void;
    const onSave = vi.fn(
      () =>
        new Promise<MarketerProfile>((resolve) => {
          finishSave = resolve;
        }),
    );
    render(<ProfileForm profile={profile} onSave={onSave} />);
    const button = screen.getByRole("button", { name: "Confirm changes" });
    fireEvent.click(button);
    expect(screen.getByRole("button", { name: "Saving changes…" })).toBeDisabled();
    expect(screen.getByLabelText("Bio")).toBeDisabled();
    const form = button.closest("form");
    if (!form) throw new Error("The save button must be part of the profile form.");
    fireEvent.submit(form);
    expect(onSave).toHaveBeenCalledTimes(1);
    await act(async () => finishSave(profile));
    expect(screen.getByRole("button", { name: "Confirm changes" })).toBeEnabled();
  });
});
