import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SERVICE_TYPES } from "@/features/marketers/schemas";

export type ServiceFormValues = {
  selection: string;
  customName: string;
  scope_text: string;
  price: string;
};

export type ServiceFieldErrors = Partial<Record<"service_type" | "scope_text" | "price", string>>;

type ServiceFieldsProps = {
  values: ServiceFormValues;
  errors: ServiceFieldErrors;
  update: (field: keyof ServiceFormValues, value: string) => void;
  id: string;
};

const inputClass = "mk-service-input";

function FieldError({ id, children }: { id: string; children?: string }) {
  return children ? (
    <p id={id} className="mt-2 text-sm text-[var(--mk-error)]">
      {children}
    </p>
  ) : null;
}

function ServiceTypeField({ values, errors, update, id }: ServiceFieldsProps) {
  return (
    <div className="border-t border-[var(--mk-border)] py-5">
      <label htmlFor={`${id}-type`} className="mb-2 block text-sm font-medium">
        Service type <span aria-hidden="true">*</span>
      </label>
      <select
        id={`${id}-type`}
        name="service_type"
        value={values.selection}
        required
        aria-invalid={Boolean(errors.service_type)}
        aria-describedby={errors.service_type ? `${id}-type-error` : undefined}
        onChange={(event) => update("selection", event.target.value)}
        className={`w-full min-w-0 border px-3 text-sm outline-none focus-visible:ring-3 aria-invalid:border-[var(--mk-error)] ${inputClass}`}
      >
        <option value="">Select a service type</option>
        {SERVICE_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
        <option value="custom">Custom Service</option>
      </select>
      {values.selection === "custom" && (
        <div className="mt-4">
          <label htmlFor={`${id}-custom`} className="mb-2 block text-sm font-medium">
            Custom service name <span aria-hidden="true">*</span>
          </label>
          <Input
            id={`${id}-custom`}
            value={values.customName}
            onChange={(event) => update("customName", event.target.value)}
            maxLength={100}
            required
            aria-invalid={Boolean(errors.service_type)}
            aria-describedby={`${id}-custom-hint ${errors.service_type ? `${id}-type-error` : ""}`}
            placeholder="Give your service a clear name"
            className={inputClass}
          />
          <p id={`${id}-custom-hint`} className="mt-2 text-xs text-[var(--mk-muted)]">
            Up to 100 characters.
          </p>
        </div>
      )}
      <FieldError id={`${id}-type-error`}>{errors.service_type}</FieldError>
    </div>
  );
}

export function ServiceFields(props: ServiceFieldsProps) {
  const { values, errors, update, id } = props;
  return (
    <>
      <ServiceTypeField {...props} />
      <div className="border-t border-[var(--mk-border)] py-5">
        <label htmlFor={`${id}-scope`} className="mb-2 block text-sm font-medium">
          Scope description <span className="font-normal text-[var(--mk-muted)]">(optional)</span>
        </label>
        <Textarea
          id={`${id}-scope`}
          name="scope_text"
          value={values.scope_text}
          onChange={(event) => update("scope_text", event.target.value)}
          rows={4}
          aria-invalid={Boolean(errors.scope_text)}
          aria-describedby={`${id}-scope-hint ${errors.scope_text ? `${id}-scope-error` : ""}`}
          placeholder="Tell creators what is included in your package."
          className={`${inputClass} h-auto min-h-28`}
        />
        <p id={`${id}-scope-hint`} className="mt-2 text-xs leading-5 text-[var(--mk-muted)]">
          Include distribution channels, target respondents, expected delivery or response volume,
          and proof deliverables.
        </p>
        <FieldError id={`${id}-scope-error`}>{errors.scope_text}</FieldError>
      </div>
      <div className="border-y border-[var(--mk-border)] py-5">
        <label htmlFor={`${id}-price`} className="mb-2 block text-sm font-medium">
          Standard pricing (THB) <span aria-hidden="true">*</span>
        </label>
        <div className="relative">
          <span
            aria-hidden="true"
            className="absolute top-3 left-3 z-10 text-sm text-[var(--mk-muted)]"
          >
            ฿
          </span>
          <Input
            id={`${id}-price`}
            name="price"
            type="text"
            inputMode="decimal"
            required
            value={values.price}
            onChange={(event) => update("price", event.target.value)}
            placeholder="0.00"
            aria-invalid={Boolean(errors.price)}
            aria-describedby={`${id}-price-hint ${errors.price ? `${id}-price-error` : ""}`}
            className={`${inputClass} pl-8`}
          />
        </div>
        <p id={`${id}-price-hint`} className="mt-2 text-xs text-[var(--mk-muted)]">
          Enter 0 for a free service. Up to two decimal places.
        </p>
        <FieldError id={`${id}-price-error`}>{errors.price}</FieldError>
      </div>
    </>
  );
}
