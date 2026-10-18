"use client";

import { useEffect, useRef } from "react";
import type { SavedOffer } from "./types";
import { formatPrice } from "../format";

export type WithdrawOfferModalProps = {
  isOpen: boolean;
  offer: SavedOffer;
  jobTitle: string;
  pending: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function WithdrawOfferModal({
  isOpen,
  offer,
  jobTitle,
  pending,
  error,
  onClose,
  onConfirm,
}: WithdrawOfferModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const keepButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    keepButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, pending, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="withdraw-offer-title"
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#161b26] p-6 text-[var(--mk-text)] shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      >
        <h2 id="withdraw-offer-title" className="text-center text-lg font-bold text-white">
          Withdraw this offer?
        </h2>

        {/* Inner Card (Figma Image 2) */}
        <div className="my-4 rounded-xl border border-white/5 bg-[#0f131d] p-3.5 space-y-2">
          <p className="text-sm font-semibold text-white truncate">{jobTitle}</p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Offered price</span>
            <span className="font-semibold text-white">{formatPrice(offer.offered_price)}</span>
          </div>
        </div>

        <p className="text-center text-xs leading-relaxed text-zinc-400">
          The creator will no longer be able to accept it. Your offer stays in your history, and you
          can send a new one for this job.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-center text-xs text-rose-300"
          >
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button
            ref={keepButtonRef}
            type="button"
            disabled={pending}
            onClick={onClose}
            className="flex-1 rounded-xl bg-[#4b5563] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#374151] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-50"
          >
            Keep offer
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-[#d94f57] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#c93f3f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-50"
          >
            {pending ? "Withdrawing…" : "Withdraw"}
          </button>
        </div>
      </div>
    </div>
  );
}
