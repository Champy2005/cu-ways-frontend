"use client";

import { CircleCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";

export type JobSuccessNotice =
  { kind: "created" } | { kind: "offer-accepted" } | { kind: "surveys-linked"; count: number };

function notificationContent(notice: JobSuccessNotice) {
  switch (notice.kind) {
    case "created":
      return {
        title: "Job created",
        message:
          "Your job has been created with Pending status. Marketers can now view and submit offers.",
      };
    case "offer-accepted":
      return {
        title: "Offer accepted",
        message: "A marketer's offer has been accepted. The job is now in progress.",
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
    <div
      role="status"
      className="relative flex items-center gap-2.5 rounded-[14px] border border-[var(--mk-success)] bg-[var(--mk-positive-soft)] p-3 shadow-card"
    >
      <CircleCheck aria-hidden="true" className="size-[18px] shrink-0 text-[var(--mk-success)]" />
      <div className="min-w-0 flex-1 text-xs text-[var(--mk-text)]">
        <p className="pr-5 font-bold">{title}</p>
        <p className="mt-0.5 pr-5 text-[11px] leading-4 text-[var(--mk-muted)]">{message}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={`Dismiss ${title.toLowerCase()} notification`}
        onClick={onDismiss}
        className="absolute top-1/2 right-2 -translate-y-1/2 text-[var(--mk-muted)]"
      >
        <X aria-hidden="true" className="size-3" />
      </Button>
    </div>
  );
}
