"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { Invitation, InvitationActions, Offer, OfferErrors, OfferInput } from "../types";
import { validateOffer } from "../validation";
import { bangkokDate, formatDate, formatPrice } from "../format";
import { Confirmation } from "./confirmation";
import { OfferFields } from "./offer-fields";
import { Feedback, JobSummary, PageHeading, OfferStatusText } from "./shared";
import { NotificationToast } from "./notification-toast";
import { useAction } from "./use-action";
import "../invitations.css";

const emptyInput: OfferInput = { price: "", deliveryDate: "", message: "" };

function OfferForm({
  request,
  offer,
  actions,
  onBack,
  onSubmitted,
  onWithdrawn,
  minimumDate,
}: {
  request: Invitation;
  offer?: Offer;
  actions: InvitationActions;
  onBack: () => void;
  onSubmitted: (price: string) => void;
  onWithdrawn: () => void;
  minimumDate: string;
}) {
  const id = useId();
  const [values, setValues] = useState<OfferInput>(() =>
    offer
      ? { price: offer.price, deliveryDate: offer.deliveryDate, message: offer.message }
      : emptyInput,
  );
  const [touched, setTouched] = useState<Partial<Record<keyof OfferInput, boolean>>>({});
  const [dialog, setDialog] = useState<"discard" | "withdraw" | null>(null);
  const action = useAction();
  const form = useRef<HTMLFormElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const withdrawButton = useRef<HTMLButtonElement>(null);
  const errors = offer ? {} : validateOffer(values, request.job.deadline, minimumDate);
  const visibleErrors: OfferErrors = Object.fromEntries(
    Object.entries(errors).filter(([field]) => touched[field as keyof OfferInput]),
  );
  const dirty = !offer && Object.values(values).some((value) => value !== "");
  function cancel() {
    if (action.isPending()) return;
    if (dirty) setDialog("discard");
    else onBack();
  }
  function update(key: keyof OfferInput, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (offer || action.isPending()) return;
    setTouched({ price: true, deliveryDate: true, message: true });
    if (Object.keys(errors).length) {
      requestAnimationFrame(() =>
        form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    void action.run(
      () => actions.submit(request.id, values),
      () => onSubmitted(values.price.trim()),
    );
  }
  return (
    <section className="ji-page ji-offer-page">
      <PageHeading title={offer ? "Your Offer" : "Submit Your Offer"} onBack={cancel} />
      {offer && (
        <div className="ji-existing" role="status">
          <OfferStatusText status={offer.status} />
          <strong>
            {offer.status === "Withdrawn" ? "Withdrawal is final" : "Offer already submitted"}
          </strong>
          <p>
            You submitted {formatPrice(offer.price)} on {formatDate(offer.createdAt)}. Only one
            offer per invitation is allowed, including withdrawn offers.
          </p>
          {offer.withdrawnAt && (
            <p>Withdrawn {formatDate(offer.withdrawnAt)}. This action is final.</p>
          )}
        </div>
      )}
      <JobSummary job={request.job} />
      <form ref={form} onSubmit={submit} noValidate>
        <fieldset disabled={action.pending}>
          <legend className="sr-only">Custom price offer</legend>
          <OfferFields
            values={values}
            job={request.job}
            errors={visibleErrors}
            readOnly={Boolean(offer)}
            id={id}
            update={update}
            onBlur={(key) => setTouched((current) => ({ ...current, [key]: true }))}
            minimumDate={minimumDate}
          />
        </fieldset>
        {!dialog && (
          <NotificationToast notification={action.error} onDismiss={action.dismissError} />
        )}
        <div className="ji-actions">
          {offer?.status === "Pending" ? (
            <Button
              ref={withdrawButton}
              type="button"
              variant="outline"
              className="ji-decline"
              disabled={action.pending}
              onClick={() => setDialog("withdraw")}
            >
              Withdraw Offer
            </Button>
          ) : (
            <Button
              ref={cancelButton}
              type="button"
              variant="outline"
              className="ji-secondary"
              disabled={action.pending}
              onClick={cancel}
            >
              {offer ? "Back to Invitations" : "Cancel"}
            </Button>
          )}
          {offer ? (
            <Button type="button" className="ji-primary" onClick={onBack} disabled={action.pending}>
              Close
            </Button>
          ) : (
            <Button
              type="submit"
              className="ji-primary"
              disabled={action.pending || Object.keys(errors).length > 0}
            >
              {action.pending ? "Submitting…" : "Submit Offer"}
            </Button>
          )}
        </div>
      </form>
      {dialog === "discard" && (
        <Confirmation
          title="Discard your offer draft?"
          description="Your unsaved price, delivery date, and message will be lost."
          confirmLabel="Discard Draft"
          cancelLabel="Keep Editing"
          destructive
          onClose={() => setDialog(null)}
          onConfirm={onBack}
          finalFocus={() => cancelButton.current}
        />
      )}
      {dialog === "withdraw" && (
        <Confirmation
          title="Withdraw Offer?"
          description="The creator will no longer be able to accept this offer. Withdrawal is final, and you cannot submit another offer for this invitation."
          confirmLabel="Withdraw Offer"
          destructive
          pending={action.pending}
          error={action.error}
          onDismissError={action.dismissError}
          onClose={() => {
            if (!action.isPending()) setDialog(null);
          }}
          onConfirm={() => {
            void action.run(
              () => actions.withdraw(request.id),
              () => {
                setDialog(null);
                onWithdrawn();
              },
            );
          }}
          finalFocus={() => withdrawButton.current}
        />
      )}
    </section>
  );
}

export function OfferPage({
  request,
  offer,
  actions,
  onBack,
  onSubmitted,
  onWithdrawn = onBack,
  minimumDate = bangkokDate(),
}: {
  request?: Invitation;
  offer?: Offer;
  actions: InvitationActions;
  onBack: () => void;
  onSubmitted: (price: string) => void;
  onWithdrawn?: () => void;
  minimumDate?: string;
}) {
  if (!request || request.status !== "Accepted")
    return (
      <section className="ji-page ji-offer-page">
        <PageHeading title="Submit Your Offer" onBack={onBack} />
        <Feedback error>
          {request
            ? "Accept this invitation before submitting an offer. Declined or closed invitations cannot receive offers."
            : "Choose an accepted invitation to create or view an offer. This invitation could not be found."}
        </Feedback>
        <Button variant="outline" className="ji-secondary" onClick={onBack}>
          Back to Invitations
        </Button>
      </section>
    );
  return (
    <OfferForm
      key={request.id}
      request={request}
      offer={offer}
      actions={actions}
      onBack={onBack}
      onSubmitted={onSubmitted}
      onWithdrawn={onWithdrawn}
      minimumDate={minimumDate}
    />
  );
}
