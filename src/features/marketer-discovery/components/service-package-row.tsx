import { formatBaht, formatShortDate } from "@/features/marketer-discovery/format";
import type { ServicePackage } from "@/features/marketer-discovery/types";

type ServicePackageRowProps = {
  servicePackage: ServicePackage;
  isLatest?: boolean;
};

export function ServicePackageRow({ servicePackage, isLatest = false }: ServicePackageRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-background/30 px-4 py-3 shadow-card">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{servicePackage.title}</p>
        <p className="mt-1 flex items-center gap-2 text-xs font-medium text-muted-strong">
          {formatShortDate(servicePackage.published_at)}
          {isLatest ? (
            <span className="flex items-center gap-1.5 text-accent-teal">
              <span className="size-3 rounded-full bg-accent-teal" aria-hidden="true" />
              Latest package
            </span>
          ) : null}
        </p>
      </div>
      <p className="shrink-0 text-xl font-medium text-foreground">
        {formatBaht(servicePackage.price_thb)}
      </p>
    </div>
  );
}
