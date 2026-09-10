import { notFound } from "next/navigation";

import { EmptyState } from "@/components/feedback/empty-state";
import { InlineError } from "@/components/feedback/inline-error";
import { getMarketer } from "@/features/marketers/api";
import { MarketerDetailShell } from "@/features/marketers/components/marketer-detail-shell";
import { ServicePackageRow } from "@/features/marketers/components/service-package-row";
import { buildMarketerHrefFromRef, type RawSearchParams } from "@/features/marketers/schemas";
import { getDisplayError } from "@/lib/api/errors";

export default async function ServicePackagesPage({
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

  const servicePackages = marketer.service_packages;

  return (
    <MarketerDetailShell
      title="Service Packages"
      subtitle="Catalog of Packages"
      backHref={buildMarketerHrefFromRef(marketerID, ref)}
    >
      {servicePackages.length === 0 ? (
        <EmptyState
          title="No service packages yet"
          description="This marketer has not published any service packages. Check back once they list their first offer."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {servicePackages.map((servicePackage, index) => (
            <li key={servicePackage.package_id}>
              <ServicePackageRow servicePackage={servicePackage} isLatest={index === 0} />
            </li>
          ))}
        </ul>
      )}
    </MarketerDetailShell>
  );
}
