/** Provisional EPC-02 contracts. Replace with generated aliases after backend OpenAPI integration. */
export interface MarketerProfile {
  user_id: number;
  name: string;
  bio: string | null;
  experience_years: number | null;
  availability_text: string | null;
}

export type ProfileInput = Pick<MarketerProfile, "bio" | "experience_years" | "availability_text">;

export interface Service {
  service_id: number;
  user_id: number;
  service_type: string;
  scope_text: string | null;
  price: string;
  created_at: string;
}

export type ServiceInput = Pick<Service, "service_type" | "scope_text" | "price">;

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
