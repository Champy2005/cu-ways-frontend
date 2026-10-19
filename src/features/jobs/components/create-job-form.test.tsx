import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { StrictMode, useEffect, useState } from "react";

import { CreateJobForm } from "@/features/jobs/components/create-job-form";
import { JobDraftPage } from "@/features/jobs/components/job-draft-page";
import { saveJobDraft } from "@/features/jobs/job-draft";
import { loadJobSurveys } from "@/features/jobs/actions";
import {
  createPendingJob,
  loadSavedJob,
  saveJobSurveySelection,
} from "@/features/jobs/job-actions";
import type { JobSurveyOption } from "@/features/jobs/types";

// Mock data for these tests only; the live selector loads surveys from the API.
const mockSurveyOptions: JobSurveyOption[] = [
  { id: "104", title: "Campus Mobility Study", targetResponses: 200 },
  { id: "118", title: "Green Habits 2026", targetResponses: 150 },
  { id: "99", title: "Student Dining Pulse", targetResponses: 100 },
  { id: "87", title: "Library Experience", targetResponses: 250 },
];

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/features/jobs/actions", () => ({ loadJobSurveys: vi.fn() }));
vi.mock("@/features/jobs/brief-actions", () => ({
  loadJobBriefs: vi.fn(async () => ({ status: "success", history: [], creatorId: 4 })),
  saveJobBrief: vi.fn(),
}));
vi.mock("@/features/jobs/job-actions", () => ({
  createPendingJob: vi.fn(),
  loadSavedJob: vi.fn(),
  saveJobSurveySelection: vi.fn(),
}));

let mockSavedIds: string[];
const mockSavedState = () => ({
  status: "success" as const,
  creatorId: 4,
  job: {
    job_id: 41,
    job_status: "Pending" as const,
    created_at: "2026-10-01T10:00:00Z",
    surveys: mockSurveyOptions
      .filter((survey) => mockSavedIds.includes(survey.id))
      .map((survey) => ({ survey_id: Number(survey.id), title: survey.title })),
  },
});

beforeEach(() => {
  mockSavedIds = ["104", "118"];
  vi.mocked(createPendingJob)
    .mockReset()
    .mockImplementation(async (ids) => {
      mockSavedIds = ids;
      return { status: "success", jobId: 41, creatorId: 4 };
    });
  vi.mocked(loadSavedJob)
    .mockReset()
    .mockImplementation(async () => mockSavedState());
  vi.mocked(saveJobSurveySelection)
    .mockReset()
    .mockImplementation(async (_id, ids) => {
      mockSavedIds = ids;
      return mockSavedState();
    });
  vi.mocked(loadJobSurveys).mockReset();
  vi.mocked(loadJobSurveys).mockResolvedValue({ status: "success", surveys: mockSurveyOptions });
});

function CreateJobFlow() {
  const [path, setPath] = useState("/creator/jobs/create");
  useEffect(() => {
    router.push.mockImplementation(setPath);
  }, []);
  const url = new URL(path, "http://localhost");
  const editId = url.searchParams.get("edit");
  if (editId) return <JobDraftPage jobId={editId} edit />;
  if (url.pathname === "/creator/jobs/create") return <CreateJobForm />;
  return <JobDraftPage jobId={url.pathname.split("/").at(-1)!} />;
}

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  router.push.mockReset();
  vi.restoreAllMocks();
});

async function openSurveySelector() {
  fireEvent.click(screen.getByRole("button", { name: "Edit selected surveys" }));
  await screen.findByRole("checkbox", { name: "Campus Mobility Study" });
}

