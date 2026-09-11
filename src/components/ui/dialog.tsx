"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const dialogPopupVariants = cva(
  "fixed z-50 flex max-h-[90dvh] flex-col overflow-hidden bg-background text-foreground shadow-xl outline-none transition-all data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
  {
    variants: {
      position: {
        // Bottom sheet on small screens, centred modal from md up.
        sheet:
          "inset-x-0 bottom-0 rounded-t-3xl data-[ending-style]:translate-y-4 data-[starting-style]:translate-y-4 md:inset-x-auto md:bottom-auto md:top-1/2 md:left-1/2 md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl",
        center:
          "top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl",
      },
    },
    defaultVariants: {
      position: "sheet",
    },
  },
);

function Dialog(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root {...props} />;
}

function DialogTrigger({ className, ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" className={className} {...props} />;
}

function DialogClose({ className, ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" className={className} {...props} />;
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-2xl font-semibold tracking-tight text-foreground", className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="dialog-header" className={cn("shrink-0", className)} {...props} />;
}

/** The only scrolling region, so the header and footer never overlap the content. */
function DialogBody({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn("min-h-0 flex-1 overflow-y-auto", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="dialog-footer" className={cn("shrink-0", className)} {...props} />;
}

function DialogContent({
  className,
  position = "sheet",
  children,
  ...props
}: DialogPrimitive.Popup.Props & VariantProps<typeof dialogPopupVariants>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        data-slot="dialog-backdrop"
        className="fixed inset-0 z-50 bg-foreground/40 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0"
      />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(dialogPopupVariants({ position, className }))}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  dialogPopupVariants,
};
