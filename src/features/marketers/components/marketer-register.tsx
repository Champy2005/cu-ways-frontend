import Image from "next/image";
import Link from "next/link";

/** First-time marketer landing: account creation continues in the profile onboarding form. */
export function MarketerRegister() {
  return (
    <section
      aria-labelledby="marketer-register-title"
      // Fills the space below the header; the bottom padding lifts the content slightly above center.
      className="mx-auto flex min-h-[calc(100dvh-12rem)] max-w-sm flex-col items-center justify-center pb-20 text-center text-[var(--mk-text)]"
    >
      <Image
        src="/marketer-assets/mascot.svg"
        width={116}
        height={110}
        alt=""
        aria-hidden="true"
        loading="eager"
      />
      <h1
        id="marketer-register-title"
        className="mt-6 text-xl font-medium tracking-tight sm:text-2xl"
      >
        Create the marketer account
      </h1>
      <Link
        href="/marketer/profile"
        className="mk-blue-button mt-6 inline-flex w-full max-w-52 items-center justify-center text-sm font-medium"
      >
        Create
      </Link>
    </section>
  );
}
