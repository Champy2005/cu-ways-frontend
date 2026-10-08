export type FeatureNotification = {
  id: number;
  message: string;
  kind: "success" | "error";
};

let nextId = 0;
export function createNotification(
  message: string,
  kind: FeatureNotification["kind"],
): FeatureNotification {
  return { id: ++nextId, message, kind };
}
