import type { InvitationActions } from "../types";
import { decodeState } from "./storage";
import {
  initialState,
  respond,
  submitOffer,
  withdrawOffer,
  type InvitationDemoState,
} from "./transitions";

export const STORAGE_KEY = "cuways-job-invitations-demo-v1";
const EVENT = "cuways-job-invitations-demo-change";
let snapshot = initialState;
let lastStored: string | null | undefined;

export function getSnapshot(): InvitationDemoState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw !== lastStored) {
      snapshot = decodeState(raw);
      lastStored = raw;
    }
  } catch {
    // The preview remains usable in memory when browser storage is blocked.
  }
  return snapshot;
}

export function getServerSnapshot(): InvitationDemoState {
  return initialState;
}

export function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function save(state: InvitationDemoState) {
  snapshot = state;
  try {
    const serialized = JSON.stringify(state);
    sessionStorage.setItem(STORAGE_KEY, serialized);
    lastStored = serialized;
  } catch {
    // Do not discard edits when persistence is unavailable.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function resetInvitationsDemo() {
  save({ ...initialState, revision: getSnapshot().revision + 1 });
}

export const demoInvitationActions: InvitationActions = {
  async accept(id) {
    save(respond(getSnapshot(), id));
  },
  async decline(id, input) {
    save(respond(getSnapshot(), id, input));
  },
  async submit(id, input) {
    save(submitOffer(getSnapshot(), id, input));
  },
  async withdraw(id) {
    save(withdrawOffer(getSnapshot(), id));
  },
};
