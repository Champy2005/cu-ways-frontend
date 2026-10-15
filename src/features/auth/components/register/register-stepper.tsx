import { RegisterAsset } from "@/features/auth/components/register/register-asset";
import type { RegistrationRole } from "@/features/auth/schemas";

const SLOTS = 5;

/**
 * Five slots as in the design: done = green check, current = the role's bird,
 * upcoming = dark check. Figma ships this strip as one flattened image per
 * frame, so it is rebuilt from the individual exported pieces.
 */
export function RegisterStepper({ current, role }: { current: number; role: RegistrationRole }) {
  return (
    <ol
      aria-label="Sign-up progress"
      className="flex h-[51.342px] w-[287px] items-center justify-between"
    >
      {Array.from({ length: SLOTS }, (_, index) => {
        const state = index < current ? "done" : index === current ? "current" : "upcoming";
        return (
          <li
            key={index}
            className="flex w-[30px] justify-center"
            aria-current={state === "current" ? "step" : undefined}
          >
            {state === "done" && <RegisterAsset name="step-done" />}
            {state === "current" && (
              <RegisterAsset
                name={role === "marketer" ? "bird-marketer" : "bird-creator"}
                className="max-w-none shrink-0"
              />
            )}
            {state === "upcoming" && (
              <span className="register-step-upcoming">
                <RegisterAsset name="step-check" />
              </span>
            )}
            <span className="sr-only">{`Step ${index + 1}: ${state}`}</span>
          </li>
        );
      })}
    </ol>
  );
}
