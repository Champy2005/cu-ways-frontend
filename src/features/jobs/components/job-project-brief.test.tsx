import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { JobProjectBrief } from "@/features/jobs/components/job-project-brief";

const firstUrl = "https://docs.google.com/document/d/campaign-brief";
const secondUrl = "https://example.com/campaign-guidelines.pdf";

beforeEach(() => {
  sessionStorage.clear();
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function openEditor() {
  fireEvent.click(screen.getByRole("button", { name: "Add Brief URL" }));
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
  it("opens the empty state dialog, validates the URL, and saves a brief without API calls", async () => {
    render(<JobProjectBrief jobId="41" creatorId={4} />);
    expect(screen.getByText("No project brief attached yet")).toBeInTheDocument();
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
    expect(screen.getByText(/^Updated/)).toHaveTextContent(/^Updated \d{2} \w{3} \d{4}$/);
    expect(screen.getByRole("button", { name: "View attachment history (1)" })).toBeInTheDocument();
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
      render(<JobProjectBrief jobId="41" creatorId={4} />);
      const dialog = await openEditor();
      enterBrief(firstUrl, "Unsaved title");
      if (action === "Escape") fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });
      else fireEvent.click(screen.getByRole("button", { name: action }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(screen.getByText("No project brief attached yet")).toBeInTheDocument();
      await openEditor();
      expect(screen.getByRole("textbox", { name: "Brief URL" })).toHaveValue("");
      expect(screen.getByRole("textbox", { name: "Brief Title / Note" })).toHaveValue("");
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it("prefills edits, preserves earlier versions in history, and restores the current brief on revisit", async () => {
    const { unmount } = render(<JobProjectBrief jobId="41" creatorId={4} />);
    await attachBrief();
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
    const history = within(screen.getByRole("list", { name: "Attachment history" }));
    expect(history.getAllByRole("listitem")).toHaveLength(2);
    expect(history.getByRole("link", { name: firstUrl })).toBeInTheDocument();
    expect(history.getByRole("link", { name: secondUrl })).toBeInTheDocument();
    expect(history.getByText("Current brief")).toBeInTheDocument();
    expect(history.getByText("Previous brief")).toBeInTheDocument();
    fireEvent.click(historyButton);
    expect(screen.queryByRole("list", { name: "Attachment history" })).not.toBeInTheDocument();

    unmount();
    render(<JobProjectBrief jobId="41" creatorId={4} />);
    expect(screen.getByRole("heading", { name: "Campaign Guidelines v2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View attachment history (2)" })).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("keeps brief histories separate for different jobs and creators", async () => {
    const { rerender } = render(<JobProjectBrief jobId="41" creatorId={4} />);
    await attachBrief();
    rerender(<JobProjectBrief jobId="42" creatorId={4} />);
    expect(screen.getByText("No project brief attached yet")).toBeInTheDocument();
    rerender(<JobProjectBrief jobId="41" creatorId={5} />);
    expect(screen.getByText("No project brief attached yet")).toBeInTheDocument();
    rerender(<JobProjectBrief jobId="41" creatorId={4} />);
    expect(screen.getByRole("heading", { name: "Campaign Guidelines" })).toBeInTheDocument();
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
});
