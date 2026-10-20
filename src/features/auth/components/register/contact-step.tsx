import { RegisterField } from "@/features/auth/components/register/register-field";
import type { RegistrationErrors, RegistrationFields } from "@/features/auth/schemas";

type StepProps = {
  values: RegistrationFields;
  errors: RegistrationErrors;
  onChange: <K extends keyof RegistrationFields>(key: K, value: RegistrationFields[K]) => void;
};

/** Step 2 (500:1861 marketer, 500:2041 creator). */
export function ContactStep({ values, errors, onChange }: StepProps) {
  return (
    <div className="flex flex-col gap-[23px]">
      <RegisterField
        id="register-phone"
        label="Phone Number"
        error={errors.phone}
        variant="regular-medium"
      >
        <input
          id="register-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="xxx-xxx-xxxx"
          required
          maxLength={30}
          value={values.phone}
          onChange={(event) => onChange("phone", event.target.value)}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "register-phone-error" : undefined}
          className="register-input register-input--regular"
        />
      </RegisterField>
      <RegisterField
        id="register-line_id"
        label="Line ID (optional)"
        error={errors.line_id}
        variant="regular-medium"
      >
        <input
          id="register-line_id"
          name="line_id"
          autoComplete="off"
          placeholder="Enter your Line ID"
          maxLength={50}
          value={values.line_id}
          onChange={(event) => onChange("line_id", event.target.value)}
          aria-invalid={Boolean(errors.line_id)}
          aria-describedby={errors.line_id ? "register-line_id-error" : undefined}
          className="register-input register-input--regular"
        />
      </RegisterField>
    </div>
  );
}

/** Step 3, marketers only (502:2167). */
export function ExperienceStep({ values, errors, onChange }: StepProps) {
  const fields = [
    {
      key: "bio",
      label: "Bio",
      placeholder: "Talk about your experience",
      inputMode: undefined,
      maxLength: 5000,
    },
    {
      key: "experience_years",
      label: "Year of experience",
      placeholder: "Year of experience",
      inputMode: "numeric",
      maxLength: 2,
    },
    {
      key: "availability_text",
      label: "Availability Text",
      placeholder: "Enter availability text.",
      inputMode: undefined,
      maxLength: 5000,
    },
  ] as const;
  return (
    <div className="flex flex-col gap-[21px]">
      {fields.map(({ key, label, ...attributes }) => (
        <RegisterField
          key={key}
          id={`register-${key}`}
          label={label}
          error={errors[key]}
          variant="regular"
          // 502:2167 spaces Availability 16px below Year of experience, not 21px.
          className={key === "availability_text" ? "-mt-[5px]" : undefined}
        >
          <input
            id={`register-${key}`}
            name={key}
            {...attributes}
            value={values[key]}
            onChange={(event) => onChange(key, event.target.value)}
            aria-invalid={Boolean(errors[key])}
            aria-describedby={errors[key] ? `register-${key}-error` : undefined}
            className="register-input register-input--regular"
          />
        </RegisterField>
      ))}
    </div>
  );
}
