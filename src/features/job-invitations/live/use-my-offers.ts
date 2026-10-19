"use client";

import { useRef, useState } from "react";
import { ApiError, getDisplayError } from "@/lib/api/errors";
import { reloadMarketerOffers, withdrawOffer } from "./browser-api";
import type { MarketerOfferItem, MarketerOffersSnapshot } from "./types";

function withdrawalMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Your session expired. Please sign in again.";
    if (error.status === 403) return "You no longer have permission to withdraw this offer.";
    if (error.status === 409)
      return "This offer can no longer be withdrawn. Check its current status before trying again.";
  }
  return "The withdrawal could not be confirmed. Check the current offer status before trying again.";
}

function reconcileOffers(previous: MarketerOfferItem[], snapshot: MarketerOffersSnapshot) {
  if (!snapshot.offersUnavailable) return snapshot.offers;
  const known = new Map(previous.map((item) => [item.offer.offer_id, item]));
  for (const item of snapshot.offers) known.set(item.offer.offer_id, item);
  return [...known.values()];
}

export function useMyOffers(initialOffers: MarketerOfferItem[], offersUnavailable: boolean) {
  const [source, setSource] = useState({ offers: initialOffers, offersUnavailable });
  const [offers, setOffers] = useState(initialOffers);
  const [blocked, setBlocked] = useState(offersUnavailable);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<number>();
  const inFlight = useRef(false);

  if (source.offers !== initialOffers || source.offersUnavailable !== offersUnavailable) {
    setSource({ offers: initialOffers, offersUnavailable });
    setOffers((previous) =>
      reconcileOffers(previous, { offers: initialOffers, offersUnavailable }),
    );
    setBlocked(offersUnavailable);
    setAuthStatus(undefined);
    setError(null);
    setNotice(null);
  }

  async function readCurrent() {
    const snapshot = await reloadMarketerOffers();
    setOffers((previous) => reconcileOffers(previous, snapshot));
    setBlocked(snapshot.offersUnavailable);
    setAuthStatus(undefined);
  }

  function refreshFailure(caught: unknown) {
    setBlocked(true);
    if (caught instanceof ApiError) setAuthStatus(caught.status);
    setError("Current offers could not be loaded. " + getDisplayError(caught));
  }

  async function refresh() {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setNotice(null);
    setError(null);
    try {
      await readCurrent();
    } catch (caught) {
      refreshFailure(caught);
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  async function withdraw(offerId: number): Promise<boolean> {
    if (
      inFlight.current ||
      blocked ||
      !offers.some(
        (item) => item.offer.offer_id === offerId && item.offer.offer_status === "Pending",
      )
    )
      return false;
    inFlight.current = true;
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await withdrawOffer(offerId);
      setOffers((previous) =>
        previous.map((item) =>
          item.offer.offer_id === updated.offer_id ? { ...item, offer: updated } : item,
        ),
      );
      setNotice(
        "Offer withdrawn successfully. You can submit a new offer if the job is still open.",
      );
      return true;
    } catch (caught) {
      setBlocked(true);
      setError(withdrawalMessage(caught));
      if (caught instanceof ApiError && [401, 403].includes(caught.status)) {
        setAuthStatus(caught.status);
      } else {
        try {
          await readCurrent();
        } catch (refreshError) {
          refreshFailure(refreshError);
        }
      }
      return false;
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return {
    offers,
    blocked,
    pending,
    error,
    notice,
    authStatus,
    refresh,
    withdraw,
    setError,
    setNotice,
  };
}
