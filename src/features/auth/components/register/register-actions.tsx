import { CircleArrowLeft } from "lucide-react";

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

/**
 * Back (71x48) + primary (185x57). The design's back icon is the Simple Design
 * System "Arrow right-circle" via Code Connect; that library is not installed,
 * so lucide's CircleArrowLeft (the same Feather-derived glyph) stands in.
 */
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
      <button
        type="button"
        className="register-back"
        data-outlined={backOutlined}
        onClick={onBack}
        disabled={!onBack || loading}
        aria-label="Back"
      >
        <CircleArrowLeft className="size-[30px]" strokeWidth={1.6} aria-hidden="true" />
      </button>
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
