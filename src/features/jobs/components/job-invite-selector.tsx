"use client";

import { Check, Search, Star } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type RefObject,
} from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  loadJobInviteMarketersPage,
  sendJobRequests,
  type JobInviteMarketersPageState,
  type JobRequestActionState,
} from "@/features/jobs/actions";
import type { JobInviteMarketer } from "@/features/jobs/types";

type JobInviteSelectorProps = {
  jobId: number;
  marketers: JobInviteMarketer[];
  totalMarketers: number;
  pageSize: number;
};

type MarketerOptionProps = {
  marketer: JobInviteMarketer;
  checked: boolean;
  disabled: boolean;
  onChange: (marketerId: number, checked: boolean) => void;
};

type ConfirmationDialogProps = {
  jobId: number;
  open: boolean;
  isPending: boolean;
  portalContainer: RefObject<HTMLDivElement | null>;
  selectedMarketers: JobInviteMarketer[];
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

const INITIAL_ACTION_STATE: JobRequestActionState = { status: "idle" };

function MarketerOption({ marketer, checked, disabled, onChange }: MarketerOptionProps) {
  const rating =
    marketer.average_rating === null
      ? "No ratings yet"
      : `${marketer.average_rating.toFixed(1)} / 5`;
  const reviewCount = marketer.rating_count === 1 ? "1 review" : `${marketer.rating_count} reviews`;
  const tags = marketer.headline.split(" · ").filter(Boolean);

  return (
    <li>
      <label className="flex h-full cursor-pointer items-center gap-3 rounded-2xl border border-[var(--mk-border)] bg-[var(--mk-surface)] p-4 shadow-[var(--mk-shadow)] transition-colors hover:border-[var(--mk-accent)] has-[:checked]:border-[var(--mk-accent)] has-[:checked]:bg-[var(--mk-accent-soft)]">
        <input
          type="checkbox"
          name="marketer_ids"
          value={marketer.marketer_id}
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(marketer.marketer_id, event.currentTarget.checked)}
          className="peer sr-only"
          aria-label={`Select ${marketer.display_name}`}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-[var(--mk-text)]">
            {marketer.display_name}
          </span>
          <span className="mt-1.5 flex items-center gap-1 text-xs text-[var(--mk-caution)]">
            <Star aria-hidden="true" className="size-3.5 fill-current" />
            <span>{rating}</span>
            <span className="text-[var(--mk-muted)]">· {reviewCount}</span>
          </span>
          {tags.length > 0 ? (
            <span className="mt-2 flex flex-wrap gap-1.5">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-[var(--mk-border)] bg-[var(--mk-field)] px-2 py-0.5 text-[0.65rem] text-[var(--mk-muted)]"
                >
                  {tag}
                </span>
              ))}
            </span>
          ) : null}
        </span>
        <span
          aria-hidden="true"
          className={`flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
            checked
              ? "border-[var(--mk-accent)] bg-[var(--mk-accent)] text-white"
              : "border-[var(--mk-border)] bg-[var(--mk-surface)] text-transparent"
          } peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50`}
        >
          <Check className="size-4" />
        </span>
      </label>
    </li>
  );
}

function MarketerOptions({
  marketers,
  isLoading,
  searchFailed,
  keyword,
  selectedMarketersById,
  disabled,
  onChange,
}: {
  marketers: JobInviteMarketer[];
  isLoading: boolean;
  searchFailed: boolean;
  keyword: string;
  selectedMarketersById: Map<number, JobInviteMarketer>;
  disabled: boolean;
  onChange: (marketerId: number, checked: boolean) => void;
}) {
  if (searchFailed) {
    return (
      <p
        className="rounded-xl border border-dashed border-[var(--mk-border)] p-6 text-center text-sm text-[var(--mk-muted)]"
        role="status"
      >
        Search results could not be loaded.
      </p>
    );
  }

  if (isLoading) {
    return (
      <p
        className="rounded-xl border border-dashed border-[var(--mk-border)] p-6 text-center text-sm text-[var(--mk-muted)]"
        role="status"
      >
        Searching marketers…
      </p>
    );
  }

  if (marketers.length === 0) {
    return (
      <p
        className="rounded-xl border border-dashed border-[var(--mk-border)] p-6 text-center text-sm text-[var(--mk-muted)]"
        role="status"
      >
        {keyword ? `No marketers match “${keyword}”.` : "No marketers are listed on this page."}
      </p>
    );
  }

  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {marketers.map((marketer) => (
        <MarketerOption
          key={marketer.marketer_id}
          marketer={marketer}
          checked={selectedMarketersById.has(marketer.marketer_id)}
          disabled={disabled}
          onChange={onChange}
        />
      ))}
    </ul>
  );
}

