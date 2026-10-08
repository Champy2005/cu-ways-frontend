"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import type { JobSummary, OfferErrors, OfferInput } from "../types";
import { MESSAGE_LIMIT } from "../validation";
import { formatDate, formatPrice } from "../format";

export function OfferFields({
  values,
  errors,
  job,
  readOnly,
  id,
  update,
  onBlur,
  minimumDate,
}: {
  values: OfferInput;
  errors: OfferErrors;
  job: JobSummary;
  readOnly: boolean;
  id: string;
  update: (key: keyof OfferInput, value: string) => void;
  onBlur: (key: keyof OfferInput) => void;
  minimumDate: string;
}) {
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
            onChange={(event) => update("price", event.target.value)}
            onBlur={() => onBlur("price")}
          />
        </div>
        <FieldDescription id={`${id}-price-help`}>
          Creator’s listed budget: {formatPrice(job.budget)}. You can propose a different rate,
          including ฿0.
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
          min={readOnly ? undefined : minimumDate}
          max={job.deadline}
          value={values.deliveryDate}
          readOnly={readOnly}
          aria-invalid={Boolean(errors.deliveryDate)}
          aria-describedby={`${id}-delivery-help ${id}-delivery-error`}
          onChange={(event) => update("deliveryDate", event.target.value)}
          onBlur={() => onBlur("deliveryDate")}
        />
        <FieldDescription id={`${id}-delivery-help`}>
          Deliver between {formatDate(minimumDate)} and {formatDate(job.deadline)}.
        </FieldDescription>
        <p id={`${id}-delivery-error`} className="ji-field-error">
          {errors.deliveryDate}
        </p>
      </Field>
      <Field data-invalid={Boolean(errors.message)}>
        <div className="ji-card-top">
          <FieldLabel htmlFor={`${id}-message`}>Message to Creator (Optional)</FieldLabel>
          <span className="ji-muted ji-counter" aria-live="polite">
            {values.message.length}/{MESSAGE_LIMIT}
          </span>
        </div>
        <Textarea
          id={`${id}-message`}
          className="ji-input"
          placeholder="Briefly explain your distribution channels and expected reach…"
          maxLength={MESSAGE_LIMIT}
          value={values.message}
          readOnly={readOnly}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={`${id}-message-error`}
          onChange={(event) => update("message", event.target.value)}
          onBlur={() => onBlur("message")}
        />
        <p id={`${id}-message-error`} className="ji-field-error">
          {errors.message}
        </p>
      </Field>
    </div>
  );
}
