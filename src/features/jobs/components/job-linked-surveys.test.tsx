import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { JobDraftPage } from "@/features/jobs/components/job-draft-page";
import { JobLinkedSurveys } from "@/features/jobs/components/job-linked-surveys";
import { loadJobSurveys } from "@/features/jobs/actions";
import { loadJobBriefs } from "@/features/jobs/brief-actions";
import { addJobSurveys, loadSavedJob, removeJobSurvey } from "@/features/jobs/job-actions";
import { saveJobDraft } from "@/features/jobs/job-draft";
import type { JobSurveyOption } from "@/features/jobs/types";

// Mock API data for these tests only; the live page reads persisted links.
const mockSurveyOptions: JobSurveyOption[] = [
  { id: "104", title: "Campus Mobility Study", targetResponses: 200 },
  { id: "118", title: "Green Habits 2026", targetResponses: 150 },
  { id: "99", title: "Student Dining Pulse", targetResponses: 100 },
  { id: "87", title: "Library Experience", targetResponses: 250 },
];
let mockLinkedIds: string[];
const mockSavedState = () => ({
  status: "success" as const,
  creatorId: 4,
  job: {
    job_id: 41,
    job_status: "Pending" as const,
    created_at: "2026-10-01T10:00:00Z",
    surveys: mockSurveyOptions
      .filter((survey) => mockLinkedIds.includes(survey.id))
      .map((survey) => ({ survey_id: Number(survey.id), title: survey.title })),
  },
});

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/features/jobs/actions", () => ({ loadJobSurveys: vi.fn() }));
vi.mock("@/features/jobs/brief-actions", () => ({ loadJobBriefs: vi.fn(), saveJobBrief: vi.fn() }));
vi.mock("@/features/jobs/job-actions", () => ({
  loadSavedJob: vi.fn(),
  addJobSurveys: vi.fn(),
  removeJobSurvey: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(loadJobBriefs).mockResolvedValue({ status: "success", history: [], creatorId: 4 });
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  mockLinkedIds = ["104", "118"];
  vi.mocked(loadJobSurveys).mockResolvedValue({ status: "success", surveys: mockSurveyOptions });
  vi.mocked(loadSavedJob).mockImplementation(async () => mockSavedState());
  vi.mocked(addJobSurveys).mockImplementation(async (_id, ids) => {
    mockLinkedIds = [...new Set([...mockLinkedIds, ...ids])];
    return mockSavedState();
  });
  vi.mocked(removeJobSurvey).mockImplementation(async (_id, surveyId) => {
    mockLinkedIds = mockLinkedIds.filter((id) => id !== surveyId);
    return mockSavedState();
  });
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

async function openJob(accepted = false) {
  if (accepted)
    vi.mocked(loadSavedJob).mockResolvedValueOnce({
      ...mockSavedState(),
      job: { ...mockSavedState().job, job_status: "Accepted" },
    });
  const result = render(<JobDraftPage jobId="41" />);
  await screen.findByRole("region", { name: "Manage Linked Surveys" });
  return result;
}

describe("Persisted job survey links", () => {
  it.each([false, true])(
    "loads linked surveys from the owned job, accepted preview %s",
    async (accepted) => {
      await openJob(accepted);
      const region = within(screen.getByRole("region", { name: "Manage Linked Surveys" }));
      expect(region.getAllByRole("listitem")).toHaveLength(2);
      expect(region.getByText("Campus Mobility Study")).toBeInTheDocument();
      expect(region.getByText("Green Habits 2026")).toBeInTheDocument();
      const overview = within(screen.getByRole("region", { name: "Job overview" }));
      expect(overview.getByText("Not specified", { exact: true })).toBeInTheDocument();
      expect(overview.getByText("-", { exact: true })).toBeInTheDocument();
      expect(overview.queryByText(/not provided/i)).not.toBeInTheDocument();
      expect(loadSavedJob).toHaveBeenCalledExactlyOnceWith("41");
      expect(screen.getByRole("region", { name: "Project Brief" })).toBeInTheDocument();
    },
  );

  it("uses saved links even if cached survey selections are stale", async () => {
    saveJobDraft(
      { title: "Campus campaign", description: "", budget: "8500", deadline: "2026-10-28" },
      ["87"],
      41,
      mockSurveyOptions,
      4,
    );
    await openJob();
    expect(
      screen.getByRole("button", { name: "Remove Campus Mobility Study" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove Library Experience" }),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Job overview" })).getByText("2 surveys"),
    ).toBeInTheDocument();
  });

  it("removes the relationship through the API and retains the result after reload", async () => {
    const { unmount } = await openJob();
    fireEvent.click(screen.getByRole("button", { name: "Remove Campus Mobility Study" }));
    const dialog = screen.getByRole("alertdialog", { name: "Remove this survey?" });
    expect(dialog).toHaveAccessibleDescription(
      "Campus Mobility Study will no longer be available to marketers in this job. The survey itself will not be deleted.",
    );
    fireEvent.click(within(dialog).getByRole("button", { name: "Remove" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Remove Campus Mobility Study" }),
      ).not.toBeInTheDocument(),
    );
    expect(removeJobSurvey).toHaveBeenCalledExactlyOnceWith("41", "104");
    expect(screen.getByText("Only linked survey", { exact: false })).toBeInTheDocument();
    unmount();
    await openJob();
    expect(screen.getByRole("button", { name: "Remove Green Habits 2026" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove Campus Mobility Study" }),
    ).not.toBeInTheDocument();
  });

  it.each([false, true])(
    "never calls removal for the last survey and opens selection via Add another, accepted preview %s",
    async (accepted) => {
      mockLinkedIds = ["118"];
      await openJob(accepted);
      fireEvent.click(screen.getByRole("button", { name: "Remove Green Habits 2026" }));
      let warning = screen.getByRole("alertdialog", { name: "Keep at least one survey" });
      expect(within(warning).queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
      fireEvent.click(within(warning).getByRole("button", { name: "Cancel" }));
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Remove Green Habits 2026" }));
      warning = screen.getByRole("alertdialog", { name: "Keep at least one survey" });
      fireEvent.click(within(warning).getByRole("button", { name: "Add another" }));
      const linked = await screen.findByRole("checkbox", { name: "Green Habits 2026" });
      expect(linked).toHaveAttribute("aria-disabled", "true");
      fireEvent.click(linked);
      expect(linked).not.toBeChecked();
      fireEvent.click(screen.getByRole("checkbox", { name: "Campus Mobility Study" }));
      fireEvent.click(screen.getByRole("button", { name: "Use 1 survey" }));
      await screen.findByRole("region", { name: "Manage Linked Surveys" });
      expect(addJobSurveys).toHaveBeenCalledExactlyOnceWith("41", ["118", "104"]);
      expect(screen.getByRole("status")).toHaveTextContent(
        "2 surveys are available to marketers in this job.",
      );
      expect(removeJobSurvey).not.toHaveBeenCalled();
    },
  );

  it("disables existing links, saves new choices, and prevents adding them twice", async () => {
    await openJob();
    fireEvent.click(screen.getByRole("button", { name: "Add existing surveys" }));
    const campus = await screen.findByRole("checkbox", { name: "Campus Mobility Study" });
    expect(campus).toHaveAttribute("aria-disabled", "true");
    expect(screen.getAllByText("Linked")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Use 0 surveys" })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: "Library Experience" }));
    fireEvent.click(screen.getByRole("button", { name: "Use 1 survey" }));
    await screen.findByRole("region", { name: "Manage Linked Surveys" });
    expect(addJobSurveys).toHaveBeenCalledExactlyOnceWith("41", ["104", "118", "87"]);
    expect(screen.getByRole("button", { name: "Remove Library Experience" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add existing surveys" }));
    expect(await screen.findByRole("checkbox", { name: "Library Experience" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getAllByText("Linked")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Back to job details" }));
    expect(addJobSurveys).toHaveBeenCalledTimes(1);
  });

  it("shows a dismissible notification after linking is confirmed without replaying it on later visits", async () => {
    let resolve!: (value: Awaited<ReturnType<typeof addJobSurveys>>) => void;
    vi.mocked(addJobSurveys).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const { unmount } = await openJob();
    expect(screen.queryByText("Surveys linked")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add existing surveys" }));
    fireEvent.click(await screen.findByRole("checkbox", { name: "Library Experience" }));
    fireEvent.click(screen.getByRole("button", { name: "Use 1 survey" }));
    expect(screen.queryByText("Surveys linked")).not.toBeInTheDocument();

    mockLinkedIds.push("87");
    await act(async () => resolve(mockSavedState()));
    const notification = screen.getByRole("status");
    expect(notification).toHaveTextContent("Surveys linked");
    expect(notification).toHaveTextContent("3 surveys are available to marketers in this job.");
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());

    unmount();
    await openJob();
    expect(screen.queryByText("Surveys linked")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Library Experience" })).toBeInTheDocument();
  });

  it.each(["error", "warning"])(
    "does not show a success notification for a link result with an %s",
    async (outcome) => {
      const message = "Survey changes could not be confirmed.";
      vi.mocked(addJobSurveys).mockResolvedValue(
        outcome === "error"
          ? { status: "error", message }
          : { ...mockSavedState(), notice: message },
      );
      await openJob();
      fireEvent.click(screen.getByRole("button", { name: "Add existing surveys" }));
      fireEvent.click(await screen.findByRole("checkbox", { name: "Library Experience" }));
      fireEvent.click(screen.getByRole("button", { name: "Use 1 survey" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(message);
      expect(screen.queryByText("Surveys linked")).not.toBeInTheDocument();
      expect(window.scrollTo).not.toHaveBeenCalled();
    },
  );

  it("keeps links when cancelling or dismissing a confirmation with Escape", async () => {
    await openJob();
    fireEvent.click(screen.getByRole("button", { name: "Remove Campus Mobility Study" }));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancel" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove Campus Mobility Study" }));
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape", code: "Escape" });
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(removeJobSurvey).not.toHaveBeenCalled();
  });

  it("reconciles a backend last-survey rejection instead of removing the survey optimistically", async () => {
    await openJob();
    vi.mocked(removeJobSurvey).mockResolvedValue({
      ...mockSavedState(),
      job: {
        ...mockSavedState().job,
        surveys: [{ survey_id: 104, title: "Campus Mobility Study" }],
      },
      notice: "Keep at least one survey linked to this job.",
    });
    fireEvent.click(screen.getByRole("button", { name: "Remove Campus Mobility Study" }));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Remove" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Keep at least one survey");
    expect(
      screen.getByRole("button", { name: "Remove Campus Mobility Study" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove Campus Mobility Study" }));
    expect(
      screen.getByRole("alertdialog", { name: "Keep at least one survey" }),
    ).toBeInTheDocument();
  });

  it("blocks additional changes while a link request is pending", async () => {
    let resolve!: (value: Awaited<ReturnType<typeof removeJobSurvey>>) => void;
    vi.mocked(removeJobSurvey).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    await openJob();
    fireEvent.click(screen.getByRole("button", { name: "Remove Campus Mobility Study" }));
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Remove" }),
    );
    expect(screen.getByRole("button", { name: "Add existing surveys" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remove Green Habits 2026" })).toBeDisabled();
    await act(async () => resolve(mockSavedState()));
    expect(removeJobSurvey).toHaveBeenCalledTimes(1);
  });

  it("handles ownership failures and supports a read-only reload", async () => {
    vi.mocked(loadSavedJob).mockResolvedValueOnce({
      status: "error",
      message: "You do not own this job.",
    });
    render(<JobDraftPage jobId="41" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("do not own");
    expect(screen.queryByRole("button", { name: "Add existing surveys" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reload job" }));
    await screen.findByRole("region", { name: "Manage Linked Surveys" });
    expect(addJobSurveys).not.toHaveBeenCalled();
    expect(removeJobSurvey).not.toHaveBeenCalled();
  });

  it("switches an open confirmation to the last-survey warning when links change", () => {
    const onRemove = vi.fn();
    const surveys = mockSurveyOptions.slice(0, 2);
    const { rerender } = render(
      <JobLinkedSurveys surveys={surveys} onAdd={vi.fn()} onRemove={onRemove} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Remove Green Habits 2026" }));
    rerender(<JobLinkedSurveys surveys={[surveys[1]]} onAdd={vi.fn()} onRemove={onRemove} />);
    expect(
      screen.getByRole("alertdialog", { name: "Keep at least one survey" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("alertdialog")).queryByRole("button", { name: "Remove" }),
    ).not.toBeInTheDocument();
    expect(onRemove).not.toHaveBeenCalled();
  });
});
