"use client";

import { useEffect, useRef, useState, useTransition, type RefObject } from "react";

/** Where focus goes when the confirmation closes or a late result lands. */
export type SaveFocus = "submit" | "field" | "heading";

/**
 * Shared flow for a form that saves one job record (a payment or a review)
 * through a confirmation dialog.
 *
 * The dialog can always be closed, even mid-save: the request keeps running
 * and its result is applied to the page, so the Creator is never trapped.
 * Results that arrive after the dialog closed show on the form instead, and
 * focus moves to the heading (new view) or the rejected field.
 */
export function useConfirmedSave<Outcome>(
  initialOutcome: () => Outcome,
  fieldRef: RefObject<HTMLElement | null>,
) {
  const [outcome, setOutcome] = useState<Outcome>(initialOutcome);
  const [formAlert, setFormAlert] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState(0);
  const [pending, startTransition] = useTransition();

  const heading = useRef<HTMLHeadingElement>(null);
  const submitButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<SaveFocus>("submit");
  // Read inside async results, where the `confirming` state would be stale.
  const dialogOpen = useRef(false);
  const focusAfterResult = useRef<SaveFocus | null>(null);

  function focusTarget(target: SaveFocus): HTMLElement | null {
    if (target === "field") return fieldRef.current;
    if (target === "heading") return heading.current;
    return submitButton.current;
  }

  // A result that lands after the dialog was closed has no dialog to return
  // focus, so move it here once the new state has rendered.
  useEffect(() => {
    const target = focusAfterResult.current;
    if (!target || confirming) return;
    focusAfterResult.current = null;
    const node =
      target === "field"
        ? fieldRef.current
        : target === "heading"
          ? heading.current
          : submitButton.current;
    node?.focus();
  }, [outcome, focusRequest, confirming, fieldRef]);

  function openDialog() {
    setDialogError(null);
    returnFocus.current = "submit";
    dialogOpen.current = true;
    setConfirming(true);
  }

  function closeDialog(focus: SaveFocus = "submit") {
    returnFocus.current = focus;
    dialogOpen.current = false;
    setConfirming(false);
  }

  function moveFocusAfterResult(target: SaveFocus) {
    if (dialogOpen.current) closeDialog(target);
    else {
      focusAfterResult.current = target;
      setFocusRequest((count) => count + 1);
    }
  }

  /** Leaves the form for a result view, moving focus to the page heading. */
  function settle(next: Outcome) {
    moveFocusAfterResult("heading");
    setFormAlert(null);
    setOutcome(next);
  }

  /** A failed save stays in the dialog when it is open, otherwise on the form. */
  function showError(message: string) {
    if (dialogOpen.current) setDialogError(message);
    else setFormAlert(message);
  }

  /** The backend rejected an entered value: back to the form, focused on it. */
  function returnToField(message: string) {
    moveFocusAfterResult("field");
    setFormAlert(message);
  }

  /** Runs one save or status check; ignored while another is in flight. */
  function run(task: () => Promise<void>) {
    if (pending) return;
    startTransition(task);
  }

  return {
    outcome,
    setOutcome,
    formAlert,
    setFormAlert,
    confirming,
    dialogError,
    pending,
    heading,
    submitButton,
    openDialog,
    closeDialog,
    settle,
    showError,
    returnToField,
    run,
    finalFocus: () => focusTarget(returnFocus.current),
  };
}
