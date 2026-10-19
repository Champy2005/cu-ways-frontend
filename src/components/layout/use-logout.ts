"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { browserApiRequest } from "@/lib/api/browser-client";
import { getDisplayError } from "@/lib/api/errors";

export function useLogout() {
  const router = useRouter();
  const [isPending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  async function logout() {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      await browserApiRequest<null>("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (caught) {
      setError(getDisplayError(caught));
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }
  return { logout, isPending, error };
}
