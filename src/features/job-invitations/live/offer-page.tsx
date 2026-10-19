"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { OfferInput } from "../types";
import { bangkokDate, formatDate, formatPrice } from "../format";
import { Confirmation } from "../components/confirmation";
import { PageHeading } from "../components/shared";
import { NotificationToast } from "../components/notification-toast";
import { useAction } from "../components/use-action";
import { submitInvitationOffer } from "./browser-api";
import { JobDetails } from "./job-details";
import { JobIdentity, LiveOfferStatus } from "./presentation";
import { LiveOfferFields } from "./offer-fields";
import { StatusFeedback } from "./status-feedback";
import { offerErrors } from "./validation";
import { useInvitations } from "./use-invitations";
import { canResubmitOffer } from "./offer-eligibility";
import type { InvitationEntry, SavedOffer } from "./types";
import "../invitations.css";
import "./presentation.css";

export function submissionUnavailable(entry: InvitationEntry, today: string): string | null {
  if (entry.offersUnavailable)
    return "Offers could not be loaded. Refresh before submitting an offer.";
  if (entry.request.request_status !== "Accepted")
    return "Accept this invitation before submitting an offer. Declined or closed invitations cannot receive offers.";
  if (entry.request.job.job_status !== "Pending") return "This job is no longer accepting offers.";
  const deadline = entry.request.job.deadline;
  if (deadline && bangkokDate(deadline) < today)
    return "The job deadline has passed. There is no valid delivery date for a new offer.";
  if (entry.offer && !canResubmitOffer(entry.offer, entry.request, today))
    return "An offer has already been submitted for this invitation.";
  return null;
}

function OfferSummary({
  entry,
  unavailable,
}: {
  entry: InvitationEntry;
  unavailable: string | null;
}) {
  const offer = entry.offer;
  if (offer && canResubmitOffer(offer, entry.request)) {
    return (
      <div
        data-testid="offer-withdrawn-banner"
        className="rounded-xl border border-[var(--mk-border)] bg-[var(--mk-field)] p-4 text-sm text-[var(--mk-text)] shadow-sm"
      >
        <p className="font-semibold">Offer withdrawn</p>
        <p className="mt-1 text-[var(--mk-muted)]">
          Your previous offer of {formatPrice(offer.offered_price)} was withdrawn. You can submit a
          new one below.
        </p>
      </div>
    );
  }
  if (offer)
    return (
      <div className="ji-existing" role="status" data-offer-status={offer.offer_status}>
        <LiveOfferStatus status={offer.offer_status} />
        <p>
          You submitted {formatPrice(offer.offered_price)} on {formatDate(offer.created_at)}.
        </p>
        <p>This saved offer is read-only.</p>
        {offer.offer_status === "Withdrawn" && unavailable && <p>{unavailable}</p>}
      </div>
    );
  if (unavailable && !entry.offersUnavailable)
    return (
      <p role="alert" className="ji-inset">
        {unavailable}
      </p>
    );
  return null;
}

function initialDraft(offer: SavedOffer | null, canResubmit: boolean): OfferInput {
  if (canResubmit && offer) {
    return {
      price: offer.offered_price,
      deliveryDate: offer.delivery_date ?? "",
      message: offer.message ?? "",
    };
  }
  return { price: "", deliveryDate: "", message: "" };
}

function resolveValues(
  isReadOnly: boolean,
  offer: SavedOffer | null,
  draft: OfferInput,
): OfferInput {
  if (isReadOnly && offer) {
    return {
      price: offer.offered_price,
      deliveryDate: offer.delivery_date ?? "",
      message: offer.message ?? "",
    };
  }
  return draft;
}

