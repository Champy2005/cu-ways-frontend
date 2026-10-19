import { Button } from "@/components/ui/button";

/**
 * Presentational only. Sending a custom job is a separate user story and needs a
 * backend endpoint that does not exist yet, so the control stays disabled rather
 * than pretending to work.
 */
export function SendCustomJobButton() {
  return (
    <Button
      size="lg"
      disabled
      title="Sending a custom job is not available yet"
      className="h-10 w-full rounded-xl bg-brand text-[15px] font-semibold text-brand-foreground hover:bg-brand/90"
    >
      Send Custom Job
    </Button>
  );
}
