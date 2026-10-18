"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import type { ReceivedRequest, SavedOffer } from "./types";
import { MyOfferCard } from "./my-offer-card";
import { WithdrawOfferModal } from "./withdraw-offer-modal";
import { withdrawOffer } from "./browser-api";
import { ApiError } from "@/lib/api/errors";

export type MyOffersInitialItem = {
  offer: SavedOffer;
  request: ReceivedRequest;
};

export type MyOffersPageProps = {
  initialOffers: MyOffersInitialItem[];
  offersUnavailable?: boolean;
};

export function MyOffersPage({ initialOffers, offersUnavailable = false }: MyOffersPageProps) {
  const [offersList, setOffersList] = useState<MyOffersInitialItem[]>(initialOffers);
  const [selectedOffer, setSelectedOffer] = useState<{
    offer: SavedOffer;
    title: string;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleWithdrawClick(offer: SavedOffer, title: string) {
    setModalError(null);
    setSelectedOffer({ offer, title });
  }

  function handleCloseModal() {
    if (pending) return;
    setSelectedOffer(null);
    setModalError(null);
  }

  async function handleConfirmWithdraw() {
    if (!selectedOffer || pending) return;
    setPending(true);
    setModalError(null);

    try {
      const updatedOffer = await withdrawOffer(selectedOffer.offer.offer_id);
      // Update local state to reflect the Withdrawn status
      setOffersList((prev) =>
        prev.map((item) =>
          item.offer.offer_id === updatedOffer.offer_id ? { ...item, offer: updatedOffer } : item,
        ),
      );
      setSelectedOffer(null);
      setNotice({
        type: "success",
        text: "Offer withdrawn successfully. You can resubmit a new offer anytime.",
      });
    } catch (err) {
      if (err instanceof ApiError && err.code === "offer_not_pending") {
        setModalError(
          "Only a pending offer can be withdrawn. The creator may have already accepted or rejected this offer.",
        );
      } else if (err instanceof ApiError && err.status === 401) {
        setModalError("Your session expired. Please sign in again.");
      } else {
        setModalError("Could not withdraw offer. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6 text-[var(--mk-text)] sm:px-6">
      {/* Top Header matching Figma Image 1 */}
      <div className="flex items-center gap-3">
        <Link
          href="/marketer/dashboard"
          aria-label="Back to dashboard"
          className="inline-flex size-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-white">My offers</h1>
      </div>

      {/* Subtitle */}
      <p className="mt-3 text-xs text-[var(--mk-muted,#8f96a3)]">
        You have {offersList.length} offer{offersList.length === 1 ? "" : "s"} on survey jobs
      </p>

      {/* Global Alerts / Toasts */}
      {notice && (
        <div
          role="status"
          className={`mt-4 flex items-center justify-between gap-2 rounded-xl p-3 text-xs ${
            notice.type === "success"
              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border border-rose-500/30 bg-rose-500/10 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === "success" ? (
              <CheckCircle2 className="size-4 shrink-0" />
            ) : (
              <AlertCircle className="size-4 shrink-0" />
            )}
            <span>{notice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-white/60 hover:text-white font-bold ml-2 text-sm"
          >
            ×
          </button>
        </div>
      )}

      {offersUnavailable && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300"
        >
          Some offers could not be loaded from the server. Please refresh the page.
        </div>
      )}

      {/* Offers Cards List */}
      <div className="mt-4 space-y-3">
        {offersList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
            <p className="text-sm text-zinc-400">You haven&apos;t submitted any offers yet.</p>
            <Link
              href="/marketer/invitations"
              className="mt-4 inline-block rounded-xl bg-pink-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-pink-700"
            >
              View invitations
            </Link>
          </div>
        ) : (
          offersList.map(({ offer, request }) => (
            <MyOfferCard
              key={offer.offer_id}
              offer={offer}
              request={request}
              onWithdrawClick={handleWithdrawClick}
            />
          ))
        )}
      </div>

      {/* Withdraw Confirmation Modal */}
      {selectedOffer && (
        <WithdrawOfferModal
          isOpen={Boolean(selectedOffer)}
          offer={selectedOffer.offer}
          jobTitle={selectedOffer.title}
          pending={pending}
          error={modalError}
          onClose={handleCloseModal}
          onConfirm={handleConfirmWithdraw}
        />
      )}
    </div>
  );
}
