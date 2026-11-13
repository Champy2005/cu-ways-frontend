"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogContent,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { InlineError } from "@/components/feedback/inline-error";
import { deleteSurvey } from "@/features/surveys/browser-api";
import type { Survey } from "@/features/surveys/types";
import { ApiError, getDisplayError } from "@/lib/api/errors";

export function SurveyActions({ survey }: { survey: Survey }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const keepButton = useRef<HTMLButtonElement>(null);
  const deleteButton = useRef<HTMLButtonElement>(null);

  async function remove() {
    if (busy.current || uncertain) return;
    busy.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await deleteSurvey(survey.survey_id);
      if (!result.deleted || result.survey_id !== survey.survey_id) throw new Error();
      router.replace("/surveys");
      router.refresh();
    } catch (cause) {
      const unknown = !(cause instanceof ApiError) || cause.status >= 500;
      setUncertain(unknown);
      setError(
        unknown
          ? "Deletion could not be confirmed. Check My surveys before retrying."
          : getDisplayError(cause),
      );
      setOpen(false);
    } finally {
      setPending(false);
      busy.current = false;
    }
  }

  return (
    <div className="space-y-3">
      {error && <InlineError message={error} />}
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/surveys/${survey.survey_id}/edit`}
          className={buttonVariants({ variant: "outline" })}
        >
          Edit survey
        </Link>
        <Button
          ref={deleteButton}
          type="button"
          variant="destructive"
          disabled={uncertain}
          onClick={() => setOpen(true)}
        >
          Delete survey
        </Button>
      </div>
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          if (!pending) setOpen(next);
        }}
      >
        <AlertDialogContent initialFocus={keepButton} finalFocus={deleteButton}>
          <AlertDialogTitle>Delete survey?</AlertDialogTitle>
          <AlertDialogDescription>
            Delete “{survey.title}” from CU Ways. The external survey stays available. Surveys
            linked to a job cannot be deleted.
          </AlertDialogDescription>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel ref={keepButton} disabled={pending}>
              Keep survey
            </AlertDialogCancel>
            <Button variant="destructive" disabled={pending} onClick={() => void remove()}>
              {pending ? "Deleting…" : "Confirm deletion"}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
