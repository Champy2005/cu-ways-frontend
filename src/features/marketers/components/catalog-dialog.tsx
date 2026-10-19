"use client";
import { DeleteServiceDialog } from "./delete-service-dialog";
import { ServiceDialog } from "./service-dialog";
import type { Service } from "../types";
import type { ServiceEditor, ServiceCatalogProps } from "./service-catalog";
export function CatalogDialog({
  editor,
  actions,
  onSaved,
  onDeleted,
  onClose,
  finalFocus,
}: {
  editor: ServiceEditor;
  actions: NonNullable<ServiceCatalogProps["actions"]>;
  onSaved: (service: Service) => void;
  onDeleted: (service: Service) => void;
  onClose: () => void;
  finalFocus: () => HTMLElement | null;
}) {
  if (editor.type === "delete") {
    return (
      <DeleteServiceDialog
        service={editor.service}
        onDelete={actions.deleteService}
        onDeleted={() => onDeleted(editor.service)}
        onClose={onClose}
        finalFocus={finalFocus}
      />
    );
  }
  return (
    <ServiceDialog
      service={editor.type === "edit" ? editor.service : undefined}
      onSave={
        editor.type === "edit"
          ? (input) => actions.updateService(editor.service.service_id, input)
          : actions.createService
      }
      onSaved={onSaved}
      onClose={onClose}
      finalFocus={finalFocus}
    />
  );
}
