import type { components } from "@/lib/api/generated/backend";

export type User = components["schemas"]["User"];
export type UserList = components["schemas"]["UserListResponse"]["data"];
export type UpdateUserRequest = Pick<
  components["schemas"]["UpdateUserRequest"],
  "phone" | "line_id"
>;

export type ContactProfile = Pick<
  User,
  "user_id" | "name" | "email" | "phone" | "line_id" | "created_at"
>;
export type SaveContact = (input: UpdateUserRequest) => Promise<ContactProfile>;
