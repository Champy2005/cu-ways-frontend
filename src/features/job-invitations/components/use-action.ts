"use client";

import { useRef, useState } from "react";

export function useAction() {
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run(action: () => Promise<void>, onSuccess: () => void) {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      await action();
      onSuccess();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Something went wrong. Please try again.",
      );
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }
  return { pending, error, run, isPending: () => inFlight.current };
}
