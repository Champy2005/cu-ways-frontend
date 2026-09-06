import { browserApiRequest } from "@/lib/api/browser-client";
import type { UpdateUserRequest, User } from "@/features/users/types";

export function updateCurrentUser(input: UpdateUserRequest): Promise<User> {
  return browserApiRequest<User>("/api/profile", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
