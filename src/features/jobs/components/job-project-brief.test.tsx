import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { loadJobBriefs, saveJobBrief, type SaveJobBriefState } from "@/features/jobs/brief-actions";
import { JobProjectBrief } from "@/features/jobs/components/job-project-brief";
import { cacheProjectBriefHistory, type JobBrief } from "@/features/jobs/project-brief";

vi.mock("@/features/jobs/brief-actions", () => ({ loadJobBriefs: vi.fn(), saveJobBrief: vi.fn() }));

const firstUrl = "https://docs.google.com/document/d/campaign-brief";
const secondUrl = "https://example.com/campaign-guidelines.pdf";
let remoteHistory: JobBrief[];
const remoteBrief = (id = 7, url = firstUrl): JobBrief => ({
  attachment_id: id,
  attachment_type: "Brief",
  url,
  upload_at: `2026-09-${String(id).padStart(2, "0")}T09:45:00.000Z`,
});

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  vi.stubGlobal("fetch", vi.fn());
  remoteHistory = [];
  vi.mocked(loadJobBriefs).mockImplementation(async () => ({
    status: "success",
    history: [...remoteHistory],
    creatorId: 4,
  }));
  vi.mocked(saveJobBrief).mockImplementation(async (_jobId, url) => {
    const brief = remoteBrief(7 + remoteHistory.length, url);
    remoteHistory = [brief, ...remoteHistory];
    return { status: "success", brief, creatorId: 4 };
  });
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function openEditor() {
  fireEvent.click(await screen.findByRole("button", { name: "Add Brief URL" }));
  return screen.findByRole("dialog", { name: "Project Brief URL" });
}

function enterBrief(url: string, title = "") {
  fireEvent.change(screen.getByRole("textbox", { name: "Brief URL" }), {
    target: { value: url },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Brief Title / Note" }), {
    target: { value: title },
  });
}

