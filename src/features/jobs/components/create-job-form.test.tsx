import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { useEffect, useState } from "react";

import { CreateJobForm } from "@/features/jobs/components/create-job-form";
import { JobDraftPage } from "@/features/jobs/components/job-draft-page";
import { saveJobDraft } from "@/features/jobs/job-draft";

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

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

function openSurveySelector() {
  fireEvent.click(screen.getByRole("button", { name: "Edit selected surveys" }));
}

describe("CreateJobForm survey selection", () => {
  it("starts empty, follows checkbox changes, and saves only the chosen surveys", () => {
    render(<CreateJobFlow />);
    fireEvent.change(screen.getByRole("textbox", { name: "Job title" }), {
      target: { value: "My draft job" },
    });
    expect(screen.getByText("0 surveys selected")).toBeInTheDocument();

    openSurveySelector();
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

  it("restores saved checks for editing and discards changes when going back", () => {
    render(<CreateJobFlow />);
    openSurveySelector();
    fireEvent.click(screen.getByRole("checkbox", { name: "Campus Mobility Study" }));
    fireEvent.click(screen.getByRole("button", { name: "Back to create job" }));
    expect(screen.getByText("0 surveys selected")).toBeInTheDocument();

    openSurveySelector();
    expect(screen.getByRole("checkbox", { name: "Campus Mobility Study" })).not.toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "Campus Mobility Study" }));
    fireEvent.click(screen.getByRole("button", { name: "Use 1 survey" }));

    openSurveySelector();
    expect(screen.getByRole("checkbox", { name: "Campus Mobility Study" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Green Habits 2026" })).not.toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "Campus Mobility Study" }));
    expect(screen.getByRole("button", { name: "Use 0 surveys" })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: "Green Habits 2026" }));
    fireEvent.click(screen.getByRole("button", { name: "Use 1 survey" }));
    expect(screen.getByText("Green Habits 2026")).toBeInTheDocument();
    expect(screen.queryByText("Campus Mobility Study")).not.toBeInTheDocument();

    openSurveySelector();
    expect(screen.getByRole("checkbox", { name: "Green Habits 2026" })).toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "Library Experience" }));
    fireEvent.click(screen.getByRole("button", { name: "Back to create job" }));
    expect(screen.getByText("1 survey selected")).toBeInTheDocument();
    expect(screen.getByText("Green Habits 2026")).toBeInTheDocument();

    openSurveySelector();
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
  it("shows missing-field errors without requiring or clearing the description", () => {
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
    (missingField) => {
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
        openSurveySelector();
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

  it("clears only corrected errors and enables retry when all required fields are complete", () => {
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

    openSurveySelector();
    fireEvent.click(screen.getByRole("checkbox", { name: "Campus Mobility Study" }));
    fireEvent.click(screen.getByRole("button", { name: "Use 1 survey" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Job" })).toBeEnabled();
    expect(screen.getByRole("textbox", { name: "Description" })).toHaveValue("");
    fireEvent.submit(screen.getByRole("form", { name: "Create Job" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Job created" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("textbox", { name: "Job title" })).toHaveValue("Campus campaign");
  });
});

describe("CreateJobForm confirmation", () => {
  it("shows submitted details with Pending tracking and lets the user edit them", () => {
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
    openSurveySelector();
    fireEvent.click(screen.getByRole("checkbox", { name: "Campus Mobility Study" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Green Habits 2026" }));
    fireEvent.click(screen.getByRole("button", { name: "Use 2 surveys" }));
    fireEvent.click(screen.getByRole("button", { name: "Create Job" }));

    expect(screen.getByRole("heading", { name: "Job created" })).toBeInTheDocument();
    expect(router.push).toHaveBeenLastCalledWith("/creator/jobs/1");
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
    expect(screen.getByRole("textbox", { name: "Job title" })).toHaveValue(
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
    openSurveySelector();
    expect(screen.getByRole("checkbox", { name: "Campus Mobility Study" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Green Habits 2026" })).toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "Campus Mobility Study" }));
    fireEvent.click(screen.getByRole("button", { name: "Use 1 survey" }));
    fireEvent.click(screen.getByRole("button", { name: "Create Job" }));

    const updatedOverview = within(screen.getByRole("region", { name: "Job overview" }));
    expect(updatedOverview.getByText("Updated campaign")).toBeInTheDocument();
    expect(updatedOverview.getByText("฿12,000 fixed")).toBeInTheDocument();
    expect(updatedOverview.getByText("10 Nov 2026")).toBeInTheDocument();
    expect(updatedOverview.getByText("1 survey")).toBeInTheDocument();
    expect(updatedOverview.getByText("Pending")).toBeInTheDocument();
    expect(router.push).toHaveBeenLastCalledWith(jobPath);

    // Reloading the destination reads the same tab-local draft, without the form mounted.
    unmount();
    render(<JobDraftPage jobId={jobPath.split("/").at(-1)!} />);
    expect(screen.getByRole("heading", { name: "Updated campaign" })).toBeInTheDocument();
    expect(screen.getByText("฿12,000 fixed")).toBeInTheDocument();
  });

  it("offers a return to the form for an unavailable or malformed draft", () => {
    sessionStorage.setItem("cuways-job-draft:999", "{invalid json");
    render(<JobDraftPage jobId="999" />);

    expect(screen.getByRole("heading", { name: "Job preview not available" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create a job" })).toHaveAttribute(
      "href",
      "/creator/jobs/create",
    );
    expect(screen.queryByRole("heading", { name: "Job created" })).not.toBeInTheDocument();
  });

  it("previews the accepted offer UI without changing the saved Pending job", () => {
    const jobId = saveJobDraft(
      {
        title: "Campus Sustainability Campaign",
        description: "Recruit students for our campaign.",
        budget: "฿8,500 fixed",
        deadline: "2026-10-28",
      },
      ["SV-104", "SV-118"],
    );
    const savedDraft = sessionStorage.getItem(`cuways-job-draft:${jobId}`);
    const { rerender } = render(<JobDraftPage jobId={String(jobId)} previewAccepted />);

    expect(screen.getByRole("heading", { name: "Job details" })).toBeInTheDocument();
    expect(screen.getByText("Offer accepted for this job")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "A marketer's offer has been accepted. The job is now in progress.",
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
    expect(tracking.getByText("A marketer has been selected")).toBeInTheDocument();
    expect(tracking.getByText("In Progress").closest("li")).toHaveAttribute("aria-current", "step");
    expect(tracking.getByText("Work is currently underway")).toBeInTheDocument();
    expect(tracking.queryByText("Awaiting offers")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View Job" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Dismiss offer accepted notification" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(sessionStorage.getItem(`cuways-job-draft:${jobId}`)).toBe(savedDraft);

    rerender(<JobDraftPage jobId={String(jobId)} />);
    expect(screen.getByRole("heading", { name: "Job created" })).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Your job has been created");
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Share" })).not.toBeInTheDocument();
  });
});
