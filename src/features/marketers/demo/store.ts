import type { ContactProfile, SaveContact } from "@/features/users/types";
import { validateContactUpdate } from "@/features/users/schemas";
import type { MarketerActions, MarketerProfile, MarketerStats, Service } from "../types";
import { validateProfileInput, validateServiceInput } from "../schemas";

export type DemoState = {
  contact: ContactProfile;
  profile: MarketerProfile;
  services: Service[];
  stats: MarketerStats;
  revision: number;
};
const STORAGE_KEY = "cuways-marketer-demo-v2";
const EVENT = "cuways-marketer-demo-change";
export const initialDemoState: DemoState = {
  contact: {
    user_id: 101,
    name: "Mali Srisai",
    email: "mali@example.test",
    phone: "0812345678",
    line_id: "mali.demo",
    created_at: "2026-08-01T09:00:00Z",
  },
  revision: 0,
  profile: {
    user_id: 101,
    name: "Mali Srisai",
    bio: "Connecting campus voices with meaningful research. I help survey creators reach the right students through thoughtful, personal outreach.",
    experience_years: 2,
    availability_status: "available",
    expertise: [],
    campuses: [],
    email: "mali@example.test",
    phone: "0812345678",
    line_id: "mali.demo",
    created_at: "2026-08-01T09:00:00Z",
    availability_text: "Weekdays after 4 pm · Weekends by arrangement",
  },
  services: [
    {
      service_id: 1,
      service_type: "On-Campus Distribution",
      scope_text:
        "Distribution channels: Campus common areas and faculty notice boards\nTarget respondents: Chulalongkorn undergraduate students\nExpected delivery: 30–50 responses over 3 days\nProof: Posting screenshots and distribution summary",
      price: "599.00",
      created_at: "2026-09-01T09:00:00Z",
    },
    {
      service_id: 2,
      service_type: "Online Campus Communities",
      scope_text:
        "Thoughtful sharing across student LINE communities. Includes two follow-up posts and a summary of outreach activity.",
      price: "350.00",
      created_at: "2026-09-02T09:00:00Z",
    },
  ],
  stats: { total_jobs_completed: 24, average_rating: 4.8, total_earnings: "12400.00" },
};

let snapshot = initialDemoState;
let lastStored: string | null | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validStoredProfile(value: unknown): value is MarketerProfile {
  if (!isRecord(value) || value.user_id !== 101 || typeof value.name !== "string") return false;
  return validateProfileInput({
    bio: value.bio,
    experience_years: value.experience_years,
    availability_text: value.availability_text,
    availability_status: value.availability_status,
    expertise: Array.isArray(value.expertise) ? value.expertise.map((option) => option.slug) : null,
    campuses: Array.isArray(value.campuses) ? value.campuses.map((option) => option.slug) : null,
  });
}

function validStoredService(value: unknown): value is Service {
  if (
    !isRecord(value) ||
    !Number.isSafeInteger(value.service_id) ||
    Number(value.service_id) < 1 ||
    typeof value.created_at !== "string"
  )
    return false;
  return validateServiceInput({
    service_type: value.service_type,
    scope_text: value.scope_text,
    price: value.price,
  });
}

export function decodeDemoState(raw: string | null): DemoState {
  if (!raw) return initialDemoState;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !isRecord(value) ||
      !validStoredProfile(value.profile) ||
      !Array.isArray(value.services) ||
      !value.services.every(validStoredService)
    )
      return initialDemoState;
    if (new Set(value.services.map((service) => service.service_id)).size !== value.services.length)
      return initialDemoState;
    return {
      contact: restoreContact(value.contact),
      profile: value.profile,
      services: value.services,
      stats: initialDemoState.stats,
      revision: 0,
    };
  } catch {
    return initialDemoState;
  }
}

export function getDemoSnapshot(): DemoState {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored !== lastStored) {
      snapshot = decodeDemoState(stored);
      lastStored = stored;
    }
  } catch {
    /* Preserve in-memory data if storage is blocked. */
  }
  return snapshot;
}

export function getServerDemoSnapshot() {
  return initialDemoState;
}

export function subscribeDemo(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function saveState(value: DemoState) {
  snapshot = value;
  try {
    const serialized = JSON.stringify(value);
    sessionStorage.setItem(STORAGE_KEY, serialized);
    lastStored = serialized;
  } catch {
    /* The demo remains usable for this page when storage is blocked. */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function resetDemo() {
  const previous = getDemoSnapshot();
  saveState({ ...initialDemoState, revision: previous.revision + 1 });
}

function requireService(id: number) {
  if (!getDemoSnapshot().services.some((service) => service.service_id === id))
    throw new Error("This service is no longer available. Refresh the catalog and try again.");
}

export const demoActions: MarketerActions = {
  async saveProfile(input) {
    if (!validateProfileInput(input)) throw new Error("Check your professional profile fields.");
    const current = getDemoSnapshot();
    const profile = {
      ...current.profile,
      ...input,
      expertise: current.profile.expertise,
      campuses: current.profile.campuses,
    };
    saveState({ ...current, profile });
    return profile;
  },
  async createService(input) {
    if (!validateServiceInput(input)) throw new Error("Check your service fields.");
    const current = getDemoSnapshot();
    const service: Service = {
      ...input,
      service_id: Math.max(0, ...current.services.map((entry) => entry.service_id)) + 1,
      created_at: new Date().toISOString(),
    };
    saveState({ ...current, services: [service, ...current.services] });
    return service;
  },
  async updateService(id, input) {
    requireService(id);
    if (!validateServiceInput(input)) throw new Error("Check your service fields.");
    const current = getDemoSnapshot();
    const service = { ...current.services.find((entry) => entry.service_id === id)!, ...input };
    saveState({
      ...current,
      services: current.services.map((entry) => (entry.service_id === id ? service : entry)),
    });
    return service;
  },
  async deleteService(id) {
    requireService(id);
    const current = getDemoSnapshot();
    saveState({
      ...current,
      services: current.services.filter((entry) => entry.service_id !== id),
    });
  },
};

function restoreContact(value: unknown): ContactProfile {
  if (!isRecord(value) || !validateContactUpdate({ phone: value.phone, line_id: value.line_id }))
    return initialDemoState.contact;
  return {
    ...initialDemoState.contact,
    phone: value.phone as string | null,
    line_id: value.line_id as string | null,
  };
}
export const saveDemoContact: SaveContact = async (input) => {
  if (!validateContactUpdate(input)) throw new Error("Check your contact fields.");
  const current = getDemoSnapshot();
  const contact = { ...current.contact, ...input };
  saveState({ ...current, contact });
  return contact;
};
