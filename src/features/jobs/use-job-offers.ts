"use client";

import { useRef, useState } from "react";
import { acceptJobOffer, refreshJobOffers, type JobOffersSnapshot } from "./offer-actions";
import type { JobOffersInitialData } from "./api";

export function useJobOffers(initial: JobOffersInitialData) {
  const [data, setData] = useState<JobOffersSnapshot>({
    job: initial.job,
    offers: initial.offers.status === "success" ? initial.offers.items : [],
  });
  const [loadError, setLoadError] = useState(
    initial.offers.status === "error" ? initial.offers.message : undefined,
  );
  const [notice, setNotice] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [locked, setLocked] = useState(initial.offers.status === "error");
  const [pending, setPending] = useState(false);
  const [revision, setRevision] = useState(0);
  const busy = useRef(false);

  function applySnapshot(snapshot: JobOffersSnapshot) {
    setData(snapshot);
    setLoadError(undefined);
    setLocked(false);
    setRevision((current) => current + 1);
  }

  async function refresh() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    try {
      const result = await refreshJobOffers(data.job.job_id);
      if (result.status === "ready") {
        applySnapshot(result.data);
        setNotice({ kind: "success", message: "Offers are up to date." });
      } else {
        setLocked(true);
        setNotice({ kind: "error", message: result.message });
      }
    } catch {
      setLocked(true);
      setNotice({
        kind: "error",
        message: "Offers could not be refreshed. Check your connection and try again.",
      });
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  async function accept(offerId: number) {
    if (busy.current || locked || data.job.job_status !== "Pending") return;
    busy.current = true;
    setPending(true);
    try {
      const result = await acceptJobOffer(data.job.job_id, offerId);
      if (result.status === "accepted" || result.status === "conflict") {
        applySnapshot(result.data);
        setNotice(
          result.status === "accepted"
            ? {
                kind: "success",
                message:
                  "Offer accepted. Your marketer is hired, and competing pending offers have been rejected.",
              }
            : { kind: "error", message: result.message },
        );
      } else {
        setLocked(true);
        setNotice({ kind: "error", message: result.message });
      }
    } catch {
      setLocked(true);
      setNotice({
        kind: "error",
        message:
          "The result of your request is unknown. Refresh offers before making another decision.",
      });
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return { data, loadError, notice, locked, pending, revision, refresh, accept };
}
