"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import type { OfferErrors, OfferInput } from "../types";
import { characterCount } from "./validation";
import { formatDate } from "../format";

export function LiveOfferFields({
  values,
  errors,
  readOnly,
  today,
  deadline,
  onChange,
  onBlur,
}: {
  values: OfferInput;
  errors: OfferErrors;
  readOnly: boolean;
  today: string;
  deadline: string | null;
  onChange: (key: keyof OfferInput, value: string) => void;
  onBlur: (key: keyof OfferInput) => void;
}) {
  const id = useId();
  return (
    <div className="ji-fields">
      <Field data-invalid={Boolean(errors.price)}>
        <FieldLabel htmlFor={`${id}-price`}>Proposed Price (THB) *</FieldLabel>
        <div className="ji-price-field">
          <span aria-hidden="true">฿</span>
          <Input
            id={`${id}-price`}
            className="ji-input"
            inputMode="decimal"
            placeholder="0.00"
            value={values.price}
            readOnly={readOnly}
            aria-invalid={Boolean(errors.price)}
            aria-describedby={`${id}-price-help ${id}-price-error`}
            onChange={(event) => onChange("price", event.target.value)}
            onBlur={() => onBlur("price")}
          />
        </div>
        <FieldDescription id={`${id}-price-help`}>
          {readOnly
            ? "Saved proposed price."
            : "Propose an amount from ฿0 to ฿99,999,999.99, with at most two decimal places."}
        </FieldDescription>
        <p id={`${id}-price-error`} className="ji-field-error">
          {errors.price}
        </p>
      </Field>
      <Field data-invalid={Boolean(errors.deliveryDate)}>
        <FieldLabel htmlFor={`${id}-delivery`}>Estimated Delivery *</FieldLabel>
        <Input
          id={`${id}-delivery`}
          className="ji-input"
          type="date"
          min={readOnly ? undefined : today}
          max={readOnly ? undefined : (deadline ?? undefined)}
          value={values.deliveryDate}
          readOnly={readOnly}
          aria-invalid={Boolean(errors.deliveryDate)}
          aria-describedby={`${id}-delivery-help ${id}-delivery-error`}
          onChange={(event) => onChange("deliveryDate", event.target.value)}
          onBlur={() => onBlur("deliveryDate")}
        />
        <FieldDescription id={`${id}-delivery-help`}>
          {readOnly
            ? values.deliveryDate
              ? "Saved delivery date."
              : "Delivery date: Not specified"
            : deadline
              ? `Deliver between ${formatDate(today)} and ${formatDate(deadline)} (Bangkok).`
              : `Deliver on or after ${formatDate(today)} (Bangkok). No job deadline is specified.`}
        </FieldDescription>
        <p id={`${id}-delivery-error`} className="ji-field-error">
          {errors.deliveryDate}
        </p>
      </Field>
      <Field data-invalid={Boolean(errors.message)}>
        <div className="ji-card-top">
          <FieldLabel htmlFor={`${id}-message`}>Message to Creator (Optional)</FieldLabel>
          {!readOnly && (
            <span id={`${id}-message-count`} className="ji-muted ji-counter" aria-live="polite">
              {characterCount(values.message.trim())}/300
            </span>
          )}
        </div>
        <Textarea
          id={`${id}-message`}
          className="ji-input"
          value={values.message}
          readOnly={readOnly}
          placeholder={
            readOnly
              ? "Not specified"
              : "Briefly explain your distribution channels and expected reach…"
          }
          aria-invalid={Boolean(errors.message)}
          aria-describedby={
            readOnly ? `${id}-message-error` : `${id}-message-count ${id}-message-error`
          }
          onChange={(event) => onChange("message", event.target.value)}
          onBlur={() => onBlur("message")}
        />
        <p id={`${id}-message-error`} className="ji-field-error">
          {errors.message}
        </p>
      </Field>
    </div>
  );
}
