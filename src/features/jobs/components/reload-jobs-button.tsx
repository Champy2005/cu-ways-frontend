"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";

export function ReloadJobsButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="link"
      disabled={pending}
      aria-busy={pending}
      onClick={() => startTransition(() => router.refresh())}
      className="mt-3 h-auto justify-start rounded-sm p-0 text-sm font-semibold text-inherit underline underline-offset-4"
    >
      {pending ? "Reloading jobs…" : "Reload your jobs"}
    </Button>
  );
}