function JobRequestFeedback({ state }: { state: JobRequestActionState }) {
  switch (state.status) {
    case "duplicate":
      return null;
    case "error":
      return (
        <div className="mk-error-notice rounded-xl p-4" role="alert">
          <p className="font-semibold">Requests could not be sent</p>
          <p className="mt-1 text-sm">{state.message}</p>
        </div>
      );
    case "success":
      return (
        <p
          className="rounded-xl border border-[color-mix(in_srgb,var(--mk-success)_28%,var(--mk-border))] bg-[var(--mk-positive-soft)] p-4 text-sm text-[var(--mk-success)]"
          role="status"
        >
          {state.createdCount === 1
            ? "Request sent to 1 marketer."
            : `Requests sent to ${state.createdCount} marketers.`}
        </p>
      );
    default:
      return null;
  }
}

function DuplicateRequestDialog({
  open,
  onOpenChange,
  onReview,
  portalContainer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReview: () => void;
  portalContainer: RefObject<HTMLDivElement | null>;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogPortal container={portalContainer}>
        <AlertDialogOverlay className="mk-dialog-backdrop fixed inset-0 z-[60]" />
        <AlertDialogPopup className="mk-dialog-surface fixed top-1/2 left-1/2 z-[70] grid max-h-[90dvh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 gap-5 overflow-y-auto rounded-3xl p-6 outline-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">
              Active Invitation Already Exists
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-6 text-[var(--mk-muted)]">
              An active invitation exists for one or more selected marketers. Duplicate invitations
              cannot be sent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="-mx-6 -mb-6 border-0 bg-transparent p-0">
            <Button type="button" className="mk-primary-button w-full" onClick={onReview}>
              Review Selection
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialogPortal>
    </AlertDialog>
  );
}

function ConfirmationDialog({
  jobId,
  open,
  isPending,
  portalContainer,
  selectedMarketers,
  onOpenChange,
  onConfirm,
}: ConfirmationDialogProps) {
  const count = selectedMarketers.length;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogPortal container={portalContainer}>
        <AlertDialogOverlay className="mk-dialog-backdrop fixed inset-0 z-[60]" />
        <AlertDialogPopup className="mk-dialog-surface fixed top-1/2 left-1/2 z-[70] grid max-h-[90dvh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 gap-5 overflow-y-auto rounded-3xl p-6 outline-none">
          <AlertDialogHeader className="place-items-start text-left">
            <AlertDialogTitle className="text-lg font-semibold">
              Send Direct Job Request?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-6 text-[var(--mk-muted)]">
              Each selected marketer will receive a pending invitation to make an offer. The entire
              batch is rejected if one marketer already has an active request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-2xl border border-[var(--mk-border)] bg-[var(--mk-field)] p-4">
            <p className="font-semibold">Job #{jobId}</p>
            <p className="mt-1 text-sm text-[var(--mk-accent)]">Direct job request</p>
            <p className="mt-1 text-sm text-[var(--mk-muted)]">
              Sending invitation to {count} selected {count === 1 ? "marketer" : "marketers"}
            </p>
            <ul className="mt-3 max-h-24 overflow-y-auto border-t border-[var(--mk-border)] pt-2 text-sm">
              {selectedMarketers.slice(0, 5).map((marketer) => (
                <li key={marketer.marketer_id} className="truncate py-1">
                  {marketer.display_name}
                </li>
              ))}
              {count > 5 ? (
                <li className="py-1 text-[var(--mk-muted)]">and {count - 5} more</li>
              ) : null}
            </ul>
          </div>
          <AlertDialogFooter className="grid grid-cols-2 gap-3 border-0 bg-transparent p-0">
            <AlertDialogCancel disabled={isPending} className="mk-secondary-button justify-center">
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={isPending}
              className="mk-primary-button justify-center font-semibold"
              onClick={onConfirm}
            >
              {isPending ? "Sending…" : "Send Invitation"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialogPortal>
    </AlertDialog>
  );
}

