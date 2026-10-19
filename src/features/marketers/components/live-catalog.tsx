"use client";
import { ServiceCatalog } from "./service-catalog";
import { liveMarketerActions } from "../browser-api";
import type { MarketerProfile, Service } from "../types";
import Link from "next/link";

export function LiveCatalog({
  profile,
  services,
}: {
  profile: MarketerProfile;
  services: Service[];
}) {
  return (
    <>
      <ServiceCatalog marketer={profile} services={services} actions={liveMarketerActions} />
      <Link
        href={`/marketers/${profile.user_id}/services`}
        className="mt-6 inline-flex text-sm text-[var(--mk-muted)] underline underline-offset-4"
      >
        Creator catalog — coming soon
      </Link>
    </>
  );
}
