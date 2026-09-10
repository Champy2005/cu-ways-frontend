import type { components } from "@/lib/api/generated/backend";

export type MarketerProfile = components["schemas"]["MarketerProfile"];
export type ProfileInput = components["schemas"]["MarketerProfileRequest"];
export type Service = components["schemas"]["Service"];
export type ServiceInput = Required<components["schemas"]["CreateServiceRequest"]>;

/** Preview-only contracts until dedicated backend endpoints are published. */
export interface MarketerStats {
  total_jobs_completed: number;
  average_rating: number;
  total_earnings: string;
}

export interface PublicCatalog {
  marketer: { user_id: number; name: string };
  services: Service[];
}

export interface MarketerActions {
  saveProfile(input: ProfileInput): Promise<MarketerProfile>;
  createService(input: ServiceInput): Promise<Service>;
  updateService(id: number, input: ServiceInput): Promise<Service>;
  deleteService(id: number): Promise<void>;
}

export type FormResult<T> =
  { success: true; data: T } | { success: false; errors: Partial<Record<keyof T, string>> };
