"use client";

import { useCallback, useRef, useState } from "react";
import { ApiError } from "@/lib/api/errors";
import { reloadInvitations } from "./browser-api";
import { failureMessage } from "./failures";
import type { InvitationEntry } from "./types";

const savedRefreshWarning =
  "Your change was saved, but current data could not be refreshed. Refresh before taking another action.";

function reconcileEntries(previous: InvitationEntry[], current: InvitationEntry[]) {
  const knownOffers = new Map(previous.map((entry) => [entry.request.job_request_id, entry.offer]));
  return current.map((entry) =>
    entry.offersUnavailable
      ? { ...entry, offer: entry.offer ?? knownOffers.get(entry.request.job_request_id) ?? null }
      : entry,
  );
}

export function useInvitations(initial: InvitationEntry[], requestId?: string) {
  const [source, setSource] = useState(initial);
  const [entries, setEntries] = useState(initial);
  const [notice, setNotice] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [authStatus, setAuthStatus] = useState<number>();
  const [refreshedAt, setRefreshedAt] = useState<string>();
  const refreshSequence = useRef(0);
  const savedNeedsRefresh = useRef(false);
  if (source !== initial) {
    setSource(initial);
    setEntries((previous) => reconcileEntries(previous, initial));
    setRefreshedAt(undefined);
  }
  const refresh = useCallback(
    async (saved = false) => {
      const sequence = ++refreshSequence.current;
      if (saved) savedNeedsRefresh.current = true;
      setRefreshing(true);
      try {
        const current = await reloadInvitations(requestId);
        if (sequence !== refreshSequence.current) return false;
        setEntries((previous) => reconcileEntries(previous, current));
        setRefreshedAt(new Date().toISOString());
        setAuthStatus(undefined);
        if (current.some((entry) => entry.offersUnavailable)) {
          setBlocked(true);
          setNotice(
            savedNeedsRefresh.current
              ? savedRefreshWarning
              : "Offer details could not be refreshed. Please try again.",
          );
          return false;
        }
        savedNeedsRefresh.current = false;
        setBlocked(false);
        if (!saved) setNotice("");
        return true;
      } catch (error) {
        if (sequence !== refreshSequence.current) return false;
        setBlocked(true);
        if (error instanceof ApiError) setAuthStatus(error.status);
        setNotice(savedNeedsRefresh.current ? savedRefreshWarning : failureMessage(error));
        return false;
      } finally {
        if (sequence === refreshSequence.current) setRefreshing(false);
      }
    },
    [requestId],
  );
  async function recover(error: unknown) {
    setBlocked(true);
    if (error instanceof ApiError) setAuthStatus(error.status);
    await refresh();
    throw new Error(failureMessage(error));
  }
  return {
    entries,
    setEntries,
    notice,
    setNotice,
    blocked,
    refreshing,
    refreshedAt,
    authStatus,
    refresh,
    recover,
  };
}
