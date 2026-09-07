"use client";

import { Box, Plus } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { MarketerActions, Service } from "@/features/marketers/types";

import { DeleteServiceDialog } from "./delete-service-dialog";
import { ServiceCard } from "./service-card";
import { ServiceDialog } from "./service-dialog";

type ServiceEditor = { type: "create" } | { type: "edit" | "delete"; service: Service };

export interface ServiceCatalogProps {
  services: Service[];
  marketer: { user_id: number; name: string };
  actions?: Pick<MarketerActions, "createService" | "updateService" | "deleteService">;
  onServicesChange?: (services: Service[]) => void;
}

export function ServiceCatalog({
  services: initialServices,
  marketer,
  actions,
  onServicesChange,
}: ServiceCatalogProps) {
  const [services, setServices] = useState(initialServices);
  const [editor, setEditor] = useState<ServiceEditor | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const publishRef = useRef<HTMLButtonElement>(null);

  function openEditor(next: ServiceEditor) {
    triggerRef.current = document.activeElement as HTMLElement | null;
    setNotice(null);
    setEditor(next);
  }

  function finalFocus() {
    return triggerRef.current?.isConnected
      ? triggerRef.current
      : (publishRef.current ?? headingRef.current);
  }

  function applyServices(next: Service[], message: string) {
    setServices(next);
    onServicesChange?.(next);
    setNotice(message);
    setEditor(null);
  }

  function saveService(saved: Service) {
    const exists = services.some((service) => service.service_id === saved.service_id);
    const next = exists
      ? services.map((service) => (service.service_id === saved.service_id ? saved : service))
      : [saved, ...services];
    applyServices(
      next,
      exists ? "Service updated successfully." : "Service published successfully.",
    );
  }

  return (
    <section aria-labelledby="service-catalog-heading">
      <div className="mk-page-heading flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="mk-eyebrow">
            {actions ? "Your professional workspace" : "Service catalog"}
          </p>
          <h1
            ref={headingRef}
            tabIndex={-1}
            id="service-catalog-heading"
            className="mk-page-title break-words"
          >
            {actions ? "My services" : `${marketer.name}’s services`}
          </h1>
          <p className="mk-page-description">
            {actions
              ? "Turn your campus connections into opportunities. Create packages that show creators what you can do."
              : "Explore published packages, delivery scope, and standard pricing."}
          </p>
        </div>
        {actions && (
          <Button
            ref={publishRef}
            onClick={() => openEditor({ type: "create" })}
            className="mk-publish-button"
          >
            <Plus aria-hidden="true" />
            Publish a service
          </Button>
        )}
      </div>
      {notice && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-emerald-600/20 bg-emerald-600/10 px-4 py-3 text-sm text-[var(--mk-success,#15803d)]"
        >
          {notice}
        </p>
      )}
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[var(--mk-text)]">Published packages</p>
        <span className="text-xs text-[var(--mk-muted)]">
          {services.length} {services.length === 1 ? "service" : "services"}
        </span>
      </div>
      {services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--mk-border)] bg-[var(--mk-surface)] px-6 py-14 text-center">
          <Box
            className="mx-auto mb-5 size-11 text-[var(--mk-accent)]"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <h2 className="text-lg font-semibold text-[var(--mk-text)]">No published services yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--mk-muted)]">
            {actions
              ? "Publish your first package to help creators find the right support for their survey."
              : "This marketer has not published any service packages yet. Check back later."}
          </p>
        </div>
      ) : (
        <div className="mk-service-grid">
          {services.map((service) => (
            <ServiceCard
              key={service.service_id}
              service={service}
              onEdit={actions ? () => openEditor({ type: "edit", service }) : undefined}
              onDelete={actions ? () => openEditor({ type: "delete", service }) : undefined}
            />
          ))}
        </div>
      )}
      {actions && editor && (
        <CatalogDialog
          editor={editor}
          actions={actions}
          finalFocus={finalFocus}
          onClose={() => setEditor(null)}
          onSaved={saveService}
          onDeleted={(service) =>
            applyServices(
              services.filter((item) => item.service_id !== service.service_id),
              "Service deleted successfully.",
            )
          }
        />
      )}
    </section>
  );
}

function CatalogDialog({
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
