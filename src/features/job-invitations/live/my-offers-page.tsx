"use client";

import { SuccessToast } from "@/components/feedback/success-toast";
import { useRef, useState } from "react";
import Link from "next/link";
import { BackLink } from "@/components/ui/back-link";
import { SearchField } from "@/components/ui/search-field";
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
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<OfferTab>("All");
  const [selection, setSelection] = useState<{ id: number; title: string } | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const selectedOffer = state.offers.find((item) => item.offer.offer_id === selection?.id)?.offer;
  const currentIds = currentOfferIds(state.offers);
  const filtered = state.offers.filter(
    ({ offer, request }) =>
      (tab === "All" || offer.offer_status === tab) &&
      `${request.job.title ?? ""} ${request.job_id} ${request.job.creator.name} ${request.job.surveys.map((survey) => survey.title).join(" ")}`
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase()),
  );

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
    <section className="ji-page ji-live text-[var(--mk-text)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackLink href="/marketer/dashboard" label="Back to dashboard" />
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
      <p className="mb-5 text-sm text-[var(--mk-muted)]">
        You have {state.offers.length} offer{state.offers.length === 1 ? "" : "s"} on survey jobs
      </p>
      <SuccessToast message={state.notice} onDismiss={() => state.setNotice(null)} />
      {!selectedOffer && <OffersFeedback state={state} />}
      <Tabs value={tab} onValueChange={(value) => setTab(value as OfferTab)} className="min-w-0">
        <TabsList
          variant="line"
          className="ji-tabs max-w-full justify-start overflow-x-auto overflow-y-hidden"
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
        <SearchField
          label="Search offers by job or creator"
          className="mb-5"
          placeholder="Search job ID, survey title or creator"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <TabsContent value={tab}>
          <div className="ji-grid">
            {filtered.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-[var(--mk-border)] p-8 text-center">
                <p className="text-sm text-[var(--mk-muted)]">
                  {state.blocked
                    ? "Refresh offers to load the current list."
                    : search.trim()
                      ? "No offers match your search."
                      : state.offers.length === 0
                        ? "You haven't submitted any offers yet."
                        : "No " + tab.toLowerCase() + " offers."}
                </p>
                {state.offers.length === 0 && (
                  <Link
                    href="/marketer/invitations"
                    className="mk-primary-button mt-4 inline-flex min-h-12 w-full items-center justify-center px-4 text-sm font-semibold sm:w-auto"
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
          </div>
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
