"use client";

import { formatSatang, type PaymentMethod } from "../payment";
import { ConfirmSaveDialog } from "./confirm-save-dialog";

export function PaymentConfirmDialog({
  marketerName,
  method,
  amountSatang,
  ...dialog
}: {
  marketerName: string;
  method: PaymentMethod;
  amountSatang: number;
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
  finalFocus: () => HTMLElement | null;
}) {
  return (
    <ConfirmSaveDialog
      {...dialog}
      title="Record this payment?"
      description="The payment will be saved as Paid for this job. Check the details before you confirm; a recorded payment cannot be edited here."
      savingNote="Recording the payment."
      confirmLabel="Confirm record"
      pendingLabel="Recording…"
    >
      <dl className="pay-details">
        <div>
          <dt>Marketer</dt>
          <dd>{marketerName}</dd>
        </div>
        <div>
          <dt>Method</dt>
          <dd>{method}</dd>
        </div>
        <div>
          <dt>Amount</dt>
          <dd>{formatSatang(amountSatang)}</dd>
        </div>
      </dl>
      <p className="jo-muted mt-3">This records a payment only. No money is collected or moved.</p>
    </ConfirmSaveDialog>
  );
}
