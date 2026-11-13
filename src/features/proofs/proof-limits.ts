/**
 * Time limits shared by the proof server functions and the browser.
 *
 * Every backend call on the server is bounded so a stalled backend cannot hold
 * the marketer: the save (15 s) plus one reconciling read (10 s) is at most 25 s.
 */
export const PROOF_REQUEST_TIMEOUT_MS = 15_000;
export const PROOF_READ_TIMEOUT_MS = 10_000;
/** The longest a save can still be in flight on the server after the browser sent it. */
export const PROOF_SERVER_BOUND_MS = PROOF_REQUEST_TIMEOUT_MS + PROOF_READ_TIMEOUT_MS;

/** A03: the browser stops waiting for a save after 12 s and asks the marketer to check. */
export const PROOF_SAVE_DEADLINE_MS = 12_000;
/** Just above the server's 10 s read bound, so the server's own answer normally arrives first. */
export const PROOF_CHECK_TIMEOUT_MS = 15_000;
