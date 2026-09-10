import { browserApiRequest } from "@/lib/api/browser-client";
import { readMarketerProfile, readService } from "@/features/marketers/contracts";
import type { MarketerActions } from "@/features/marketers/types";

export const liveMarketerActions: MarketerActions = {
  async saveProfile(input) {
    return readMarketerProfile(
      await browserApiRequest<unknown>("/api/marketer", {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    );
  },
  async createService(input) {
    return readService(
      await browserApiRequest<unknown>("/api/services", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    );
  },
  async updateService(id, input) {
    return readService(
      await browserApiRequest<unknown>(`/api/services/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    );
  },
  async deleteService(id) {
    await browserApiRequest<void>(`/api/services/${id}`, { method: "DELETE" });
  },
};
