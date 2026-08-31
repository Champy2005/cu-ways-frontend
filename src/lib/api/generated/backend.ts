/**
 * Backend API contract types.
 *
 * These types mirror backend/docs/openapi.yaml. Keep this file isolated from
 * UI code so it can be replaced by an OpenAPI generator without changing
 * feature APIs.
 */

export interface User {
  user_id: number;
  name: string;
  email: string;
  phone: string | null;
  line_id: string | null;
  created_at: string;
}

export interface UserList {
  items: User[];
  page: number;
  page_size: number;
  total: number;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  line_id?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export type AuthenticatedUser = User;

export interface BackendAuthData {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  user: AuthenticatedUser;
}

export interface AuthSessionData {
  token_type: "Bearer";
  expires_in: number;
  user: AuthenticatedUser;
}

export interface SuccessEnvelope<T> {
  status: "success";
  data: T;
}

export interface ErrorEnvelope {
  status: "error";
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
