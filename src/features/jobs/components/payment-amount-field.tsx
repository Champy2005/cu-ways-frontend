"use client";

import type { Ref } from "react";
import { Input } from "@/components/ui/input";
import { formatSatang } from "../payment";

const AMOUNT_ID = "payment-amount";
const HELP_ID = "payment-amount-help";
const ERROR_ID = "payment-amount-error";

export function PaymentAmountField({
  value,
  acceptedSatang,
  error,
  disabled,
  onChange,
  inputRef,
}: {
  value: string;
  acceptedSatang: number;
  error?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  inputRef?: Ref<HTMLInputElement>;
}) {
  return (
    <div>
      <label htmlFor={AMOUNT_ID} className="text-sm font-semibold">
        Amount <span className="font-normal text-[var(--mk-muted)]">(required)</span>
      </label>
      <div className="pay-money mt-2">
        <Input
          ref={inputRef}
          id={AMOUNT_ID}
          name="amount"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder={(acceptedSatang / 100).toFixed(2)}
          value={value}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${HELP_ID} ${ERROR_ID}` : HELP_ID}
          onChange={(event) => onChange(event.target.value)}
        />
        <span aria-hidden="true">THB</span>
      </div>
      <p id={HELP_ID} className="pay-help">
        Must match the accepted price of {formatSatang(acceptedSatang)}.
      </p>
      <div aria-live="polite">
        {error && (
          <p id={ERROR_ID} className="pay-error">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
