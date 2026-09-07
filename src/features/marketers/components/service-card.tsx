import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Box, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Service } from "@/features/marketers/types";
import { formatBahtAmount } from "@/features/marketers/format";

export interface ServiceCardProps {
  service: Service;
  onEdit?: () => void;
  onDelete?: () => void;
}

/** Display-only by default; management callbacks are provided only by the owner catalog. */
export function ServiceCard({ service, onEdit, onDelete }: ServiceCardProps) {
  return (
    <Card className="mk-card mk-service-card flex flex-col gap-0">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#e42278]/10 text-[var(--mk-accent)]">
          <Box className="size-5" aria-hidden="true" />
        </div>
        <Badge className="rounded-full bg-[#15803d]/10 px-2.5 py-1 text-xs font-medium text-[var(--mk-success,#15803d)]">
          Published
        </Badge>
      </div>
      <h2 className="text-lg leading-snug font-semibold break-words text-[var(--mk-text)]">
        {service.service_type}
      </h2>
      <p className="mk-service-scope mt-3 mb-6 flex-1 break-words whitespace-pre-wrap text-[var(--mk-muted)]">
        {service.scope_text?.trim() ? service.scope_text : "Not specified"}
      </p>
      <div className="border-t border-[var(--mk-border)] pt-4">
        <p className="mb-1 text-xs text-[var(--mk-muted)]">Standard pricing</p>
        <p className="text-2xl font-semibold tracking-tight text-[var(--mk-text)]">
          ฿{formatBahtAmount(service.price)}
        </p>
        {(onEdit || onDelete) && (
          <div className="mt-5 flex gap-2">
            {onEdit && (
              <Button
                variant="outline"
                onClick={onEdit}
                aria-label={`Edit ${service.service_type}`}
                className="mk-secondary-button flex-1"
              >
                <Pencil aria-hidden="true" />
                Edit service
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                onClick={onDelete}
                aria-label={`Delete ${service.service_type}`}
                className="size-11 rounded-xl text-[var(--mk-danger,#b91c1c)] hover:bg-red-500/10"
              >
                <Trash2 aria-hidden="true" />
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
