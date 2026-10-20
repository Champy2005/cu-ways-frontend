import { RegisterAsset } from "@/features/auth/components/register/register-asset";
import type { RegistrationRole } from "@/features/auth/schemas";

/** "You are all set up." (502:2002 marketer, 502:2106 creator). */
export function RegisterSuccess({
  role,
  onStart,
}: {
  role: RegistrationRole;
  onStart: () => void;
}) {
  return (
    <div className="flex flex-col items-center pt-[185px]">
      <RegisterAsset name="success-check" />
      {/* The design mirrors the bird horizontally. */}
      <RegisterAsset
        name={role === "marketer" ? "success-marketer" : "success-creator"}
        className="-scale-x-100"
      />
      <h1 role="status" className="mt-[-6px] text-[24px] leading-[29px]">
        You are all set up.
      </h1>
      <button
        type="button"
        onClick={onStart}
        className="mt-[17px] h-12 w-full rounded-xl text-base font-semibold text-white"
        style={{ background: role === "marketer" ? "var(--rg-marketer)" : "var(--rg-creator)" }}
        autoFocus
      >
        Let’s start
      </button>
    </div>
  );
}
