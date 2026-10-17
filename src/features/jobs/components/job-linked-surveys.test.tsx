import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { JobDraftPage } from "@/features/jobs/components/job-draft-page";
import { JobLinkedSurveys } from "@/features/jobs/components/job-linked-surveys";
import { readJobDraftSnapshot, saveJobDraft } from "@/features/jobs/job-draft";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

function createDraft(surveyIds = ["SV-104", "SV-118"]) {
  return String(
    saveJobDraft(
      { title: "Campus campaign", description: "", budget: "8,500 fixed", deadline: "2026-10-28" },
      surveyIds,
    ),
  );
}

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("Job linked surveys", () => {
  it.each([false, true])("shows linked survey details for accepted preview %s", (accepted) => {
    render(<JobDraftPage jobId={createDraft()} previewAccepted={accepted} />);

    const surveys = within(screen.getByRole("region", { name: "Manage Linked Surveys" }));
    expect(surveys.getAllByRole("listitem")).toHaveLength(2);
    expect(surveys.getByText("Campus Mobility Study")).toBeInTheDocument();
    expect(surveys.getByText("Green Habits 2026")).toBeInTheDocument();
    expect(surveys.queryByText("Library Experience")).not.toBeInTheDocument();
    expect(surveys.getAllByText(/^SV-\d+ · Linked/)).toHaveLength(2);
    expect(surveys.getByRole("button", { name: "Add existing surveys" })).toBeEnabled();
  });

  it("saves removals locally, updates the count, and keeps at least one survey", () => {
    const jobId = createDraft();
    const { unmount } = render(<JobDraftPage jobId={jobId} />);
    const saved = readJobDraftSnapshot(jobId);
    fireEvent.click(screen.getByRole("button", { name: "Remove Campus Mobility Study" }));
    const dialog = screen.getByRole("alertdialog", { name: "Remove this survey?" });
    expect(dialog).toHaveAccessibleDescription(
      "Campus Mobility Study will no longer be available to marketers in this job. The survey itself will not be deleted.",
    );
    expect(readJobDraftSnapshot(jobId)).toBe(saved);
    fireEvent.click(within(dialog).getByRole("button", { name: "Remove" }));

    const surveys = within(screen.getByRole("region", { name: "Manage Linked Surveys" }));
    expect(surveys.getAllByRole("listitem")).toHaveLength(1);
    expect(surveys.queryByText("Campus Mobility Study")).not.toBeInTheDocument();
    expect(surveys.getByRole("button", { name: "Remove Green Habits 2026" })).toBeEnabled();
    expect(surveys.getByText("SV-118 · Only linked survey")).toBeInTheDocument();
    const overview = within(screen.getByRole("region", { name: "Job overview" }));
    expect(overview.getByText("1 survey")).toBeInTheDocument();
    expect(overview.getByText("Campus campaign")).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    const remainingDraft = readJobDraftSnapshot(jobId);
    fireEvent.click(surveys.getByRole("button", { name: "Remove Green Habits 2026" }));
    const warning = screen.getByRole("alertdialog", { name: "Keep at least one survey" });
    expect(within(warning).queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
    expect(readJobDraftSnapshot(jobId)).toBe(remainingDraft);
    fireEvent.click(within(warning).getByRole("button", { name: "Cancel" }));

    unmount();
    render(<JobDraftPage jobId={jobId} />);
    expect(screen.getByRole("button", { name: "Remove Green Habits 2026" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Remove Campus Mobility Study" })).toBeNull();
  });

  it.each([false, true])(
    "opens survey selection from the last-survey warning without unlinking it, accepted preview %s",
    (accepted) => {
      const jobId = createDraft(["SV-118"]);
      const saved = readJobDraftSnapshot(jobId);
      render(<JobDraftPage jobId={jobId} previewAccepted={accepted} />);
      fireEvent.click(screen.getByRole("button", { name: "Remove Green Habits 2026" }));

      const warning = screen.getByRole("alertdialog", { name: "Keep at least one survey" });
      expect(warning).toHaveAccessibleDescription(
        "This is the last linked survey. Every job must have at least one survey, so it cannot be removed until another survey is linked.",
      );
      expect(within(warning).queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
      fireEvent.click(within(warning).getByRole("button", { name: "Add another" }));

      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Select surveys" })).toBeInTheDocument();
      expect(screen.getByRole("checkbox", { name: "Green Habits 2026" })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      expect(screen.getByRole("checkbox", { name: "Green Habits 2026" })).not.toBeChecked();
      expect(readJobDraftSnapshot(jobId)).toBe(saved);
      fireEvent.click(screen.getByRole("checkbox", { name: "Green Habits 2026" }));
      expect(screen.getByRole("button", { name: "Use 0 surveys" })).toBeDisabled();
      fireEvent.click(screen.getByRole("button", { name: "Use 0 surveys" }));
      expect(readJobDraftSnapshot(jobId)).toBe(saved);
      fireEvent.click(screen.getByRole("button", { name: "Back to job details" }));

      fireEvent.click(screen.getByRole("button", { name: "Remove Green Habits 2026" }));
      fireEvent.click(screen.getByRole("button", { name: "Add another" }));
      expect(screen.getByRole("checkbox", { name: "Green Habits 2026" })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      expect(screen.getByRole("checkbox", { name: "Green Habits 2026" })).not.toBeChecked();
      fireEvent.click(screen.getByRole("checkbox", { name: "Campus Mobility Study" }));
      fireEvent.click(screen.getByRole("button", { name: "Use 1 survey" }));
      const surveys = within(screen.getByRole("region", { name: "Manage Linked Surveys" }));
      expect(surveys.getAllByRole("listitem")).toHaveLength(2);
      expect(surveys.getByText("Green Habits 2026")).toBeInTheDocument();
      expect(surveys.getByText("Campus Mobility Study")).toBeInTheDocument();
    },
  );

  it("switches an open removal confirmation to the warning if only one survey remains", () => {
    const onRemove = vi.fn();
    const onAdd = vi.fn();
    const surveys = [
      { id: "SV-104", title: "Campus Mobility Study" },
      { id: "SV-118", title: "Green Habits 2026" },
    ];
    const { rerender } = render(
      <JobLinkedSurveys surveys={surveys} onAdd={onAdd} onRemove={onRemove} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove Green Habits 2026" }));
    expect(screen.getByRole("alertdialog", { name: "Remove this survey?" })).toBeInTheDocument();

    rerender(<JobLinkedSurveys surveys={[surveys[1]]} onAdd={onAdd} onRemove={onRemove} />);
    const warning = screen.getByRole("alertdialog", { name: "Keep at least one survey" });
    expect(within(warning).queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
    fireEvent.click(within(warning).getByRole("button", { name: "Cancel" }));
    expect(onRemove).not.toHaveBeenCalled();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("keeps the surveys when cancelling or dismissing the confirmation with Escape", async () => {
    const jobId = createDraft();
    const saved = readJobDraftSnapshot(jobId);
    render(<JobDraftPage jobId={jobId} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove Campus Mobility Study" }));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancel" }),
    );

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(readJobDraftSnapshot(jobId)).toBe(saved);
    fireEvent.click(screen.getByRole("button", { name: "Remove Green Habits 2026" }));
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveTextContent("Green Habits 2026 will no longer be available");
    fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(readJobDraftSnapshot(jobId)).toBe(saved);
    expect(screen.getByRole("button", { name: "Remove Green Habits 2026" })).toBeEnabled();
  });

  it("marks existing surveys as linked and saves only additional choices without duplicates", () => {
    const jobId = createDraft();
    render(<JobDraftPage jobId={jobId} />);
    fireEvent.click(screen.getByRole("button", { name: "Add existing surveys" }));

    const campus = screen.getByRole("checkbox", { name: "Campus Mobility Study" });
    const green = screen.getByRole("checkbox", { name: "Green Habits 2026" });
    expect(campus).toHaveAttribute("aria-disabled", "true");
    expect(campus).not.toBeChecked();
    expect(campus).toHaveAccessibleDescription("SV-104 · Already linked");
    expect(green).toHaveAttribute("aria-disabled", "true");
    expect(green).not.toBeChecked();
    expect(green).toHaveAccessibleDescription("SV-118 · Already linked");
    expect(screen.getAllByText("Linked")).toHaveLength(2);
    expect(screen.getByText("2 available")).toBeInTheDocument();
    expect(screen.getByText("0 selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Use 0 surveys" })).toBeDisabled();
    fireEvent.click(campus);
    expect(campus).not.toBeChecked();
    expect(screen.getByText("0 selected")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Library Experience" })).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "Library Experience" }));
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back to job details" }));
    expect(screen.queryByRole("button", { name: "Remove Library Experience" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Add existing surveys" }));
    expect(screen.getByRole("checkbox", { name: "Library Experience" })).not.toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "Library Experience" }));
    fireEvent.click(screen.getByRole("button", { name: "Use 1 survey" }));
    expect(screen.getByRole("button", { name: "Remove Library Experience" })).toBeInTheDocument();
    const overview = within(screen.getByRole("region", { name: "Job overview" }));
    expect(overview.getByText("3 surveys")).toBeInTheDocument();
    expect(JSON.parse(readJobDraftSnapshot(jobId)!).selectedSurveyIds).toEqual([
      "SV-104",
      "SV-118",
      "SV-087",
    ]);
    fireEvent.click(screen.getByRole("button", { name: "Add existing surveys" }));
    expect(screen.getByRole("checkbox", { name: "Library Experience" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("checkbox", { name: "Library Experience" })).not.toBeChecked();
    expect(screen.getAllByText("Linked")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Use 0 surveys" })).toBeDisabled();
  });

  it("keeps the linked surveys and shows feedback if browser storage fails", () => {
    const jobId = createDraft();
    const saved = readJobDraftSnapshot(jobId);
    render(<JobDraftPage jobId={jobId} />);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });

    fireEvent.click(screen.getByRole("button", { name: "Remove Campus Mobility Study" }));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Remove" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Your survey changes could not be saved");
    expect(screen.getByRole("button", { name: "Remove Campus Mobility Study" })).toBeEnabled();
    expect(readJobDraftSnapshot(jobId)).toBe(saved);
  });
});
