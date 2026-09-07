import { ServiceCard } from "./service-card";
import type { Service } from "../types";
export function PublicServiceCatalog({
  services,
  marketer,
}: {
  services: Service[];
  marketer: { name: string; user_id: number };
}) {
  return (
    <section aria-labelledby="public-catalog-heading">
      <div className="mk-page-heading">
        <p className="mk-eyebrow">Service catalog</p>
        <h1 id="public-catalog-heading" className="mk-page-title wrap-anywhere">
          {marketer.name}’s services
        </h1>
        <p className="mk-page-description">
          Explore published packages, delivery scope, and standard pricing.
        </p>
      </div>
      <div className="mb-4 flex justify-between gap-3">
        <p className="text-sm font-medium">Published packages</p>
        <span className="text-xs text-[var(--mk-muted)]">
          {services.length} {services.length === 1 ? "service" : "services"}
        </span>
      </div>
      {services.length ? (
        <div className="mk-service-grid">
          {services.map((service) => (
            <ServiceCard key={service.service_id} service={service} />
          ))}
        </div>
      ) : (
        <div className="mk-card p-10 text-center">
          <h2 className="text-lg font-semibold">No published services yet</h2>
          <p className="mt-2 text-sm text-[var(--mk-muted)]">
            This marketer has not published any service packages yet. Check back later.
          </p>
        </div>
      )}
    </section>
  );
}
