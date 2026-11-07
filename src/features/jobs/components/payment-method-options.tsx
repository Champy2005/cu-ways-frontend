"use client";

import type { Ref } from "react";
import { CreditCard, Landmark, Smartphone } from "lucide-react";
import { PAYMENT_METHODS, type PaymentMethod } from "../payment";

const METHOD_ICONS = {
  PromptPay: Smartphone,
  "Bank Transfer": Landmark,
  "Credit Card": CreditCard,
} satisfies Record<PaymentMethod, unknown>;

export const PAYMENT_METHOD_ERROR_ID = "payment-method-error";

/** Native radio rows: nothing is preselected, so the Creator must choose a method. */
export function PaymentMethodOptions({
  value,
  error,
  disabled,
  onChange,
  firstOptionRef,
}: {
  value: PaymentMethod | "";
  error?: string;
  disabled?: boolean;
  onChange: (method: PaymentMethod) => void;
  firstOptionRef?: Ref<HTMLInputElement>;
}) {
  return (
    <fieldset aria-describedby={error ? PAYMENT_METHOD_ERROR_ID : undefined}>
      <legend className="text-sm font-semibold">
        Payment method <span className="font-normal text-[var(--mk-muted)]">(required)</span>
      </legend>
      <div className="pay-method-list mt-2" data-invalid={Boolean(error)}>
        {PAYMENT_METHODS.map((method, index) => {
          const Icon = METHOD_ICONS[method];
          return (
            <label key={method} className="pay-method">
              <input
                ref={index === 0 ? firstOptionRef : undefined}
                type="radio"
                name="payment-method"
                value={method}
                checked={value === method}
                disabled={disabled}
                aria-describedby={error ? PAYMENT_METHOD_ERROR_ID : undefined}
                onChange={() => onChange(method)}
              />
              <span>{method}</span>
              <Icon aria-hidden="true" className="size-5" />
            </label>
          );
        })}
      </div>
      <div aria-live="polite">
        {error && (
          <p id={PAYMENT_METHOD_ERROR_ID} className="pay-error">
            {error}
          </p>
        )}
      </div>
    </fieldset>
  );
}
