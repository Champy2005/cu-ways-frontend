import type { components } from "@/lib/api/generated/backend";

export type User = components["schemas"]["User"];
export type UserList = components["schemas"]["UserListResponse"]["data"];
export type UpdateUserRequest = Pick<
  components["schemas"]["UpdateUserRequest"],
  "phone" | "line_id"
>;
