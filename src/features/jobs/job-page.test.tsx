import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import CreatorJobPage from "@/app/(creator)/creator/jobs/[id]/page";
import { loadJobBriefs, saveJobBrief } from "@/features/jobs/brief-actions";
import { loadSavedJob } from "@/features/jobs/job-actions";
import { cacheProjectBriefHistory, readProjectBriefHistory } from "@/features/jobs/project-brief";
import { getUser } from "@/features/users/api";
import { requireSession } from "@/lib/auth/guards";

vi.mock("@/lib/auth/guards", () => ({ requireSession: vi.fn() }));
vi.mock("@/features/users/api", () => ({ getUser: vi.fn() }));
vi.mock("@/features/jobs/job-actions", () => ({
  loadSavedJob: vi.fn(),
  addJobSurveys: vi.fn(),
  removeJobSurvey: vi.fn(),
}));
vi.mock("@/features/jobs/actions", () => ({ loadJobSurveys: vi.fn() }));
vi.mock("@/features/jobs/brief-actions", () => ({ loadJobBriefs: vi.fn(), saveJobBrief: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const pageProps = () => ({
  params: Promise.resolve({ id: "41" }),
  searchParams: Promise.resolve({}),
});

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  vi.stubGlobal("fetch", vi.fn());
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  const original = {
    attachment_id: 7,
    attachment_type: "Brief" as const,
    url: "https://example.com/brief.pdf",
    upload_at: "2026-09-15T09:45:00.000Z",
  };
  vi.mocked(loadJobBriefs).mockResolvedValue({
    status: "success",
    history: [original],
    creatorId: 4,
  });
  vi.mocked(saveJobBrief).mockImplementation(async () => {
    const brief = { ...original, attachment_id: 8, upload_at: "2026-09-29T14:20:00.000Z" };
    vi.mocked(loadJobBriefs).mockResolvedValue({
      status: "success",
      history: [brief, original],
      creatorId: 4,
    });
    return { status: "success", brief, creatorId: 4 };
  });
  vi.mocked(requireSession).mockResolvedValue({
    userId: 4,
    role: "user",
    expiresAt: 4_000_000_000,
    token: "mock-token",
  });
  vi.mocked(getUser).mockResolvedValue({
    user_id: 4,
    name: "thunn",
    email: "creator@example.com",
    phone: null,
    line_id: null,
    created_at: "2026-09-01T00:00:00.000Z",
  });
  vi.mocked(loadSavedJob).mockResolvedValue({
    status: "success",
    creatorId: 4,
    job: {
      job_id: 41,
      job_status: "Pending",
      created_at: "2026-09-01T00:00:00.000Z",
      surveys: [{ survey_id: 104, title: "Campus Mobility Study" }],
    },
  });
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Job details editor identity", () => {
  it("uses the signed-in username for new revisions and the same user's old placeholder entries", async () => {
    cacheProjectBriefHistory("41", 4, [
      {
        id: "7",
        title: "Initial brief",
        url: "https://example.com/brief.pdf",
        updatedAt: "2026-09-15T09:45:00.000Z",
        updatedBy: { creatorId: 4, name: "Creator #4" },
      },
    ]);
    const { unmount } = render(await CreatorJobPage(pageProps()));
    expect(getUser).toHaveBeenCalledExactlyOnceWith(4);
    fireEvent.click(await screen.findByRole("button", { name: "Edit project brief" }));
    await screen.findByRole("dialog", { name: "Project Brief URL" });
    fireEvent.change(screen.getByRole("textbox", { name: "Brief Title / Note" }), {
      target: { value: "Revised brief" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Brief" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("status")).toHaveTextContent(/^Project brief updated successfully$/);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Dismiss notification",
      }),
    );
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "View attachment history (2)" }));
    const history = within(await screen.findByRole("dialog", { name: "Brief Attachment History" }));
    expect(history.getByText(/Updated by thunn/)).toBeInTheDocument();
    expect(history.getByText(/Created by thunn/)).toBeInTheDocument();
    expect(history.queryByText(/Creator #4/)).not.toBeInTheDocument();
    expect(readProjectBriefHistory("41", 4)[0].updatedBy).toEqual({ creatorId: 4, name: "thunn" });
    unmount();
    render(await CreatorJobPage(pageProps()));
    await screen.findByRole("region", { name: "Project Brief" });
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    expect(fetch).not.toHaveBeenCalled();
  });

  it("requires authentication before reading the editor profile", async () => {
    vi.mocked(requireSession).mockRejectedValue(new Error("Session required"));
    await expect(CreatorJobPage(pageProps())).rejects.toThrow("Session required");
    expect(getUser).not.toHaveBeenCalled();
  });

  it("shows a profile loading error instead of inventing an editor identity", async () => {
    vi.mocked(getUser).mockRejectedValue(new Error("Profile unavailable"));
    render(await CreatorJobPage(pageProps()));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(loadSavedJob).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Add Brief URL" })).not.toBeInTheDocument();
  });
});
