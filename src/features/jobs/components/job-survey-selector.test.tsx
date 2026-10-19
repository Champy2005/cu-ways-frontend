import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

import { loadJobSurveys, type JobSurveysActionState } from "@/features/jobs/actions";
import { JobSurveySelector } from "@/features/jobs/components/job-survey-selector";
import type { JobSurveyOption } from "@/features/jobs/types";

// Mock data for these tests only; the live selector loads surveys from the API.
const mockSurveyOptions: JobSurveyOption[] = [
  { id: "104", title: "Campus Mobility Study", targetResponses: 200 },
  { id: "118", title: "Green Habits 2026", targetResponses: 150 },
  { id: "99", title: "Student Dining Pulse", targetResponses: 100 },
  { id: "87", title: "Library Experience", targetResponses: 250 },
];

vi.mock("@/features/jobs/actions", () => ({ loadJobSurveys: vi.fn() }));

beforeEach(() => vi.mocked(loadJobSurveys).mockReset());
afterEach(cleanup);

describe("Survey selector name search", () => {
  beforeEach(() => {
    vi.mocked(loadJobSurveys).mockResolvedValue({ status: "success", surveys: mockSurveyOptions });
  });

  it("filters immediately by partial name, ignoring case and surrounding whitespace", async () => {
    render(<JobSurveySelector initialSelectedSurveyIds={[]} onBack={vi.fn()} onSave={vi.fn()} />);
    await screen.findByRole("checkbox", { name: "Campus Mobility Study" });
    const search = screen.getByRole("searchbox", { name: "Search surveys" });

    for (const query of ["campus", " MoBiLiTy ", "Study"]) {
      fireEvent.change(search, { target: { value: query } });
      expect(screen.getAllByRole("checkbox")).toHaveLength(1);
      expect(screen.getByRole("checkbox", { name: "Campus Mobility Study" })).toBeInTheDocument();
      expect(screen.getByText("1 available")).toBeInTheDocument();
    }

    fireEvent.change(search, { target: { value: "no matching survey" } });
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No matching surveys" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "We couldn't find any surveys matching your search.",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Try checking for typos or clear your search.",
    );
    expect(screen.getByText("0 available")).toBeInTheDocument();

    for (const query of ["", "   "]) {
      fireEvent.change(search, { target: { value: query } });
      expect(screen.getAllByRole("checkbox")).toHaveLength(4);
      expect(screen.getByText("4 available")).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "No matching surveys" }),
      ).not.toBeInTheDocument();
    }
    expect(loadJobSurveys).toHaveBeenCalledOnce();
  });

  it("keeps selections across searches and saves surveys hidden by the current query", async () => {
    const onSave = vi.fn();
    render(
      <JobSurveySelector initialSelectedSurveyIds={["104"]} onBack={vi.fn()} onSave={onSave} />,
    );
    await screen.findByRole("checkbox", { name: "Campus Mobility Study" });
    const search = screen.getByRole("searchbox", { name: "Search surveys" });

    fireEvent.change(search, { target: { value: "green" } });
    expect(
      screen.queryByRole("checkbox", { name: "Campus Mobility Study" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "Green Habits 2026" }));

    fireEvent.change(search, { target: { value: "" } });
    expect(screen.getByRole("checkbox", { name: "Campus Mobility Study" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Green Habits 2026" })).toBeChecked();

    fireEvent.change(search, { target: { value: "no matching survey" } });
    expect(screen.getByText("2 selected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Use 2 surveys" }));
    expect(onSave).toHaveBeenCalledExactlyOnceWith(["104", "118"], mockSurveyOptions);
  });

  it("keeps already linked surveys disabled in matching results", async () => {
    const onSave = vi.fn();
    render(
      <JobSurveySelector
        initialSelectedSurveyIds={[]}
        linkedSurveyIds={["104"]}
        onBack={vi.fn()}
        onSave={onSave}
      />,
    );
    await screen.findByRole("checkbox", { name: "Campus Mobility Study" });
    const search = screen.getByRole("searchbox", { name: "Search surveys" });

    fireEvent.change(search, { target: { value: "campus" } });
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    const linkedSurvey = screen.getByRole("checkbox", { name: "Campus Mobility Study" });
    expect(linkedSurvey).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(linkedSurvey);
    expect(linkedSurvey).not.toBeChecked();
    expect(screen.getByText("0 selected")).toBeInTheDocument();
    expect(screen.getByText("Linked")).toBeInTheDocument();
    expect(screen.getByText("0 available")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Use 0 surveys" })).toBeDisabled();

    fireEvent.change(search, { target: { value: "green" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Green Habits 2026" }));
    fireEvent.click(screen.getByRole("button", { name: "Use 1 survey" }));
    expect(onSave).toHaveBeenCalledExactlyOnceWith(["104", "118"], mockSurveyOptions);
  });
});

describe("Survey selector API states", () => {
  it("loads on every open, blocks saving while loading, and keeps only owned selections", async () => {
    let resolve!: (value: JobSurveysActionState) => void;
    vi.mocked(loadJobSurveys).mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const onSave = vi.fn();
    const props = { initialSelectedSurveyIds: ["104", "9999"], onBack: vi.fn(), onSave };
    const { unmount } = render(<JobSurveySelector {...props} />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading your surveys");
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
    await act(async () => resolve({ status: "success", surveys: mockSurveyOptions }));
    expect(screen.getByRole("checkbox", { name: "Campus Mobility Study" })).toBeChecked();
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Use 1 survey" }));
    expect(onSave).toHaveBeenCalledWith(["104"], mockSurveyOptions);

    unmount();
    vi.mocked(loadJobSurveys).mockResolvedValue({
      status: "success",
      surveys: [mockSurveyOptions[1]],
    });
    render(<JobSurveySelector {...props} />);
    await screen.findByRole("checkbox", { name: "Green Habits 2026" });
    expect(
      screen.queryByRole("checkbox", { name: "Campus Mobility Study" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("0 selected")).toBeInTheDocument();
    expect(loadJobSurveys).toHaveBeenCalledTimes(2);
  });

  it("shows request failures, supports retry, and renders missing targets without inventing zero", async () => {
    vi.mocked(loadJobSurveys)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({
        status: "success",
        surveys: [{ ...mockSurveyOptions[0], targetResponses: null }],
      });
    render(<JobSurveySelector initialSelectedSurveyIds={[]} onBack={vi.fn()} onSave={vi.fn()} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Please try again");
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByRole("checkbox", { name: "Campus Mobility Study" });
    expect(screen.getByText("SV-104 · Target not specified")).toBeInTheDocument();
    expect(loadJobSurveys).toHaveBeenCalledTimes(2);
  });

  it("shows an empty state and lets the user return without losing the form", async () => {
    vi.mocked(loadJobSurveys).mockResolvedValue({ status: "success", surveys: [] });
    const onBack = vi.fn();
    const onSave = vi.fn();
    render(<JobSurveySelector initialSelectedSurveyIds={[]} onBack={onBack} onSave={onSave} />);
    await screen.findByRole("heading", { name: "No surveys yet" });
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Back to create job" }));
    expect(onBack).toHaveBeenCalledOnce();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("ignores a response after the selector is closed", async () => {
    let resolve!: (value: JobSurveysActionState) => void;
    vi.mocked(loadJobSurveys).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const onSave = vi.fn();
    const { unmount } = render(
      <JobSurveySelector initialSelectedSurveyIds={[]} onBack={vi.fn()} onSave={onSave} />,
    );
    unmount();
    await act(async () => resolve({ status: "success", surveys: mockSurveyOptions }));
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});
