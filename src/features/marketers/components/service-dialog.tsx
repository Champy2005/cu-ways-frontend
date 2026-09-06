"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Box, X } from "lucide-react";
import { useId, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { parseServiceForm, SERVICE_TYPES } from "@/features/marketers/schemas";
import type { Service, ServiceInput } from "@/features/marketers/types";
import { getDisplayError } from "@/lib/api/errors";

import { DiscardServiceDialog } from "./discard-service-dialog";
import { serviceFieldErrors } from "./service-errors";
import { ServiceFields, type ServiceFieldErrors, type ServiceFormValues } from "./service-fields";

type ServiceDialogProps = {
  service?: Service;
  onSave: (input: ServiceInput) => Promise<Service>;
  onSaved: (service: Service) => void;
  onClose: () => void;
  finalFocus?: () => HTMLElement | null;
};

function initialValues(service?: Service): ServiceFormValues {
  const knownType = SERVICE_TYPES.some((type) => type === service?.service_type);
  return {
    selection: service ? (knownType ? service.service_type : "custom") : "",
    customName: service && !knownType ? service.service_type : "",
    scope_text: service?.scope_text ?? "",
    price: service?.price ?? "",
  };
}

export function ServiceDialog({
  service,
  onSave,
  onSaved,
  onClose,
  finalFocus,
}: ServiceDialogProps) {
  const id = useId();
  const [initial] = useState(() => initialValues(service));
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<ServiceFieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const inFlight = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const portalContainer = useRef<HTMLDivElement>(null);
  const dirty = JSON.stringify(initial) !== JSON.stringify(values);

  function update(field: keyof ServiceFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    const errorField = field === "selection" || field === "customName" ? "service_type" : field;
    setErrors((current) => ({ ...current, [errorField]: undefined }));
  }

  function requestClose() {
    if (inFlight.current) return;
    if (dirty) setDiscardOpen(true);
    else onClose();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const parsed = parseServiceForm({
      service_type: values.selection === "custom" ? values.customName : values.selection,
      scope_text: values.scope_text,
      price: values.price,
    });
    if (!parsed.success) {
      setErrors(parsed.errors);
      setError("Check the highlighted fields before continuing.");
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    inFlight.current = true;
    setPending(true);
    setError(null);
    setErrors({});
    try {
      const saved = await onSave(parsed.data);
      onSaved(saved);
    } catch (caught) {
      setError(getDisplayError(caught));
      setErrors(serviceFieldErrors(caught));
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && requestClose()}>
      <div ref={portalContainer} />
      <Dialog.Portal container={portalContainer} className="[color-scheme:light]">
        <Dialog.Backdrop className="fixed inset-0 z-[60] bg-[#0d111a]/45" />
        <Dialog.Popup
          finalFocus={finalFocus}
          className="fixed inset-x-0 bottom-0 z-[70] flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[28px] bg-[#f9f9f9] text-[#0d111a] shadow-2xl outline-none sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-[560px] sm:max-w-[calc(100%-3rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px]"
        >
          <div className="flex shrink-0 items-start justify-between gap-2 px-6 pt-6 pb-5 sm:px-8">
            <div className="min-w-0">
              <Dialog.Title className="text-xl leading-7 font-medium">
                {service ? "Edit Service Package" : "Publish Service Package"}
              </Dialog.Title>
              <Dialog.Description className="mt-1.5 text-xs leading-5 text-[#626976]">
                {service
                  ? "Keep your rates and scope up to date."
                  : "Show your survey package to creators."}
              </Dialog.Description>
            </div>
            <Dialog.Close
              disabled={pending}
              aria-label="Close service dialog"
              render={
                <Button variant="ghost" className="size-9 text-[#626976] hover:bg-[#e4e5e7]" />
              }
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>
          <form ref={formRef} onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 overflow-y-auto px-6 sm:px-8">
              <fieldset disabled={pending} className="min-w-0">
                <ServiceFields values={values} update={update} errors={errors} id={id} />
              </fieldset>
              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-xl bg-red-50 p-3 text-sm leading-5 text-red-800"
                >
                  {error}
                </p>
              )}
              <div
                className="pointer-events-none relative h-12 overflow-hidden sm:h-16"
                aria-hidden="true"
              >
                <Box
                  className="absolute -top-10 -right-5 size-48 text-[#0d111a]/[0.035]"
                  strokeWidth={1}
                />
              </div>
            </div>
            <div className="shrink-0 border-t border-[#e4e5e7] bg-[#f9f9f9] px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8">
              <Button
                type="submit"
                disabled={pending}
                className="h-11 w-full rounded-[15px] bg-[#e42278] text-[15px] font-semibold text-white hover:bg-[#ca1566] focus-visible:ring-[#e42278]/30"
              >
                {pending ? "Saving…" : service ? "Save changes" : "Publish"}
              </Button>
            </div>
          </form>
          <DiscardServiceDialog
            open={discardOpen}
            onKeepEditing={() => setDiscardOpen(false)}
            onDiscard={onClose}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