async function attachBrief(url = firstUrl, title = "Campaign Guidelines") {
  await openEditor();
  enterBrief(url, title);
  fireEvent.click(screen.getByRole("button", { name: "Save Brief" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
}

describe("Project brief UI", () => {
  it("validates before saving and renders the confirmed API brief with its optional title", async () => {
    const onSaved = vi.fn();
    render(<JobProjectBrief jobId="41" creatorId={4} onSaved={onSaved} />);
    expect(await screen.findByText("No project brief attached yet")).toBeInTheDocument();
    const dialog = await openEditor();
    const url = within(dialog).getByRole("textbox", { name: "Brief URL" });
    const save = within(dialog).getByRole("button", { name: "Save Brief" });
    expect(url).toBeRequired();
    expect(save).toBeDisabled();
    await waitFor(() => expect(url).toHaveFocus());

    for (const invalid of [
      "not a link",
      "javascript:alert(1)",
      "file:///brief.pdf",
      "ftp://example.com/brief",
    ]) {
      fireEvent.change(url, { target: { value: invalid } });
      fireEvent.blur(url);
      expect(save).toBeDisabled();
      expect(within(dialog).getByRole("alert")).toHaveTextContent("Enter a valid URL");
      expect(onSaved).not.toHaveBeenCalled();
      expect(saveJobBrief).not.toHaveBeenCalled();
    }

    enterBrief(`  ${firstUrl}  `, "  Campaign Guidelines  ");
    expect(save).toBeEnabled();
    expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.click(save);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.queryByText("No project brief attached yet")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Campaign Guidelines" })).toBeInTheDocument();
    const link = screen.getByRole("link", { name: firstUrl });
    expect(link).toHaveAttribute("href", firstUrl);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText(/^Updated/)).toHaveTextContent(/^Updated \d{2} \w{3,4} \d{4}$/);
    expect(screen.getByRole("button", { name: "View attachment history (1)" })).toBeInTheDocument();
    expect(onSaved).toHaveBeenCalledOnce();
    expect(saveJobBrief).toHaveBeenCalledExactlyOnceWith("41", firstUrl);
    expect(screen.getByText(/^Updated/).querySelector("time")).toHaveAttribute(
      "dateTime",
      remoteHistory[0].upload_at,
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("allows a URL without a title or note", async () => {
    render(<JobProjectBrief jobId="41" creatorId={4} />);
    await attachBrief("http://example.com/brief", "");
    expect(screen.getByRole("heading", { name: "Project brief", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "http://example.com/brief");
  });

  it.each(["Cancel", "Close project brief dialog", "Escape"])(
    "discards unsaved fields when closing with %s",
    async (action) => {
      const onSaved = vi.fn();
      render(<JobProjectBrief jobId="41" creatorId={4} onSaved={onSaved} />);
      const dialog = await openEditor();
      enterBrief(firstUrl, "Unsaved title");
      if (action === "Escape") fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });
      else fireEvent.click(screen.getByRole("button", { name: action }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(screen.getByText("No project brief attached yet")).toBeInTheDocument();
      await openEditor();
      expect(screen.getByRole("textbox", { name: "Brief URL" })).toHaveValue("");
      expect(screen.getByRole("textbox", { name: "Brief Title / Note" })).toHaveValue("");
      expect(onSaved).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it("prefills edits, preserves earlier versions in history, and restores the current brief on revisit", async () => {
    const { unmount, rerender } = render(
      <JobProjectBrief jobId="41" creatorId={4} creatorName="Ari" />,
    );
    await attachBrief();
    rerender(<JobProjectBrief jobId="41" creatorId={4} creatorName="Mina" />);
    fireEvent.click(screen.getByRole("button", { name: "Edit project brief" }));
    await screen.findByRole("dialog", { name: "Project Brief URL" });
    expect(screen.getByRole("textbox", { name: "Brief URL" })).toHaveValue(firstUrl);
    expect(screen.getByRole("textbox", { name: "Brief Title / Note" })).toHaveValue(
      "Campaign Guidelines",
    );
    expect(screen.getByRole("button", { name: "Save Brief" })).toBeDisabled();
    enterBrief(secondUrl, "Campaign Guidelines v2");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Campaign Guidelines" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit project brief" }));
    await screen.findByRole("dialog", { name: "Project Brief URL" });
    enterBrief(secondUrl, "Campaign Guidelines v2");
    fireEvent.click(screen.getByRole("button", { name: "Save Brief" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const historyButton = screen.getByRole("button", { name: "View attachment history (2)" });
    expect(historyButton).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(historyButton);
    const sheet = await screen.findByRole("dialog", { name: "Brief Attachment History" });
    const history = within(within(sheet).getByRole("list", { name: "Attachment history" }));
    expect(history.getAllByRole("listitem")).toHaveLength(2);
    expect(history.getByText(firstUrl)).toBeInTheDocument();
    expect(history.getByText(secondUrl)).toBeInTheDocument();
    expect(history.getAllByRole("link")).toHaveLength(2);
    expect(history.queryByRole("link", { name: firstUrl })).not.toBeInTheDocument();
    expect(history.queryByRole("link", { name: secondUrl })).not.toBeInTheDocument();
    expect(history.getByText("Current")).toBeInTheDocument();
    expect(history.getByText("Replaced")).toBeInTheDocument();
    expect(history.getByText(/Updated by Mina/)).toBeInTheDocument();
    expect(history.getByText(/Created by Ari/)).toBeInTheDocument();
    expect(history.getAllByText(/\d{2} \w{3,4} \d{4}, \d{2}:\d{2}/)).toHaveLength(2);
    expect(history.getByText("Google Drive")).toBeInTheDocument();
    expect(history.getByText("PDF document")).toBeInTheDocument();
    const externalLink = history.getByRole("link", {
      name: "Open Campaign Guidelines v2 in a new tab",
    });
    expect(externalLink).toHaveAttribute("href", secondUrl);
    expect(externalLink).toHaveAttribute("target", "_blank");
    expect(externalLink).toHaveAttribute("rel", "noopener noreferrer");
    fireEvent.click(within(sheet).getByRole("button", { name: "Close attachment history" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(historyButton).toHaveFocus());

    unmount();
    render(<JobProjectBrief jobId="41" creatorId={4} />);
    expect(
      await screen.findByRole("heading", { name: "Campaign Guidelines v2" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View attachment history (2)" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "View attachment history (2)" }));
    const reopened = await screen.findByRole("dialog", { name: "Brief Attachment History" });
    expect(within(reopened).getByText(/Updated by Mina/)).toBeInTheDocument();
    expect(within(reopened).getByText(/Created by Ari/)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("closes history with Escape without changing the attached brief", async () => {
    render(<JobProjectBrief jobId="41" creatorId={4} creatorName="thunn" />);
    await attachBrief();
    const trigger = screen.getByRole("button", { name: "View attachment history (1)" });
    fireEvent.click(trigger);
    const sheet = await screen.findByRole("dialog", { name: "Brief Attachment History" });
    expect(within(sheet).getByText(/Created by thunn/)).toBeInTheDocument();
    fireEvent.keyDown(sheet, { key: "Escape", code: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Campaign Guidelines" })).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("merges browser titles only with confirmed backend records and uses the owner username", async () => {
    remoteHistory = [remoteBrief()];
    cacheProjectBriefHistory("41", 4, [
      {
        id: "7",
        title: "Initial Campaign Brief",
        url: firstUrl,
        updatedAt: remoteHistory[0].upload_at,
      },
    ]);
    render(<JobProjectBrief jobId="41" creatorId={4} creatorName="thunn" />);
    fireEvent.click(await screen.findByRole("button", { name: "View attachment history (1)" }));
    const sheet = await screen.findByRole("dialog", { name: "Brief Attachment History" });
    expect(
      within(sheet).getByRole("heading", { name: "Initial Campaign Brief" }),
    ).toBeInTheDocument();
    expect(within(sheet).getByText(/Created by thunn/)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("keeps brief histories separate for different jobs and creators", async () => {
    const { rerender } = render(<JobProjectBrief jobId="41" creatorId={4} />);
    await attachBrief();
    vi.mocked(loadJobBriefs).mockResolvedValueOnce({
      status: "success",
      history: [],
      creatorId: 4,
    });
    rerender(<JobProjectBrief jobId="42" creatorId={4} />);
    expect(await screen.findByText("No project brief attached yet")).toBeInTheDocument();
    vi.mocked(loadJobBriefs).mockResolvedValueOnce({
      status: "success",
      history: [],
      creatorId: 5,
    });
    rerender(<JobProjectBrief jobId="41" creatorId={5} />);
    expect(await screen.findByText("No project brief attached yet")).toBeInTheDocument();
    rerender(<JobProjectBrief jobId="41" creatorId={4} />);
    expect(await screen.findByRole("heading", { name: "Campaign Guidelines" })).toBeInTheDocument();
  });

  it("keeps the current page usable when browser storage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("unavailable");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("unavailable");
    });
    render(<JobProjectBrief jobId="41" creatorId={4} />);
    await attachBrief();
    expect(screen.getByRole("heading", { name: "Campaign Guidelines" })).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows read failures with a retry instead of displaying a false empty state", async () => {
    vi.mocked(loadJobBriefs).mockResolvedValueOnce({
      status: "error",
      message: "You do not have permission to manage this job's briefs.",
    });
    render(<JobProjectBrief jobId="41" creatorId={4} />);
    expect(screen.getByText("Loading project brief…")).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent("permission");
    expect(screen.queryByRole("button", { name: "Add Brief URL" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reload briefs" }));
    expect(await screen.findByText("No project brief attached yet")).toBeInTheDocument();
    expect(loadJobBriefs).toHaveBeenCalledTimes(2);
    expect(saveJobBrief).not.toHaveBeenCalled();
  });

  it("ignores old frontend-only history and mismatched cached metadata", async () => {
    remoteHistory = [remoteBrief()];
    cacheProjectBriefHistory("41", 4, [
      {
        id: "old-local-uuid",
        url: firstUrl,
        title: "Never saved",
        updatedAt: remoteHistory[0].upload_at,
      },
      { id: "7", url: secondUrl, title: "Stale metadata", updatedAt: remoteHistory[0].upload_at },
    ]);
    render(<JobProjectBrief jobId="41" creatorId={4} creatorName="thunn" />);
    fireEvent.click(await screen.findByRole("button", { name: "View attachment history (1)" }));
    const history = within(await screen.findByRole("dialog", { name: "Brief Attachment History" }));
    expect(history.getAllByRole("listitem")).toHaveLength(1);
    expect(history.getByText(firstUrl)).toBeInTheDocument();
    expect(history.queryByText("Never saved")).not.toBeInTheDocument();
    expect(history.queryByText("Stale metadata")).not.toBeInTheDocument();
    expect(history.getByText(/Created by thunn/)).toBeInTheDocument();
  });

  it("waits for a confirmed save and blocks duplicate submissions and dismissal while pending", async () => {
    let finish!: (value: SaveJobBriefState) => void;
    vi.mocked(saveJobBrief).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const onSaved = vi.fn();
    render(<JobProjectBrief jobId="41" creatorId={4} onSaved={onSaved} />);
    const dialog = await openEditor();
    enterBrief(firstUrl, "Pending title");
    const form = dialog.querySelector("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(saveJobBrief).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Pending title" })).not.toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
    const brief = remoteBrief();
    await act(async () => finish({ status: "success", brief, creatorId: 4 }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Pending title" })).toBeInTheDocument();
    expect(onSaved).toHaveBeenCalledOnce();
  });

  it("retains entered values and allows retry after a definite API rejection", async () => {
    vi.mocked(saveJobBrief).mockResolvedValueOnce({
      status: "error",
      message: "Your session expired. Sign in again to continue.",
    });
    const onSaved = vi.fn();
    render(<JobProjectBrief jobId="41" creatorId={4} onSaved={onSaved} />);
    const dialog = await openEditor();
    enterBrief(firstUrl, "My title");
    fireEvent.click(screen.getByRole("button", { name: "Save Brief" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("session expired");
    expect(screen.getByRole("textbox", { name: "Brief URL" })).toHaveValue(firstUrl);
    expect(screen.getByRole("textbox", { name: "Brief Title / Note" })).toHaveValue("My title");
    expect(onSaved).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("button", { name: "Save Brief" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Save Brief" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(onSaved).toHaveBeenCalledOnce();
  });

  it("requires a GET reload after an uncertain save even if the form is dismissed", async () => {
    const onSaved = vi.fn();
    vi.mocked(saveJobBrief).mockImplementationOnce(async () => {
      remoteHistory = [remoteBrief()];
      return {
        status: "reconcile",
        message: "The save could not be confirmed. Reload brief history before saving again.",
      };
    });
    render(<JobProjectBrief jobId="41" creatorId={4} onSaved={onSaved} />);
    const dialog = await openEditor();
    enterBrief(firstUrl);
    fireEvent.click(screen.getByRole("button", { name: "Save Brief" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("could not be confirmed");
    await waitFor(() => expect(screen.getByRole("button", { name: "Save Brief" })).toBeDisabled());
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Add Brief URL" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reload briefs" }));
    expect(
      await screen.findByRole("button", { name: "View attachment history (1)" }),
    ).toBeInTheDocument();
    expect(loadJobBriefs).toHaveBeenCalledTimes(2);
    expect(saveJobBrief).toHaveBeenCalledTimes(1);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("shows the saved brief immediately and keeps previous versions without reloading history", async () => {
    const onSaved = vi.fn();
    render(<JobProjectBrief jobId="41" creatorId={4} onSaved={onSaved} />);
    await attachBrief();
    vi.mocked(loadJobBriefs).mockImplementation(() => new Promise(() => {}));
    fireEvent.click(screen.getByRole("button", { name: "Edit project brief" }));
    await screen.findByRole("dialog", { name: "Project Brief URL" });
    enterBrief(secondUrl, "Updated guidelines");
    fireEvent.click(screen.getByRole("button", { name: "Save Brief" }));
    expect(await screen.findByRole("heading", { name: "Updated guidelines" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(loadJobBriefs).toHaveBeenCalledTimes(1);
    expect(saveJobBrief).toHaveBeenCalledTimes(2);
    expect(onSaved).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole("button", { name: "View attachment history (2)" }));
    const sheet = within(await screen.findByRole("dialog", { name: "Brief Attachment History" }));
    expect(sheet.getByText(firstUrl)).toBeInTheDocument();
    expect(sheet.getByText(secondUrl)).toBeInTheDocument();
    expect(loadJobBriefs).toHaveBeenCalledTimes(1);
  });

  it("ignores late history responses after changing jobs", async () => {
    let finish!: (value: Awaited<ReturnType<typeof loadJobBriefs>>) => void;
    vi.mocked(loadJobBriefs).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { rerender } = render(<JobProjectBrief jobId="41" creatorId={4} />);
    rerender(<JobProjectBrief jobId="42" creatorId={4} />);
    expect(await screen.findByText("No project brief attached yet")).toBeInTheDocument();
    await act(async () => finish({ status: "success", history: [remoteBrief()], creatorId: 4 }));
    expect(screen.getByText("No project brief attached yet")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit project brief" })).not.toBeInTheDocument();
  });
});
