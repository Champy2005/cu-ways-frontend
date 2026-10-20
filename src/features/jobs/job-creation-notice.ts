// Creation confirmations belong to the next details visit, not the saved job.
const newlyCreatedJobs = new Set<string>();

export function markJobCreated(creatorId: number, jobId: number): void {
  newlyCreatedJobs.add(`${creatorId}:${jobId}`);
}

export function consumeJobCreatedNotice(creatorId: number, jobId: number): boolean {
  return newlyCreatedJobs.delete(`${creatorId}:${jobId}`);
}

const updatedJobs = new Set<string>();
export function markJobUpdated(creatorId: number, jobId: number): void {
  updatedJobs.add(`${creatorId}:${jobId}`);
}
export function consumeJobUpdatedNotice(creatorId: number, jobId: number): boolean {
  return updatedJobs.delete(`${creatorId}:${jobId}`);
}