export function JobInviteSelector({
  jobId,
  marketers: initialMarketers,
  totalMarketers: initialTotalMarketers,
  pageSize: initialPageSize,
}: JobInviteSelectorProps) {
  const [state, setState] = useState<JobRequestActionState>(INITIAL_ACTION_STATE);
  const [isSending, startSendTransition] = useTransition();
  const [isLoadingPage, startPageTransition] = useTransition();
  const [pageData, setPageData] = useState({
    marketers: initialMarketers,
    page: 1,
    pageSize: initialPageSize,
    totalMarketers: initialTotalMarketers,
    keyword: "",
  });
  const [selectedMarketersById, setSelectedMarketersById] = useState<
    Map<number, JobInviteMarketer>
  >(() => new Map());
  const [search, setSearch] = useState("");
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const portalContainer = useRef<HTMLDivElement>(null);
  const latestPageRequest = useRef(0);

  const { marketers, page, pageSize, totalMarketers } = pageData;
  const pageCount = Math.max(1, Math.ceil(totalMarketers / pageSize));
  const selectedMarketers = useMemo(
    () => [...selectedMarketersById.values()],
    [selectedMarketersById],
  );
  const searchIsStale = pageData.keyword !== search.trim();
  const isBusy = isSending || isLoadingPage || searchIsStale;

  const toggleMarketer = (marketerId: number, checked: boolean) => {
    const marketer = marketers.find((item) => item.marketer_id === marketerId);
    setSelectedMarketersById((current) => {
      const next = new Map(current);
      if (checked && marketer) next.set(marketerId, marketer);
      else next.delete(marketerId);
      return next;
    });
    setSelectionError(null);
    setState(INITIAL_ACTION_STATE);
    setDuplicateDialogOpen(false);
  };

  const clearSelection = () => {
    setSelectedMarketersById(new Map());
    setSelectionError(null);
    setState(INITIAL_ACTION_STATE);
    setDuplicateDialogOpen(false);
  };

  const loadPage = useCallback((nextPage: number, keyword: string) => {
    const requestId = ++latestPageRequest.current;
    setPageError(null);
    startPageTransition(async () => {
      let result: JobInviteMarketersPageState;
      try {
        result = await loadJobInviteMarketersPage(nextPage, keyword);
      } catch {
        result = {
          status: "error",
          message: "Marketers could not be loaded. Check your connection and try again.",
        };
      }
      startPageTransition(() => {
        if (requestId !== latestPageRequest.current) return;
        if (result.status === "success") {
          setPageData({
            marketers: result.items,
            page: result.page,
            pageSize: result.pageSize,
            totalMarketers: result.total,
            keyword: result.keyword,
          });
        } else {
          setPageError(result.message);
        }
      });
    });
  }, []);

  useEffect(() => {
    const keyword = search.trim();
    if (keyword === pageData.keyword) return;

    const timeout = window.setTimeout(() => loadPage(1, keyword), 300);
    return () => window.clearTimeout(timeout);
  }, [loadPage, pageData.keyword, search]);

  const updateSearch = (value: string) => {
    latestPageRequest.current += 1;
    setPageError(null);
    setSearch(value);
  };

  const openConfirmation = () => {
    if (selectedMarketersById.size === 0) {
      setSelectionError("Select at least one marketer to continue.");
      return;
    }
    setSelectionError(null);
    setConfirmationOpen(true);
  };

  const sendRequests = () => {
    const marketerIds = selectedMarketers.map((marketer) => marketer.marketer_id);
    startSendTransition(async () => {
      let result: JobRequestActionState;
      try {
        result = await sendJobRequests(jobId, marketerIds);
      } catch {
        result = {
          status: "error",
          message: "The request could not be completed. Please try again.",
        };
      }
      startSendTransition(() => {
        setState(result);
        setConfirmationOpen(false);
        setDuplicateDialogOpen(result.status === "duplicate");
        if (result.status === "success") setSelectedMarketersById(new Map());
      });
    });
  };

  if (totalMarketers === 0 && pageData.keyword === "") {
    return (
      <Card className="mk-card mk-card-padding">
        <EmptyState
          title="No marketers are available yet"
          description="Marketers will appear here once they publish a profile and service listing."
        />
      </Card>
    );
  }

  return (
    <>
      <div ref={portalContainer} />
      <section aria-labelledby="choose-marketers-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="choose-marketers-heading" className="sr-only">
              Choose marketers
            </h2>
            <p className="text-sm text-[var(--mk-muted)]">{totalMarketers} marketers available</p>
          </div>
          {selectedMarketersById.size > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isBusy}
              onClick={clearSelection}
            >
              Clear selection
            </Button>
          ) : null}
          <div className="w-full sm:max-w-xs">
            <div className="relative">
              <label htmlFor="job-marketer-filter" className="sr-only">
                Search marketers by name, bio, or service
              </label>
              <Input
                id="job-marketer-filter"
                type="search"
                value={search}
                maxLength={100}
                onChange={(event) => updateSearch(event.target.value)}
                placeholder="Search by name, bio, or service"
                className="h-12 rounded-xl pr-11 text-base"
              />
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-[var(--mk-muted)]"
              />
            </div>
          </div>
        </div>

        {selectionError ? (
          <p className="text-sm text-destructive" role="alert">
            {selectionError}
          </p>
        ) : null}
        {pageError ? (
          <div className="mk-error-notice rounded-xl p-4" role="alert">
            <p className="font-semibold">Marketers could not be loaded</p>
            <p className="mt-1 text-sm">{pageError}</p>
          </div>
        ) : null}
        <JobRequestFeedback state={state} />

        <div role="group" aria-label="Select marketers to invite" className="min-w-0">
          <MarketerOptions
            marketers={marketers}
            isLoading={searchIsStale || isLoadingPage}
            searchFailed={searchIsStale && pageError !== null}
            keyword={pageData.keyword}
            selectedMarketersById={selectedMarketersById}
            disabled={isBusy}
            onChange={toggleMarketer}
          />
        </div>

        {totalMarketers > 0 ? (
          <nav
            aria-label="Marketer pages"
            className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--mk-border)] pt-4"
          >
            <p className="text-sm text-[var(--mk-muted)]" role="status">
              Showing {Math.min((page - 1) * pageSize + 1, totalMarketers)}–
              {Math.min(page * pageSize, totalMarketers)} of {totalMarketers} marketers · Page{" "}
              {page} of {pageCount}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isBusy || page <= 1}
                onClick={() => loadPage(page - 1, search.trim())}
              >
                Previous page
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isBusy || page >= pageCount}
                onClick={() => loadPage(page + 1, search.trim())}
              >
                {isLoadingPage ? "Loading…" : "Next page"}
              </Button>
            </div>
          </nav>
        ) : null}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--mk-border)] bg-[color-mix(in_srgb,var(--mk-surface)_96%,transparent)] px-[var(--mk-gutter)] pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur sm:sticky sm:inset-x-auto sm:z-20 sm:mx-auto sm:mt-5 sm:w-full sm:max-w-5xl">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-2 flex items-center justify-between gap-2 text-sm">
            <span className="text-[var(--mk-muted)]">Selected</span>
            <span className="font-semibold text-[var(--mk-accent)]">
              {selectedMarketersById.size}{" "}
              {selectedMarketersById.size === 1 ? "marketer" : "marketers"} selected
            </span>
          </div>
          <Button
            type="button"
            className="mk-primary-button w-full justify-center font-semibold"
            disabled={isBusy || selectedMarketersById.size === 0}
            onClick={openConfirmation}
          >
            {isSending ? "Sending…" : "Review & Send"}
          </Button>
        </div>
      </div>

      <ConfirmationDialog
        jobId={jobId}
        open={confirmationOpen}
        isPending={isSending}
        portalContainer={portalContainer}
        selectedMarketers={selectedMarketers}
        onOpenChange={setConfirmationOpen}
        onConfirm={sendRequests}
      />
      <DuplicateRequestDialog
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        onReview={() => setDuplicateDialogOpen(false)}
        portalContainer={portalContainer}
      />
    </>
  );
}