function OfferActionsRow({
  isReadOnly,
  pending,
  submitDisabled,
  onCancel,
  backButtonRef,
}: {
  isReadOnly: boolean;
  pending: boolean;
  submitDisabled: boolean;
  onCancel: () => void;
  backButtonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const backAppearance = isReadOnly
    ? ({ variant: "default", className: "ji-primary" } as const)
    : ({ variant: "outline", className: "ji-secondary" } as const);

  return (
    <div className="ji-actions">
      <Button
        ref={backButtonRef}
        type="button"
        {...backAppearance}
        onClick={onCancel}
        disabled={pending}
      >
        {isReadOnly ? "Back to Invitations" : "Cancel"}
      </Button>
      {!isReadOnly && (
        <Button type="submit" className="ji-primary" disabled={submitDisabled}>
          {pending ? "Submitting…" : "Submit Offer"}
        </Button>
      )}
    </div>
  );
}

export function LiveOfferPage({ initial }: { initial: InvitationEntry[] }) {
  const router = useRouter();
  const requestId = String(initial[0].request.job_request_id);
  const state = useInvitations(initial, requestId);
  const entry = state.entries[0];
  const { request, offer } = entry;
  const canResubmit = canResubmitOffer(offer, request);
  const isReadOnly = Boolean(offer && !canResubmit);
  const [draft, setDraft] = useState<OfferInput>(() => initialDraft(offer, canResubmit));
  const [seededOffer, setSeededOffer] = useState(canResubmit ? offer?.offer_id : undefined);
  if (canResubmit && offer && seededOffer !== offer.offer_id) {
    setSeededOffer(offer.offer_id);
    setDraft(initialDraft(offer, true));
  }
  const [touched, setTouched] = useState<Partial<Record<keyof OfferInput, boolean>>>({});
  const [discard, setDiscard] = useState(false);
  const action = useAction();
  const form = useRef<HTMLFormElement>(null);
  const backButton = useRef<HTMLButtonElement>(null);
  const today = bangkokDate();
  const deadline = request.job.deadline ? bangkokDate(request.job.deadline) : null;
  const unavailable = submissionUnavailable(entry, today);
  const values = resolveValues(isReadOnly, offer, draft);
  const errors = isReadOnly ? {} : offerErrors(draft, today, deadline);
  const visibleErrors = Object.fromEntries(
    Object.entries(errors).filter(([key]) => touched[key as keyof OfferInput]),
  );

  function back() {
    router.push("/marketer/invitations?tab=responded");
    router.refresh();
  }

  function cancel() {
    if (action.isPending()) return;
    if (!isReadOnly && Object.values(draft).some(Boolean)) setDiscard(true);
    else back();
  }

  async function save() {
    try {
      const saved = await submitInvitationOffer(request.job_request_id, draft);
      state.setEntries((current) =>
        current.map((item) => ({ ...item, offer: saved, offersUnavailable: false })),
      );
    } catch (error) {
      return state.recover(error);
    }
    state.setNotice("Offer submitted successfully. Your proposed price has been sent for review.");
    await state.refresh(true);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (action.isPending() || state.blocked || unavailable) return;
    setTouched({ price: true, deliveryDate: true, message: true });
    if (Object.keys(errors).length) {
      requestAnimationFrame(() =>
        form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    void action.run(save, () => setTouched({}));
  }

  const fieldsetDisabled =
    action.pending || (!isReadOnly && (state.blocked || Boolean(unavailable)));
  const submitDisabled =
    action.pending || state.blocked || Boolean(unavailable) || Object.keys(errors).length > 0;

  return (
    <section className="ji-page ji-offer-page ji-live">
      <PageHeading title={isReadOnly ? "Your Offer" : "Submit Your Offer"} onBack={cancel} />
      <StatusFeedback
        message={state.notice}
        status={state.authStatus}
        retry={state.blocked || entry.offersUnavailable}
        pending={action.pending || state.refreshing}
        onDismiss={() => state.setNotice("")}
        onRefresh={() => void state.refresh()}
      />
      <OfferSummary entry={entry} unavailable={unavailable} />
      <Card className="ji-card">
        <CardContent className="ji-summary ji-live-summary">
          <JobIdentity request={request} />
          <p className="ji-creator">{request.job.creator.name}</p>
          <JobDetails request={request} compact />
        </CardContent>
      </Card>
      <form ref={form} onSubmit={submit} noValidate>
        <fieldset disabled={fieldsetDisabled}>
          <legend className="sr-only">Custom price offer</legend>
          <LiveOfferFields
            values={values}
            errors={visibleErrors}
            readOnly={isReadOnly}
            today={today}
            deadline={deadline}
            onChange={(key, value) => setDraft((current) => ({ ...current, [key]: value }))}
            onBlur={(key) => setTouched((current) => ({ ...current, [key]: true }))}
          />
        </fieldset>
        <NotificationToast notification={action.error} onDismiss={action.dismissError} />
        <OfferActionsRow
          isReadOnly={isReadOnly}
          pending={action.pending}
          submitDisabled={submitDisabled}
          onCancel={cancel}
          backButtonRef={backButton}
        />
      </form>
      {discard && (
        <Confirmation
          title="Discard your offer draft?"
          description="Your unsaved price, delivery date, and message will be lost."
          confirmLabel="Discard Draft"
          cancelLabel="Keep Editing"
          destructive
          onClose={() => setDiscard(false)}
          onConfirm={back}
          finalFocus={() => backButton.current}
        />
      )}
    </section>
  );
}
