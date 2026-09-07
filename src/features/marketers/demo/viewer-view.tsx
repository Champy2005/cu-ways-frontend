import { PublicServiceCatalog } from "../components/public-service-catalog";
import type { DemoState } from "./store";
export default function ViewerView({ state }: { state: DemoState }) {
  return (
    <>
      <p className="mb-5 text-xs text-[var(--mk-muted)]">
        Creator preview &middot; Published service catalog
      </p>
      <PublicServiceCatalog services={state.services} marketer={state.profile} />
    </>
  );
}
