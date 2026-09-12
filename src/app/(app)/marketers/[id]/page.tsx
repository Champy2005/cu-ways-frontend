import { notFound } from "next/navigation";
import { CheckSquare } from "lucide-react";

import { InlineError } from "@/components/feedback/inline-error";
import { getMarketer } from "@/features/marketer-discovery/api";
import { MarketerHeroCard } from "@/features/marketer-discovery/components/marketer-hero-card";
import { MarketerInfoList } from "@/features/marketer-discovery/components/marketer-info-list";
import { MarketerPageHeader } from "@/features/marketer-discovery/components/marketer-page-header";
import { MarketerRating } from "@/features/marketer-discovery/components/marketer-rating";
import { MarketerSection } from "@/features/marketer-discovery/components/marketer-section";
import { MarketerStatTile } from "@/features/marketer-discovery/components/marketer-stat-tile";
import { SendCustomJobButton } from "@/features/marketer-discovery/components/send-custom-job-button";
import { ServicePackageRow } from "@/features/marketer-discovery/components/service-package-row";
import { formatAvailability, formatCount, formatYears } from "@/features/marketer-discovery/format";
import {
  buildBackHref,
  buildMarketerSubPageHref,
  type RawSearchParams,
} from "@/features/marketer-discovery/schemas";
import { getDisplayError } from "@/lib/api/errors";

export default async function MarketerProfilePage({
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

  const latestPackage = marketer.service_packages[0];
  const subPage = (segment: string) => buildMarketerSubPageHref(marketerID, segment, ref);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <MarketerPageHeader
        title={marketer.display_name}
        subtitle={marketer.headline}
        backHref={buildBackHref(ref)}
        backLabel="Back to marketer discovery"
      />

      <MarketerHeroCard marketer={marketer} />

      <MarketerSection title="Verified Performance" detailHref={subPage("verified-performance")}>
        <div className="grid grid-cols-2 gap-3">
          <MarketerStatTile
            label="Total complete jobs"
            icon={<CheckSquare className="size-6 shrink-0 text-brand" aria-hidden="true" />}
            value={
              <span className="text-2xl font-medium text-foreground">
                {formatCount(marketer.performance.completed_jobs)}
              </span>
            }
          />
          <MarketerStatTile
            label="Average Rating"
            icon={null}
            value={<MarketerRating value={marketer.performance.average_rating} variant="stat" />}
          />
        </div>
      </MarketerSection>

      <MarketerSection title="Service Packages" detailHref={subPage("service-packages")}>
        {latestPackage ? (
          <ServicePackageRow servicePackage={latestPackage} isLatest />
        ) : (
          <p className="text-sm text-muted-strong">No service packages published yet.</p>
        )}
      </MarketerSection>

      <MarketerSection title="Basic Information">
        <MarketerInfoList
          rows={[
            { label: "Phone number", value: marketer.phone ?? "—" },
            { label: "Email", value: marketer.email },
            { label: "Line ID", value: marketer.line_id ?? "—" },
          ]}
        />
      </MarketerSection>

      <MarketerSection title="In-depth Information" detailHref={subPage("in-depth-information")}>
        <MarketerInfoList
          rows={[
            { label: "Bio", value: marketer.bio },
            { label: "Year of experience", value: formatYears(marketer.years_of_experience) },
            {
              label: "Availability",
              value: formatAvailability(marketer.availability_status, marketer.availability_text),
            },
            { label: "Expertise", value: marketer.expertise.join(", ") || "—" },
            { label: "Campus coverage", value: marketer.campuses.join(", ") || "—" },
          ]}
        />
      </MarketerSection>

      <div className="sticky bottom-0 z-10 mt-8 bg-surface py-4">
        <SendCustomJobButton />
      </div>
    </div>
  );
}
