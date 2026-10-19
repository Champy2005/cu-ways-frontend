import { Checkbox } from "@/components/ui/checkbox";
import { PasswordInput } from "@/features/auth/components/password-input";
import { RegisterAsset } from "@/features/auth/components/register/register-asset";
import { RegisterField } from "@/features/auth/components/register/register-field";
import type { RegistrationErrors, RegistrationFields } from "@/features/auth/schemas";

export type RoleChoice = "creator" | "marketer" | "unsure";

type AccountStepProps = {
  values: RegistrationFields;
  errors: RegistrationErrors;
  choice: RoleChoice | null;
  onChange: <K extends keyof RegistrationFields>(key: K, value: RegistrationFields[K]) => void;
  onChoose: (choice: RoleChoice) => void;
};

const TEXT_FIELDS = [
  {
    key: "first_name",
    label: "First name *",
    placeholder: "Enter your first name",
    autoComplete: "given-name",
    type: "text",
  },
  {
    key: "last_name",
    label: "Last name *",
    placeholder: "Enter your last name",
    autoComplete: "family-name",
    type: "text",
  },
  {
    key: "email",
    label: "Email *",
    placeholder: "Enter your email",
    autoComplete: "email",
    type: "email",
  },
] as const;

const PASSWORD_FIELDS = [
  { key: "password", label: "Password *", placeholder: "Create password" },
  {
    key: "password_confirmation",
    label: "Password confirmation *",
    placeholder: "Confirm password",
  },
] as const;

function describedBy(errors: RegistrationErrors, key: keyof RegistrationFields) {
  return errors[key] ? `register-${key}-error` : undefined;
}

/** Step 1 (479:2571). Desktop splits into two columns (537:4079). */
export function AccountStep({ values, errors, choice, onChange, onChoose }: AccountStepProps) {
  return (
    <div className="grid gap-x-16 lg:grid-cols-2">
      <div>
        <h2 className="text-[15px] leading-[18px] font-medium">Personal information</h2>
        <div className="mt-[3px] flex flex-col gap-[6px] pr-[12px] pl-[10px]">
          {TEXT_FIELDS.map(({ key, label, ...attributes }) => (
            <RegisterField
              key={key}
              id={`register-${key}`}
              label={label}
              error={errors[key]}
              variant="compact"
            >
              <input
                id={`register-${key}`}
                name={key}
                {...attributes}
                required
                value={values[key]}
                onChange={(event) => onChange(key, event.target.value)}
                aria-invalid={Boolean(errors[key])}
                aria-describedby={describedBy(errors, key)}
                className="register-input register-input--compact"
              />
            </RegisterField>
          ))}
        </div>

        <h2 className="mt-[6px] text-[15px] leading-[18px] font-medium">Password</h2>
        <div className="mt-[4px] flex flex-col gap-[11px] pr-[12px] pl-[10px]">
          {PASSWORD_FIELDS.map(({ key, label, placeholder }) => (
            <RegisterField
              key={key}
              id={`register-${key}`}
              label={label}
              error={errors[key]}
              variant="compact"
            >
              <PasswordInput
                id={`register-${key}`}
                name={key}
                placeholder={placeholder}
                autoComplete="new-password"
                required
                maxLength={128}
                value={values[key]}
                onChange={(event) => onChange(key, event.target.value)}
                aria-invalid={Boolean(errors[key])}
                aria-describedby={describedBy(errors, key)}
                className="register-input register-input--compact"
              />
            </RegisterField>
          ))}
        </div>
      </div>

      <div className="lg:flex lg:flex-col lg:justify-center">
        <h2
          id="register-role-label"
          className="mt-[11px] text-[15px] leading-[18px] font-medium lg:mt-0"
        >
          Role selection
        </h2>
        <div
          role="radiogroup"
          aria-labelledby="register-role-label"
          aria-describedby={errors.role ? "register-role-error" : undefined}
          className="mt-[5px] pr-[10px]"
        >
          <div className="grid grid-cols-2 gap-[9px]">
            <button
              type="button"
              role="radio"
              aria-checked={choice === "creator"}
              data-role="creator"
              className="register-role pl-[2px]"
              onClick={() => onChoose("creator")}
            >
              <RegisterAsset name="bird-creator" />
              Creator
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={choice === "marketer"}
              data-role="marketer"
              className="register-role"
              onClick={() => onChoose("marketer")}
            >
              <RegisterAsset name="bird-marketer" />
              Marketer
            </button>
          </div>
          <button
            type="button"
            role="radio"
            aria-checked={choice === "unsure"}
            className="register-unsure mt-[15px] w-full"
            onClick={() => onChoose("unsure")}
          >
            <RegisterAsset name="bird-unsure" />
            I’m not sure
          </button>
          {errors.role && (
            <p
              id="register-role-error"
              role="alert"
              className="mt-1 text-right text-[8.5px] text-[var(--rg-error)]"
            >
              {errors.role}
            </p>
          )}
        </div>

        <div className="mt-[14px] flex flex-col gap-[8px] pl-[7px]">
          {(
            [
              { key: "accept_terms", label: "Accept Terms of Service" },
              { key: "accept_privacy", label: "Accept Privacy Policy" },
            ] as const
          ).map(({ key, label }) => (
            <div key={key}>
              <label className="flex items-center gap-[6px] text-[10px] text-[var(--rg-sds-text)]">
                <Checkbox
                  checked={values[key]}
                  onCheckedChange={(checked) => onChange(key, checked === true)}
                  aria-invalid={Boolean(errors[key])}
                  aria-describedby={describedBy(errors, key)}
                  className="register-checkbox size-[12px] rounded-[3px]"
                />
                <span>
                  {label}
                  {/* No Terms/Privacy pages exist yet: plain text, kept out of the checkbox's name. */}
                  <span aria-hidden="true">
                    {" - "}
                    <span className="text-[var(--rg-sds-tertiary)] underline">Learn more</span>
                  </span>
                </span>
              </label>
              {errors[key] && (
                <p
                  id={`register-${key}-error`}
                  role="alert"
                  className="text-[8.5px] text-[var(--rg-error)]"
                >
                  {errors[key]}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
