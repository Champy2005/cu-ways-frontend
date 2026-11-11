import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JobDetail } from "./job-detail";
import { JobsList } from "./jobs-list";
import { JobsWorkspace } from "./jobs-workspace";
import { loadHiredJob, loadHiredJobs, startHiredJob } from "./actions";
import type { HiredJob, StartResult } from "./types";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
vi.mock("./actions", () => ({
  loadHiredJob: vi.fn(),
  loadHiredJobs: vi.fn(),
  startHiredJob: vi.fn(),
}));

const job: HiredJob = {
  id: 41,
  status: "Accepted",
  surveys: [
    { id: 2, title: "Campus commute habits" },
    { id: 3, title: "Student dining preferences" },
  ],
  creator: "Mali Srisawat",
  price: "8500.00",
  deliveryDate: "2026-11-15",
  deadline: "2026-11-18",
  targetResponses: 250,
  briefUrl: "https://example.com/brief/41",
};
const detail = (record = job) => (
  <JobDetail
    id="41"
    initial={{ status: "success", data: record }}
    backHref="/marketer/jobs?status=active&page=1"
  />
);

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  vi.mocked(loadHiredJob).mockResolvedValue({ status: "success", data: job });
  vi.mocked(loadHiredJobs).mockResolvedValue({ status: "success", data: [job] });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("US025 route separation", () => {
  it("keeps list navigation at jobs/[id] without an inline Start action", () => {
    render(
      <JobsWorkspace>
        <JobsList initial={{ status: "success", data: [job] }} filter="active" page={1} />
      </JobsWorkspace>,
    );
    expect(screen.getByRole("heading", { name: "My Jobs" })).toBeVisible();
    expect(screen.getByRole("link", { name: "View job #41" }).getAttribute("href")).toMatch(
      /^\/marketer\/jobs\/41\?/,
    );
    expect(screen.queryByRole("button", { name: "Start job" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Filter jobs by status"), {
      target: { value: "Completed" },
    });
    expect(navigation.push).toHaveBeenCalledWith("/marketer/jobs?status=Completed&page=1");
  });

  it("shows optional missing context without blocking an Accepted job", () => {
    render(
      <JobsWorkspace>
        {detail({
          ...job,
          briefUrl: null,
          deadline: null,
          deliveryDate: null,
          targetResponses: null,
        })}
      </JobsWorkspace>,
    );
    expect(screen.getByRole("heading", { name: "Job #41" })).toBeVisible();
    expect(screen.getByText("No brief attached")).toBeVisible();
    expect(screen.getByText("Target not specified")).toBeVisible();
    expect(screen.getByRole("button", { name: "Start job" })).toBeEnabled();
  });

  it("cancels the confirmation without dispatching a start", async () => {
    render(<JobsWorkspace>{detail()}</JobsWorkspace>);
    fireEvent.click(screen.getByRole("button", { name: "Start job" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("8,500.00 THB")).toBeVisible();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(startHiredJob).not.toHaveBeenCalled();
  });

  it("keeps one pending start alive through dismissal and list navigation", async () => {
    let resolve!: (result: StartResult) => void;
    vi.mocked(startHiredJob).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const view = render(<JobsWorkspace>{detail()}</JobsWorkspace>);
    fireEvent.click(screen.getByRole("button", { name: "Start job" }));
    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", { name: "Start job" }),
    );
    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", { name: "Continue browsing" }),
    );
    expect(screen.getByRole("button", { name: "View progress" })).toBeVisible();
    view.rerender(
      <JobsWorkspace>
        <JobsList initial={{ status: "success", data: [job] }} filter="active" page={1} />
      </JobsWorkspace>,
    );
    expect(screen.getByText("Starting Job #41")).toBeVisible();
    await act(async () => resolve({ status: "started", job: { ...job, status: "In Progress" } }));
    expect(within(screen.getByRole("article")).getByText("In Progress")).toBeVisible();
    expect(startHiredJob).toHaveBeenCalledTimes(1);
  });

  it("requires a status check after an unknown start instead of enabling a second write", async () => {
    vi.mocked(startHiredJob).mockResolvedValue({ status: "recheck" });
    render(<JobsWorkspace>{detail()}</JobsWorkspace>);
    fireEvent.click(screen.getByRole("button", { name: "Start job" }));
    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", { name: "Start job" }),
    );
    expect(await screen.findByText("Start status not confirmed")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Start job" })).not.toBeInTheDocument();
    expect(sessionStorage.getItem("cuways:job-start:41")).toBe("check");
  });

  it("renders a terminal job read-only", () => {
    render(<JobsWorkspace>{detail({ ...job, status: "Completed" })}</JobsWorkspace>);
    expect(screen.getByText("Completed")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Start job" })).not.toBeInTheDocument();
  });

  it("does not reuse a confirmed result after a fresh read revokes access", async () => {
    vi.mocked(startHiredJob).mockResolvedValue({
      status: "started",
      job: { ...job, status: "In Progress" },
    });
    const view = render(<JobsWorkspace>{detail()}</JobsWorkspace>);
    fireEvent.click(screen.getByRole("button", { name: "Start job" }));
    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", { name: "Start job" }),
    );
    await screen.findByText("In Progress");
    view.rerender(
      <JobsWorkspace>
        <JobDetail
          key="return"
          id="41"
          initial={{ status: "unavailable" }}
          backHref="/marketer/jobs"
        />
      </JobsWorkspace>,
    );
    expect(screen.getByRole("heading", { name: "Job unavailable" })).toBeVisible();
    expect(screen.queryByText("Mali Srisawat")).not.toBeInTheDocument();
    expect(screen.queryByText("8,500.00 THB")).not.toBeInTheDocument();
  });

  it("shows the fresh In Progress status after recovering an uncertain start", async () => {
    sessionStorage.setItem("cuways:job-start:41", "check");
    vi.mocked(loadHiredJob).mockResolvedValue({
      status: "success",
      data: { ...job, status: "In Progress" },
    });
    render(<JobsWorkspace>{detail()}</JobsWorkspace>);
    expect(screen.getByText("Start status not confirmed")).toBeVisible();
    fireEvent.click(screen.getAllByRole("button", { name: "Refresh job" })[0]);
    await waitFor(() =>
      expect(screen.queryByText("Start status not confirmed")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("In Progress")).toBeVisible();
    expect(startHiredJob).not.toHaveBeenCalled();
  });
});
