import type { components } from "@/lib/api/generated/backend";

export type JobBrief = components["schemas"]["Brief"];

export type ProjectBriefEditor = {
  creatorId: number;
  name: string;
};

export type ProjectBriefAttachment = {
  id: string;
  url: string;
  title: string;
  updatedAt: string;
  updatedBy?: ProjectBriefEditor;
};

export type ProjectBriefValues = Pick<ProjectBriefAttachment, "url" | "title">;

export function projectBriefEditorName(
  attachment: ProjectBriefAttachment,
  creatorId: number,
  creatorName?: string,
): string {
  const editor = attachment.updatedBy;
  const savedName = editor?.name.trim();
  if (savedName && savedName !== `Creator #${editor?.creatorId}` && savedName !== "Unknown user") {
    return savedName;
  }
  if (editor && editor.creatorId !== creatorId) return "Unknown user";
  return creatorName?.trim() || "Unknown user";
}

export function parseProjectBriefUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol) && url.hostname ? url.href : null;
  } catch {
    return null;
  }
}

export function validateJobBrief(value: unknown): JobBrief {
  if (!value || typeof value !== "object") throw new Error("Invalid brief response.");
  const brief = value as Partial<JobBrief>;
  if (
    typeof brief.attachment_id !== "number" ||
    !Number.isInteger(brief.attachment_id) ||
    brief.attachment_id < 1 ||
    brief.attachment_id > 2_147_483_647 ||
    brief.attachment_type !== "Brief" ||
    typeof brief.url !== "string" ||
    !parseProjectBriefUrl(brief.url) ||
    typeof brief.upload_at !== "string" ||
    !Number.isFinite(Date.parse(brief.upload_at))
  )
    throw new Error("Invalid brief response.");
  return brief as JobBrief;
}

export function validateJobBriefHistory(value: unknown): JobBrief[] {
  if (!Array.isArray(value)) throw new Error("Invalid brief history response.");
  const history = value.map(validateJobBrief);
  if (new Set(history.map((brief) => brief.attachment_id)).size !== history.length) {
    throw new Error("Invalid brief history response.");
  }
  return history;
}

export function mergeProjectBriefMetadata(
  briefs: readonly JobBrief[],
  metadata: readonly ProjectBriefAttachment[],
): ProjectBriefAttachment[] {
  const cached = new Map(metadata.map((attachment) => [attachment.id, attachment]));
  // The API defines the history and its order. Cached rows never create attachments.
  return briefs.map((brief) => {
    const previous = cached.get(String(brief.attachment_id));
    const matches =
      previous &&
      parseProjectBriefUrl(previous.url) === parseProjectBriefUrl(brief.url) &&
      Date.parse(previous.updatedAt) === Date.parse(brief.upload_at);
    return {
      id: String(brief.attachment_id),
      url: brief.url,
      updatedAt: brief.upload_at,
      title: matches ? previous.title : "",
      updatedBy: matches ? previous.updatedBy : undefined,
    };
  });
}

function isBriefAttachment(value: unknown): value is ProjectBriefAttachment {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<ProjectBriefAttachment>;
  return (
    typeof entry.id === "string" &&
    entry.id.length > 0 &&
    typeof entry.url === "string" &&
    parseProjectBriefUrl(entry.url) !== null &&
    typeof entry.title === "string" &&
    typeof entry.updatedAt === "string" &&
    Number.isFinite(Date.parse(entry.updatedAt)) &&
    (entry.updatedBy === undefined || isBriefEditor(entry.updatedBy))
  );
}

function isBriefEditor(value: unknown): value is ProjectBriefEditor {
  if (!value || typeof value !== "object") return false;
  const editor = value as Partial<ProjectBriefEditor>;
  return (
    typeof editor.creatorId === "number" &&
    Number.isSafeInteger(editor.creatorId) &&
    editor.creatorId > 0 &&
    typeof editor.name === "string" &&
    editor.name.trim().length > 0
  );
}

function storageKey(jobId: string, creatorId: number) {
  return `cuways-project-brief:${creatorId}:${jobId}`;
}

// Optional title/editor metadata only; the API remains authoritative for saved briefs.
export function readProjectBriefHistory(
  jobId: string,
  creatorId: number,
): ProjectBriefAttachment[] {
  try {
    const stored: unknown = JSON.parse(
      window.sessionStorage.getItem(storageKey(jobId, creatorId)) ?? "[]",
    );
    return Array.isArray(stored) && stored.every(isBriefAttachment) ? stored : [];
  } catch {
    return [];
  }
}

export function cacheProjectBriefHistory(
  jobId: string,
  creatorId: number,
  history: ProjectBriefAttachment[],
): void {
  try {
    window.sessionStorage.setItem(storageKey(jobId, creatorId), JSON.stringify(history));
  } catch {
    // The current page still works when optional browser storage is unavailable.
  }
}
