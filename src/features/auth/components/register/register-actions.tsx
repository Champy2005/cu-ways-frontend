import { ArrowLeft } from "lucide-react";

import { RegisterAsset } from "@/features/auth/components/register/register-asset";

type Tone = "default" | "creator" | "marketer";

type RegisterActionsProps = {
  label: string;
  tone: Tone;
  loading: boolean;
  disabled: boolean;
  onBack?: () => void;
  backOutlined?: boolean;
  className?: string;
};

/** Touch-friendly actions with a plain back arrow and a balanced primary button. */
export function RegisterActions({
  label,
  tone,
  loading,
  disabled,
  onBack,
  backOutlined = true,
  className,
}: RegisterActionsProps) {
  return (
    <div className={`flex items-center gap-[11px] ${className ?? ""}`}>
      {onBack && (
        <button
          type="button"
          className="register-back"
          data-outlined={backOutlined}
          onClick={onBack}
          disabled={!onBack || loading}
          aria-label="Back"
        >
          <ArrowLeft className="size-5" strokeWidth={1.6} aria-hidden="true" />
        </button>
      )}
      <button
        type="submit"
        className="register-primary"
        data-tone={tone}
        data-loading={loading}
        disabled={disabled || loading}
        aria-busy={loading}
      >
        {loading && <RegisterAsset name="spinner" className="animate-spin" />}
        {label}
      </button>
    </div>
  );
}
