import { notFound } from "next/navigation";
import { CalendarDays } from "lucide-react";

import { InlineError } from "@/components/feedback/inline-error";
import { getMarketer } from "@/features/marketer-discovery/api";
import { MarketerAvatar } from "@/features/marketer-discovery/components/marketer-avatar";
import { MarketerDetailShell } from "@/features/marketer-discovery/components/marketer-detail-shell";
import { formatDateRange } from "@/features/marketer-discovery/format";
import {
  buildMarketerHrefFromRef,
  type RawSearchParams,
} from "@/features/marketer-discovery/schemas";
import { getDisplayError } from "@/lib/api/errors";

export default async function InDepthInformationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { id } = await params;
  const marketerID = Number(id);
  if (!Number.isSafeInteger(marketerID) || marketerID < 1) {
    return <InlineError title="Invalid marketer" message="The marketer ID is not valid." />;
  }

  const { ref } = await searchParams;

  let marketer;
  try {
    marketer = await getMarketer(marketerID);
  } catch (error) {
    return <InlineError message={getDisplayError(error)} />;
  }
  if (!marketer) notFound();

  const availability = formatDateRange(marketer.available_from, marketer.available_to);

  return (
    <MarketerDetailShell
      title="In-depth Information"
      subtitle="Bio, experience, Availability"
      backHref={buildMarketerHrefFromRef(marketerID, ref)}
    >
      <div className="mb-6 flex items-center gap-4">
        <MarketerAvatar name={marketer.display_name} size="md" />
        <div className="min-w-0">
          <p className="truncate text-base font-medium text-foreground">{marketer.display_name}</p>
          <p className="truncate text-xl text-muted-foreground">{marketer.headline}</p>
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-base font-medium text-foreground">Bio</h2>
        <p className="min-h-24 rounded-2xl bg-background/30 p-4 text-sm text-label shadow-card">
          {marketer.bio}
        </p>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-base font-medium text-foreground">Experience</h2>
        <p className="min-h-40 rounded-2xl bg-background/30 p-4 text-sm text-label shadow-card">
          {marketer.experience}
        </p>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-base font-medium text-foreground">Availability</h2>
        <p className="flex items-center gap-2 text-sm text-label">
          <CalendarDays className="size-5 shrink-0 text-foreground" aria-hidden="true" />
          {availability ?? "This marketer has not published availability dates yet."}
        </p>
      </section>
    </MarketerDetailShell>
  );
}
