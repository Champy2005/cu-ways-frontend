"use client";

import { SuccessToast } from "@/components/feedback/success-toast";

export type JobSuccessNotice =
  | { kind: "created" }
  | { kind: "updated" }
  | { kind: "offer-accepted" }
  | { kind: "surveys-linked"; count: number }
  | { kind: "brief-updated" };

function notificationContent(notice: JobSuccessNotice) {
  switch (notice.kind) {
    case "updated":
      return { title: "Job updated successfully", message: null };
    case "brief-updated":
      return { title: "Project brief updated successfully", message: null };
    case "created":
      return {
        title: "Job created",
        message:
          "Your job has been created with Pending status. Invite marketers to receive their offers.",
      };
    case "offer-accepted":
      return {
        title: "Offer accepted",
        message: "The offer was accepted. Work can start with this marketer.",
      };
    case "surveys-linked":
      return {
        title: "Surveys linked",
        message: `${notice.count} ${notice.count === 1 ? "survey is" : "surveys are"} available to marketers in this job.`,
      };
  }
}

export function JobSuccessNotification({
  notice,
  onDismiss,
}: {
  notice?: JobSuccessNotice | null;
  onDismiss?: () => void;
}) {
  if (!notice) return null;
  const { title, message } = notificationContent(notice);
  return (
    <SuccessToast
      title={message ? title : undefined}
      message={message ?? title}
      onDismiss={onDismiss}
    />
  );
}
