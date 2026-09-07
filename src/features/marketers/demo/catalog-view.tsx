import { ServiceCatalog } from "../components/service-catalog";
import { demoActions, type DemoState } from "./store";
export default function CatalogView({ state }: { state: DemoState }) {
  return (
    <ServiceCatalog services={state.services} marketer={state.profile} actions={demoActions} />
  );
}
