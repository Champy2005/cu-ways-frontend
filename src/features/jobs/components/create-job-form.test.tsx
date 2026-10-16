import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

import { CreateJobForm } from "@/features/jobs/components/create-job-form";

afterEach(cleanup);

function openSurveySelector() {
  fireEvent.click(screen.getByRole("button", { name: "Edit selected surveys" }));
}

describe("CreateJobForm survey selection", () => {
  it("starts empty, follows checkbox changes, and saves only the chosen surveys", () => {
    render(<CreateJobForm />);
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
    render(<CreateJobForm />);
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
    render(<CreateJobForm />);
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
      render(<CreateJobForm />);
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
    render(<CreateJobForm />);
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
    render(<CreateJobForm />);
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
  });
});
