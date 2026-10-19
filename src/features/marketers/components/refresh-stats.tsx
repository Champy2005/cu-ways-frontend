"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function RefreshStats() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      className="mk-button mt-5 px-5"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      {pending ? "Refreshing…" : "Retry performance summary"}
    </Button>
  );
}