async function completeJobForm() {
  fireEvent.change(screen.getByRole("textbox", { name: "Job title" }), {
    target: { value: "Campus campaign" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Budget / compensation" }), {
    target: { value: "8,500 fixed" },
  });
  fireEvent.change(document.getElementById("job-deadline")!, { target: { value: "2026-10-28" } });
  await openSurveySelector();
  fireEvent.click(screen.getByRole("checkbox", { name: "Campus Mobility Study" }));
  fireEvent.click(screen.getByRole("button", { name: "Use 1 survey" }));
}

describe("CreateJobForm survey selection", () => {
  it("starts empty, follows checkbox changes, and saves only the chosen surveys", async () => {
    render(<CreateJobFlow />);
    fireEvent.change(screen.getByRole("textbox", { name: "Job title" }), {
      target: { value: "My draft job" },
    });
    expect(screen.getByText("0 surveys selected")).toBeInTheDocument();

    await openSurveySelector();
    expect(screen.getAllByRole("checkbox")).toHaveLength(4);
    for (const checkbox of screen.getAllByRole("checkbox")) {
      expect(checkbox).not.toBeChecked();
    }
    expect(screen.getByText("0 selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Use 0 surveys" })).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox", { name: "Campus Mobility Study" }));
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Use 1 survey" })).toBeEnabled();
    fireEvent.click(screen.getByRole("checkbox", { name: "Library Experience" }));
    expect(screen.getByText("2 selected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Campus Mobility Study" }));
    expect(screen.getByText("1 selected")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Use 1 survey" }));
    expect(screen.getByText("1 survey selected")).toBeInTheDocument();
    expect(screen.getByText("Library Experience")).toBeInTheDocument();
    expect(screen.queryByText("Campus Mobility Study")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Job title" })).toHaveValue("My draft job");
  });

  it("restores saved checks for editing and discards changes when going back", async () => {
    render(<CreateJobFlow />);
    await openSurveySelector();
    fireEvent.click(screen.getByRole("checkbox", { name: "Campus Mobility Study" }));
    fireEvent.click(screen.getByRole("button", { name: "Back to create job" }));
    expect(screen.getByText("0 surveys selected")).toBeInTheDocument();

    await openSurveySelector();
    expect(screen.getByRole("checkbox", { name: "Campus Mobility Study" })).not.toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "Campus Mobility Study" }));
    fireEvent.click(screen.getByRole("button", { name: "Use 1 survey" }));

    await openSurveySelector();
    expect(screen.getByRole("checkbox", { name: "Campus Mobility Study" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Green Habits 2026" })).not.toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "Campus Mobility Study" }));
    expect(screen.getByRole("button", { name: "Use 0 surveys" })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: "Green Habits 2026" }));
    fireEvent.click(screen.getByRole("button", { name: "Use 1 survey" }));
    expect(screen.getByText("Green Habits 2026")).toBeInTheDocument();
    expect(screen.queryByText("Campus Mobility Study")).not.toBeInTheDocument();

    await openSurveySelector();
    expect(screen.getByRole("checkbox", { name: "Green Habits 2026" })).toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "Library Experience" }));
    fireEvent.click(screen.getByRole("button", { name: "Back to create job" }));
    expect(screen.getByText("1 survey selected")).toBeInTheDocument();
    expect(screen.getByText("Green Habits 2026")).toBeInTheDocument();

    await openSurveySelector();
    expect(screen.getByRole("checkbox", { name: "Green Habits 2026" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Library Experience" })).not.toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "Library Experience" }));
    fireEvent.click(screen.getByRole("button", { name: "Use 2 surveys" }));
    expect(screen.getByText("2 surveys selected")).toBeInTheDocument();
    expect(screen.getByText("Green Habits 2026, Library Experience")).toBeInTheDocument();
  });
});

const requiredErrors = {
  title: "Job title is required.",
  budget: "Budget or compensation is required.",
  deadline: "Deadline is required.",
  surveys: "Survey selection is required.",
};

