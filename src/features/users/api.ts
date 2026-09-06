import { serverApiGet } from "@/lib/api/server-client";
import type { User, UserList } from "@/features/users/types";

export function getUser(userID: number): Promise<User> {
  return serverApiGet<User>(`/api/v1/users/${userID}`);
}

export function listUsers(page = 1, pageSize = 20): Promise<UserList> {
  const query = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  return serverApiGet<UserList>(`/api/v1/users?${query.toString()}`);
}
