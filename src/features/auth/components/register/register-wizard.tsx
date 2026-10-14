"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { AccountStep } from "@/features/auth/components/register/account-step";
import { ContactStep, ExperienceStep } from "@/features/auth/components/register/contact-step";
import { RegisterActions } from "@/features/auth/components/register/register-actions";
import { RegisterAsset } from "@/features/auth/components/register/register-asset";
import { RegisterStepper } from "@/features/auth/components/register/register-stepper";
import { RegisterSuccess } from "@/features/auth/components/register/register-success";
import {
  type Banner,
  type FormStep,
  primaryAction,
  previousStep,
  useRegisterWizard,
} from "@/features/auth/components/register/use-register-wizard";
import type { RegistrationRole } from "@/features/auth/schemas";
import { cn } from "@/lib/utils";

import "@/features/auth/register.css";

const HOME: Record<RegistrationRole, string> = {
  creator: "/creator/dashboard",
  marketer: "/marketer/dashboard",
};

/** Spacing measured from each step's frame: 479:2571, 500:1861/500:2041, 502:2167. */
const STEP_LAYOUT: Record<
  FormStep,
  { slot: number; page: string; stepper: string; card: string; actions: string }
> = {
  account: {
    slot: 1,
    page: "pt-[33px]",
    stepper: "mt-[25px]",
    card: "mt-[20px] px-[20px] pt-[23px] pb-[27px] lg:w-full lg:px-[64px]",
    actions: "mt-[17px] pl-[2px] lg:justify-end",
  },
  contact: {
    slot: 2,
    page: "pt-[33px]",
    stepper: "mt-[25px]",
    card: "mt-[40px] px-[26px] pt-[22px] pb-[7px]",
    actions: "mt-[18px] ml-[-3px]",
  },
  experience: {
    slot: 3,
    page: "pt-[37px]",
    stepper: "mt-[29px]",
    card: "mt-[29px] px-[25px] pt-[19px] pb-[17px]",
    actions: "mt-[29px] ml-[-2px]",
  },
};

function StepHeading({
  step,
  headingRef,
}: {
  step: FormStep;
  headingRef: React.Ref<HTMLHeadingElement>;
}) {
  if (step === "experience") {
    return (
      <>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-center text-[24px] leading-[29px] font-medium outline-none"
        >
          Talk about your experience.
        </h1>
        <p className="mt-[8px] text-center text-[14px] leading-[17px] text-[var(--rg-ink-muted)]">
          This section <span className="text-[var(--rg-creator-soft)]">can change later</span>
        </p>
      </>
    );
  }
  return (
    <>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-center text-[30px] leading-[36px] font-medium outline-none"
      >
        Tell us about yourself.
      </h1>
      <p className="mt-[7px] text-center text-[14px] leading-[17px] text-[var(--rg-ink-soft)]">
        Set up your profile
      </p>
    </>
  );
}

/** "Couldn't create your account." with the alert icon (497:2478). */
function FailureBanner({ banner }: { banner: Banner }) {
  return (
    <div role="alert" className="absolute top-[5px] right-[22px] text-right text-[var(--rg-error)]">
      <p className="flex items-center justify-end gap-[3px] text-[13px] leading-[16px]">
        <RegisterAsset name="alert-circle" />
        Couldn’t create your account.
      </p>
      {banner.detail && <p className="text-[10px]">{banner.detail}</p>}
    </div>
  );
}

export function RegisterWizard() {
  const router = useRouter();
  const wizard = useRegisterWizard();
  const { step, role } = wizard;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // Move focus to the new step's heading so screen readers announce it.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  if (step === "done") {
    return (
      <RegisterSuccess
        role={role}
        onStart={() => {
          router.push(HOME[role]);
          router.refresh();
        }}
      />
    );
  }

  const layout = STEP_LAYOUT[step];
  const primary = primaryAction(step, role);
  const stepProps = { values: wizard.values, errors: wizard.errors, onChange: wizard.change };

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-[375px] flex-col items-center pb-10 lg:max-w-[1164px]",
        layout.page,
      )}
    >
      <StepHeading step={step} headingRef={headingRef} />
      <div className={layout.stepper}>
        <RegisterStepper current={layout.slot} role={role} />
      </div>

      <form
        noValidate
        onSubmit={wizard.handleSubmit}
        aria-label="Create your account"
        className={cn("register-card relative w-[305px]", layout.card)}
      >
        {wizard.banner && <FailureBanner banner={wizard.banner} />}
        <fieldset disabled={wizard.submitting} className="contents">
          {step === "account" && (
            <AccountStep {...stepProps} choice={wizard.choice} onChoose={wizard.choose} />
          )}
          {step === "contact" && <ContactStep {...stepProps} />}
          {step === "experience" && <ExperienceStep {...stepProps} />}
        </fieldset>
        <RegisterActions
          label={primary.label}
          tone={primary.tone}
          loading={wizard.submitting}
          disabled={wizard.blocked}
          onBack={previousStep(step) ? wizard.goBack : undefined}
          backOutlined={step !== "contact"}
          className={layout.actions}
        />
      </form>
    </div>
  );
}
