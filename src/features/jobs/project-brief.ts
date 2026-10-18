export type ProjectBriefAttachment = {
  id: string;
  url: string;
  title: string;
  updatedAt: string;
};

export type ProjectBriefValues = Pick<ProjectBriefAttachment, "url" | "title">;

export function parseProjectBriefUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol) && url.hostname ? url.href : null;
  } catch {
    return null;
  }
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
    Number.isFinite(Date.parse(entry.updatedAt))
  );
}

function storageKey(jobId: string, creatorId: number) {
  return `cuways-project-brief:${creatorId}:${jobId}`;
}

// Frontend-only history. No brief data is sent to the backend.
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
