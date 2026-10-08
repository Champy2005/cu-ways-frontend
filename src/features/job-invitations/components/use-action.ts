"use client";

import { useCallback, useRef, useState } from "react";
import { createNotification, type FeatureNotification } from "../notifications";

export function useAction() {
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<FeatureNotification | null>(null);
  const dismissError = useCallback(() => setError(null), []);
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
        createNotification(
          caught instanceof Error ? caught.message : "Something went wrong. Please try again.",
          "error",
        ),
      );
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }
  return { pending, error, dismissError, run, isPending: () => inFlight.current };
}
