"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { MarketerOfferItem, SavedOffer } from "./types";
import { MyOfferCard } from "./my-offer-card";
import { WithdrawOfferModal } from "./withdraw-offer-modal";
import { useMyOffers } from "./use-my-offers";
import { currentOfferIds } from "./offer-eligibility";
import "../invitations.css";
import "./presentation.css";

export type MyOffersInitialItem = MarketerOfferItem;
export type MyOffersPageProps = {
  initialOffers: MyOffersInitialItem[];
  offersUnavailable?: boolean;
};
const statuses = ["All", "Pending", "Accepted", "Withdrawn", "Rejected"] as const;
type OfferTab = (typeof statuses)[number];

function OffersFeedback({ state }: { state: ReturnType<typeof useMyOffers> }) {
  if (!state.error && !state.blocked) return null;
  return (
    <div className="my-4 space-y-2 text-sm">
      <p role="alert">
        {state.error ||
          "Some offers could not be loaded. Refresh offers before taking another action."}
      </p>
      {state.authStatus === 401 && (
        <Link href="/login" className="ji-accent underline">
          Sign in again
        </Link>
      )}
      {state.authStatus === 403 && (
        <Link href="/marketer/profile" className="ji-accent underline">
          Open marketer profile
        </Link>
      )}
    </div>
  );
}

export function MyOffersPage({ initialOffers, offersUnavailable = false }: MyOffersPageProps) {
  const state = useMyOffers(initialOffers, offersUnavailable);
  const [tab, setTab] = useState<OfferTab>("All");
  const [selection, setSelection] = useState<{ id: number; title: string } | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const selectedOffer = state.offers.find((item) => item.offer.offer_id === selection?.id)?.offer;
  const currentIds = currentOfferIds(state.offers);
  const filtered = state.offers.filter((item) => tab === "All" || item.offer.offer_status === tab);

  function openWithdrawal(offer: SavedOffer, title: string, element: HTMLElement) {
    trigger.current = element;
    state.setError(null);
    setSelection({ id: offer.offer_id, title });
  }
  function closeWithdrawal() {
    if (!state.pending) setSelection(null);
  }
  async function confirmWithdrawal() {
    if (selectedOffer && (await state.withdraw(selectedOffer.offer_id))) {
      trigger.current = null;
      setSelection(null);
    }
  }

  return (
    <section className="ji-page ji-live mx-auto w-full max-w-2xl py-6 text-[var(--mk-text)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/marketer/dashboard"
            aria-label="Back to dashboard"
            className="inline-flex size-9 items-center justify-center rounded-full hover:bg-[var(--mk-hover)]"
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </Link>
          <h1 ref={heading} tabIndex={-1} className="text-xl font-bold tracking-tight">
            My offers
          </h1>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={state.pending}
          onClick={() => void state.refresh()}
        >
          {state.pending && !selection ? "Refreshing…" : "Refresh offers"}
        </Button>
      </div>
      <p className="mt-3 text-xs text-[var(--mk-muted)]">
        You have {state.offers.length} offer{state.offers.length === 1 ? "" : "s"} on survey jobs
      </p>
      {state.notice && (
        <div
          role="status"
          className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[var(--mk-positive)] p-3 text-sm text-[var(--mk-positive)]"
        >
          <span>{state.notice}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => state.setNotice(null)}
          >
            ×
          </button>
        </div>
      )}
      {!selectedOffer && <OffersFeedback state={state} />}
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as OfferTab)}
        className="mt-4 min-w-0"
      >
        <TabsList
          variant="line"
          className="max-w-full justify-start overflow-x-auto"
          aria-label="Offer status"
        >
          {statuses.map((status) => (
            <TabsTrigger key={status} value={status}>
              {status} (
              {status === "All"
                ? state.offers.length
                : state.offers.filter((item) => item.offer.offer_status === status).length}
              )
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={tab} className="mt-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--mk-border)] p-8 text-center">
              <p className="text-sm text-[var(--mk-muted)]">
                {state.blocked
                  ? "Refresh offers to load the current list."
                  : state.offers.length === 0
                    ? "You haven't submitted any offers yet."
                    : "No " + tab.toLowerCase() + " offers."}
              </p>
              {state.offers.length === 0 && (
                <Link
                  href="/marketer/invitations"
                  className="ji-accent mt-4 inline-block underline"
                >
                  View invitations
                </Link>
              )}
            </div>
          ) : (
            filtered.map(({ offer, request }) => (
              <MyOfferCard
                key={offer.offer_id}
                offer={offer}
                request={request}
                isCurrent={currentIds.has(offer.offer_id)}
                disabled={state.blocked || state.pending}
                onWithdrawClick={openWithdrawal}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
      {selection && selectedOffer && (
        <WithdrawOfferModal
          isOpen
          offer={selectedOffer}
          jobTitle={selection.title}
          pending={state.pending}
          confirmDisabled={state.blocked || selectedOffer.offer_status !== "Pending"}
          error={state.error}
          onClose={closeWithdrawal}
          onConfirm={() => void confirmWithdrawal()}
          finalFocus={() => (trigger.current?.isConnected ? trigger.current : heading.current)}
        />
      )}
    </section>
  );
}