describe("CreateJobForm validation", () => {
  it("shows missing-field errors without requiring or clearing the description", async () => {
    render(<CreateJobFlow />);
    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "Recruit students for a campus campaign." },
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Create Job" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Job could not be created");
    for (const message of Object.values(requiredErrors)) {
      expect(screen.getByText(message)).toBeInTheDocument();
    }
    for (const id of ["job-title", "job-budget", "job-deadline"]) {
      expect(document.getElementById(id)).toHaveAttribute("aria-invalid", "true");
      expect(document.getElementById(id)).toHaveAttribute("aria-describedby", `${id}-error`);
    }
    expect(screen.getByRole("group", { name: "Selected surveys" })).toHaveAttribute(
      "aria-describedby",
      "job-surveys-error",
    );
    expect(screen.getByRole("textbox", { name: "Description" })).not.toHaveAttribute("required");
    expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue(
      "Recruit students for a campus campaign.",
    );
    expect(screen.getByRole("button", { name: "Create Job" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss validation alert" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText(requiredErrors.title)).toBeInTheDocument();
  });

  it.each(["title", "budget", "deadline", "surveys"] as const)(
    "highlights only the missing %s field and preserves other values",
    async (missingField) => {
      render(<CreateJobFlow />);
      const values = {
        title: "Campus Sustainability Campaign",
        budget: "8,500 fixed",
        deadline: "2026-10-28",
      };
      for (const field of ["title", "budget", "deadline"] as const) {
        if (field !== missingField) {
          fireEvent.change(document.getElementById(`job-${field}`)!, {
            target: { value: values[field] },
          });
        }
      }
      if (missingField !== "surveys") {
        await openSurveySelector();
        fireEvent.click(screen.getByRole("checkbox", { name: "Campus Mobility Study" }));
        fireEvent.click(screen.getByRole("button", { name: "Use 1 survey" }));
      }

      fireEvent.click(screen.getByRole("button", { name: "Create Job" }));

      for (const field of ["title", "budget", "deadline", "surveys"] as const) {
        if (field === missingField) {
          expect(screen.getByText(requiredErrors[field])).toBeInTheDocument();
        } else {
          expect(screen.queryByText(requiredErrors[field])).not.toBeInTheDocument();
        }
      }
      expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue("");
      for (const field of ["title", "budget", "deadline"] as const) {
        if (field !== missingField) {
          expect(document.getElementById(`job-${field}`)).toHaveValue(values[field]);
          expect(document.getElementById(`job-${field}`)).toHaveAttribute("aria-invalid", "false");
        }
      }
    },
  );

  it("clears only corrected errors and enables retry when all required fields are complete", async () => {
    render(<CreateJobFlow />);
    fireEvent.click(screen.getByRole("button", { name: "Create Job" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Job title" }), {
      target: { value: "   " },
    });
    expect(screen.getByText(requiredErrors.title)).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Job title" }), {
      target: { value: "Campus campaign" },
    });
    expect(screen.queryByText(requiredErrors.title)).not.toBeInTheDocument();
    expect(screen.getByText(requiredErrors.budget)).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Budget / compensation" }), {
      target: { value: "   " },
    });
    expect(screen.getByText(requiredErrors.budget)).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Budget / compensation" }), {
      target: { value: "8,500 fixed" },
    });
    fireEvent.change(document.getElementById("job-deadline")!, {
      target: { value: "2026-10-28" },
    });
    expect(screen.getByText(requiredErrors.surveys)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Job" })).toBeDisabled();

    await openSurveySelector();
    fireEvent.click(screen.getByRole("checkbox", { name: "Campus Mobility Study" }));
    fireEvent.click(screen.getByRole("button", { name: "Use 1 survey" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Job" })).toBeEnabled();
    expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue("");
    fireEvent.submit(screen.getByRole("form", { name: "Create Job" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Job details" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(await screen.findByRole("textbox", { name: "Job title" })).toHaveValue(
      "Campus campaign",
    );
  });
});

describe("CreateJobForm confirmation", () => {
  it("does not show a creation notification when opening an existing job", async () => {
    render(<JobDraftPage jobId="41" />);

    await screen.findByRole("region", { name: "Job overview" });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Dismiss job created notification" }),
    ).not.toBeInTheDocument();
  });

  it("shows the creation notification only on the first details visit, including in Strict Mode", async () => {
    const { unmount } = render(
      <StrictMode>
        <CreateJobFlow />
      </StrictMode>,
    );
    await completeJobForm();
    fireEvent.click(screen.getByRole("button", { name: "Create Job" }));

    await screen.findByRole("region", { name: "Job overview" });
    expect(screen.getByRole("status")).toHaveTextContent("Your job has been created");

    // Returning to the job must not replay the confirmation, even without dismissing it.
    unmount();
    render(<JobDraftPage jobId="41" />);
    await screen.findByRole("region", { name: "Job overview" });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("blocks duplicate submissions while creation is pending", async () => {
    let resolve!: (value: Awaited<ReturnType<typeof createPendingJob>>) => void;
    vi.mocked(createPendingJob).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    render(<CreateJobFlow />);
    await completeJobForm();
    const form = screen.getByRole("form", { name: "Create Job" });
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(createPendingJob).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    await act(async () => resolve({ status: "success", jobId: 41, creatorId: 4 }));
    await screen.findByRole("heading", { name: "Job details" });
  });

  it("preserves values after a definite creation failure and allows a manual retry", async () => {
    vi.mocked(createPendingJob).mockResolvedValueOnce({
      status: "error",
      message: "You do not own a selected survey.",
    });
    render(<CreateJobFlow />);
    await completeJobForm();
    fireEvent.click(screen.getByRole("button", { name: "Create Job" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("do not own");
    expect(screen.getByRole("textbox", { name: "Job title" })).toHaveValue("Campus campaign");
    expect(screen.getByText("1 survey selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
    expect(router.push).not.toHaveBeenCalled();
    expect(sessionStorage.length).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: "Create Job" }));
    expect(await screen.findByRole("heading", { name: "Job details" })).toBeInTheDocument();
    expect(createPendingJob).toHaveBeenCalledTimes(2);
    expect(router.push).toHaveBeenLastCalledWith("/creator/jobs/41");
    const overview = within(screen.getByRole("region", { name: "Job overview" }));
    expect(overview.getByText("Campus campaign")).toBeInTheDocument();
    expect(createPendingJob).toHaveBeenNthCalledWith(2, ["104"]);
  });

  it("opens the persisted job even when optional form metadata cannot be cached", async () => {
    render(<CreateJobFlow />);
    await completeJobForm();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Job" }));
    await screen.findByRole("heading", { name: "Job details" });
    expect(router.push).toHaveBeenLastCalledWith("/creator/jobs/41");
    expect(screen.getByRole("heading", { name: "Job #41" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Your job has been created");
    expect(createPendingJob).toHaveBeenCalledTimes(1);
  });

  it("blocks another creation when the server response is uncertain", async () => {
    vi.mocked(createPendingJob).mockResolvedValue({
      status: "reconcile",
      message: "Check your jobs before creating another job.",
    });
    render(<CreateJobFlow />);
    await completeJobForm();
    fireEvent.submit(screen.getByRole("form", { name: "Create Job" }));
    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: "Create Job" })).toBeDisabled();
    fireEvent.submit(screen.getByRole("form", { name: "Create Job" }));
    expect(createPendingJob).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "Check your jobs" })).toHaveAttribute(
      "href",
      "/creator/jobs/invite",
    );
    await waitFor(() => expect(router.push).not.toHaveBeenCalled());
  });

  it("shows submitted details with Pending tracking and lets the user edit them", async () => {
    const { unmount } = render(<CreateJobFlow />);
    fireEvent.change(screen.getByRole("textbox", { name: "Job title" }), {
      target: { value: "Campus Sustainability Campaign" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Description" }), {
      target: { value: "Recruit students for our campaign." },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Budget / compensation" }), {
      target: { value: "฿8,500 fixed" },
    });
    fireEvent.change(document.getElementById("job-deadline")!, {
      target: { value: "2026-10-28" },
    });
    await openSurveySelector();
    fireEvent.click(screen.getByRole("checkbox", { name: "Campus Mobility Study" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Green Habits 2026" }));
    fireEvent.click(screen.getByRole("button", { name: "Use 2 surveys" }));
    fireEvent.click(screen.getByRole("button", { name: "Create Job" }));

    expect(await screen.findByRole("heading", { name: "Job details" })).toBeInTheDocument();
    expect(createPendingJob).toHaveBeenCalledExactlyOnceWith(["104", "118"]);
    expect(router.push).toHaveBeenLastCalledWith("/creator/jobs/41");
    const jobPath = router.push.mock.lastCall![0] as string;
    expect(screen.queryByRole("form", { name: "Create Job" })).not.toBeInTheDocument();
    const overview = within(screen.getByRole("region", { name: "Job overview" }));
    expect(overview.getByText("Campus Sustainability Campaign")).toBeInTheDocument();
    expect(overview.getByText("฿8,500 fixed")).toBeInTheDocument();
    expect(overview.getByText("28 Oct 2026")).toBeInTheDocument();
    expect(overview.getByText("2 surveys")).toBeInTheDocument();
    expect(overview.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Your job has been created with Pending status.",
    );
    const tracking = within(screen.getByRole("region", { name: "Status tracking" }));
    expect(tracking.getByText("Job details and 2 surveys saved")).toBeInTheDocument();
    expect(tracking.getByText("Awaiting offers").closest("li")).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(tracking.getByText("Offer accepted")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View Job" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Dismiss job created notification" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(await screen.findByRole("textbox", { name: "Job title" })).toHaveValue(
      "Campus Sustainability Campaign",
    );
    expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue(
      "Recruit students for our campaign.",
    );
    expect(screen.getByRole("textbox", { name: "Budget / compensation" })).toHaveValue(
      "฿8,500 fixed",
    );
    expect(document.getElementById("job-deadline")).toHaveValue("2026-10-28");
    fireEvent.change(screen.getByRole("textbox", { name: "Job title" }), {
      target: { value: "Updated campaign" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Budget / compensation" }), {
      target: { value: "฿12,000 fixed" },
    });
    fireEvent.change(document.getElementById("job-deadline")!, {
      target: { value: "2026-11-10" },
    });
    await openSurveySelector();
    expect(screen.getByRole("checkbox", { name: "Campus Mobility Study" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Green Habits 2026" })).toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "Campus Mobility Study" }));
    fireEvent.click(screen.getByRole("button", { name: "Use 1 survey" }));
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    const updatedOverview = within(await screen.findByRole("region", { name: "Job overview" }));
    expect(updatedOverview.getByText("Updated campaign")).toBeInTheDocument();
    expect(updatedOverview.getByText("฿12,000 fixed")).toBeInTheDocument();
    expect(updatedOverview.getByText("10 Nov 2026")).toBeInTheDocument();
    expect(updatedOverview.getByText("1 survey")).toBeInTheDocument();
    expect(updatedOverview.getByText("Pending")).toBeInTheDocument();
    expect(router.push).toHaveBeenLastCalledWith(jobPath);
    expect(createPendingJob).toHaveBeenCalledTimes(1);
    expect(saveJobSurveySelection).toHaveBeenCalledExactlyOnceWith("41", ["118"]);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    // Reloading the destination reads the same tab-local draft, without the form mounted.
    unmount();
    render(<JobDraftPage jobId={jobPath.split("/").at(-1)!} />);
    expect(await screen.findByRole("heading", { name: "Updated campaign" })).toBeInTheDocument();
    expect(screen.getByText("฿12,000 fixed")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("offers a return to the form for an unavailable or malformed draft", async () => {
    vi.mocked(loadSavedJob).mockResolvedValueOnce({
      status: "error",
      message: "This job is not available.",
    });
    render(<JobDraftPage jobId="999" />);

    expect(await screen.findByRole("heading", { name: "Job not available" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create a job" })).toHaveAttribute(
      "href",
      "/creator/jobs/create",
    );
    expect(screen.queryByRole("heading", { name: "Job details" })).not.toBeInTheDocument();
  });

  it("previews the accepted offer UI without changing the saved Pending job", async () => {
    const jobId = saveJobDraft(
      {
        title: "Campus Sustainability Campaign",
        description: "Recruit students for our campaign.",
        budget: "฿8,500 fixed",
        deadline: "2026-10-28",
      },
      ["104", "118"],
      41,
      mockSurveyOptions,
      4,
    );
    const savedDraft = sessionStorage.getItem(`cuways-job-form:4:${jobId}`);
    const { rerender } = render(<JobDraftPage jobId={String(jobId)} previewAccepted />);

    expect(await screen.findByRole("heading", { name: "Job details" })).toBeInTheDocument();
    expect(screen.getByText("Offer accepted for this job")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "The offer was accepted. Work can start with this marketer.",
    );
    const overview = within(screen.getByRole("region", { name: "Job overview" }));
    expect(overview.getByText("Campus Sustainability Campaign")).toBeInTheDocument();
    expect(overview.getByText("฿8,500 fixed")).toBeInTheDocument();
    expect(overview.getByText("28 Oct 2026")).toBeInTheDocument();
    expect(overview.getByText("2 surveys")).toBeInTheDocument();
    expect(overview.getByText("Accepted")).toBeInTheDocument();
    const tracking = within(screen.getByRole("region", { name: "Status tracking" }));
    expect(tracking.getAllByRole("listitem")).toHaveLength(3);
    expect(tracking.getByText("All required details completed")).toBeInTheDocument();
    expect(
      tracking.getByText("A marketer has been selected. Work can start next."),
    ).toBeInTheDocument();
    expect(tracking.getByText("Offer accepted").closest("li")).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(tracking.getByText("In Progress").closest("li")).not.toHaveAttribute("aria-current");
    expect(tracking.getByText("Work has not started yet")).toBeInTheDocument();
    expect(tracking.queryByText("Awaiting offers")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View Job" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Dismiss offer accepted notification" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(sessionStorage.getItem(`cuways-job-form:4:${jobId}`)).toBe(savedDraft);

    rerender(<JobDraftPage jobId={String(jobId)} />);
    expect(screen.getByRole("heading", { name: "Job details" })).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Share" })).not.toBeInTheDocument();
  });
});
