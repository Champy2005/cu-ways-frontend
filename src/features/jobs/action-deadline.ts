/**
 * The longest the payment page waits for a server action before treating its
 * result as unknown. The action bounds its own backend calls to 25 seconds
 * (save plus one status read), so this only fires when the action's response
 * never reaches the browser.
 */
export const PAYMENT_ACTION_DEADLINE_MS = 35_000;

export class ActionDeadlineError extends Error {
  constructor() {
    super("The server did not answer in time.");
    this.name = "ActionDeadlineError";
  }
}

/**
 * Resolves with the action's result, or rejects when the action fails or
 * outlives `ms`. A result that arrives after the deadline is ignored: the page
 * has already moved to its recovery state and the Creator checks the status.
 */
export function withinDeadline<T>(action: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ActionDeadlineError()), ms);
  });
  return Promise.race([action, deadline]).finally(() => clearTimeout(timer));
}
