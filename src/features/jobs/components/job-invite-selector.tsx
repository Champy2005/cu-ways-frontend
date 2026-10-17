"use client";

import { Check, Search, Star } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";

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
  loadJobSentInvitations,
  sendJobRequests,
  type JobInviteMarketersPageState,
  type JobRequestActionState,
} from "@/features/jobs/actions";
import { isActiveJobInvitation } from "@/features/jobs/types";
import type {
  CreatorJobSummary,
  JobInviteMarketer,
  SentJobInvitation,
} from "@/features/jobs/types";

type JobInviteSelectorProps = {
  jobId: number;
  jobStatus?: CreatorJobSummary["job_status"];
  marketers: JobInviteMarketer[];
  totalMarketers: number;
  pageSize: number;
  marketersError?: string;
  sentInvitations: SentJobInvitation[];
  sentInvitationsFresh: boolean;
  sentInvitationsError?: string;
};

type MarketerOptionProps = {
  marketer: JobInviteMarketer;
  checked: boolean;
  disabled: boolean;
  invitationStatus?: "Pending" | "Accepted";
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

function MarketerOption({
  marketer,
  checked,
  disabled,
  invitationStatus,
  onChange,
}: MarketerOptionProps) {
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
          {invitationStatus ? (
            <span className="mt-1 inline-flex rounded-full border border-[var(--mk-border)] bg-[var(--mk-field)] px-2 py-0.5 text-[0.65rem] font-medium text-[var(--mk-muted)]">
              {invitationStatus} invitation
            </span>
          ) : null}
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
  activeStatusByMarketerId,
  onChange,
}: {
  marketers: JobInviteMarketer[];
  isLoading: boolean;
  searchFailed: boolean;
  keyword: string;
  selectedMarketersById: Map<number, JobInviteMarketer>;
  disabled: boolean;
  activeStatusByMarketerId: Map<number, "Pending" | "Accepted">;
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
          disabled={disabled || activeStatusByMarketerId.has(marketer.marketer_id)}
          invitationStatus={activeStatusByMarketerId.get(marketer.marketer_id)}
          onChange={onChange}
        />
      ))}
    </ul>
  );
}

function MarketerSearchToolbar({
  selectedCount,
  totalAvailable,
  isBusy,
  search,
  onClear,
  onSearchChange,
}: {
  selectedCount: number;
  totalAvailable: number;
  isBusy: boolean;
  search: string;
  onClear: () => void;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id="choose-marketers-heading" className="sr-only">
          Choose marketers
        </h2>
        <p className="text-sm text-[var(--mk-muted)]">{totalAvailable} marketers available</p>
      </div>
      {selectedCount > 0 ? (
        <Button type="button" variant="ghost" size="sm" disabled={isBusy} onClick={onClear}>
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
            onChange={(event) => onSearchChange(event.target.value)}
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
  );
}

function InvitationSelectionFeedback({
  selectionError,
  pageError,
  isBusy,
  isLoadingPage,
  onRetry,
}: {
  selectionError: string | null;
  pageError: string | null;
  isBusy: boolean;
  isLoadingPage: boolean;
  onRetry: () => void;
}) {
  return (
    <>
      {selectionError ? (
        <p className="text-sm text-destructive" role="alert">
          {selectionError}
        </p>
      ) : null}
      {pageError ? (
        <div className="mk-error-notice rounded-xl p-4" role="alert">
          <p className="font-semibold">Marketers could not be loaded</p>
          <p className="mt-1 text-sm">{pageError}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            disabled={isBusy}
            onClick={onRetry}
          >
            {isLoadingPage ? "Loading…" : "Retry marketer search"}
          </Button>
        </div>
      ) : null}
    </>
  );
}

function MarketerPagination({
  total,
  page,
  pageSize,
  pageCount,
  isBusy,
  isLoadingPage,
  onPageChange,
}: {
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  isBusy: boolean;
  isLoadingPage: boolean;
  onPageChange: (nextPage: number) => void;
}) {
  if (total === 0) return null;

  return (
    <nav
      aria-label="Marketer pages"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--mk-border)] pt-4"
    >
      <p className="text-sm text-[var(--mk-muted)]" role="status">
        Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of{" "}
        {total} marketers · Page {page} of {pageCount}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isBusy || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous page
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isBusy || page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          {isLoadingPage ? "Loading…" : "Next page"}
        </Button>
      </div>
    </nav>
  );
}

function JobRequestFeedback({
  state,
  canInvite,
}: {
  state: JobRequestActionState;
  canInvite: boolean;
}) {
  switch (state.status) {
    case "duplicate":
      return null;
    case "reconcile":
      return (
        <div className="mk-error-notice rounded-xl p-4" role="alert">
          <p className="font-semibold">Invitation status needs a refresh</p>
          <p className="mt-1 text-sm">{state.message}</p>
        </div>
      );
    case "job_not_pending":
      return (
        <div className="mk-error-notice rounded-xl p-4" role="alert">
          <p className="font-semibold">Invitations are closed for this job</p>
          <p className="mt-1 text-sm">{state.message}</p>
        </div>
      );
    case "idle":
      return canInvite ? null : (
        <div className="mk-error-notice rounded-xl p-4" role="status">
          <p className="font-semibold">Invitations are closed for this job</p>
          <p className="mt-1 text-sm">
            Invitations can only be sent while a job is pending. Your sent invitation history
            remains available.
          </p>
        </div>
      );
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
          {state.requests.length === 1
            ? "Request sent to 1 marketer."
            : `Requests sent to ${state.requests.length} marketers.`}
        </p>
      );
    default:
      return null;
  }
}

function invitationStatusClass(status: SentJobInvitation["request_status"]): string {
  switch (status) {
    case "Pending":
      return "border-[color-mix(in_srgb,var(--mk-caution)_30%,var(--mk-border))] bg-[var(--mk-caution-soft)] text-[var(--mk-caution)]";
    case "Accepted":
      return "border-[color-mix(in_srgb,var(--mk-success)_30%,var(--mk-border))] bg-[var(--mk-positive-soft)] text-[var(--mk-success)]";
    case "Declined":
      return "border-[color-mix(in_srgb,var(--mk-error)_28%,var(--mk-border))] bg-[color-mix(in_srgb,var(--mk-error)_10%,var(--mk-surface))] text-[var(--mk-error)]";
    case "Closed":
      return "border-[var(--mk-border)] bg-[var(--mk-field)] text-[var(--mk-muted)]";
  }
}

function SentInvitationCard({ invitation }: { invitation: SentJobInvitation }) {
  return (
    <li className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-[var(--mk-border)] bg-[var(--mk-surface)] p-4">
      <div className="min-w-0">
        <p className="truncate font-semibold text-[var(--mk-text)]">{invitation.marketer_name}</p>
        <p className="mt-1 text-xs text-[var(--mk-muted)]">
          Sent {invitation.created_at.slice(0, 10)}
        </p>
      </div>
      <span
        className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${invitationStatusClass(invitation.request_status)}`}
      >
        {invitation.request_status}
      </span>
    </li>
  );
}

function DirectInvitationsSection({
  invitations,
  isFresh,
  error,
  isRefreshing,
  canInvite,
  onRefresh,
}: {
  invitations: SentJobInvitation[];
  isFresh: boolean;
  error: string | null;
  isRefreshing: boolean;
  canInvite: boolean;
  onRefresh: () => void;
}) {
  return (
    <section aria-labelledby="direct-invitations-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--mk-border)] pb-4">
        <div>
          <h2
            id="direct-invitations-heading"
            className="text-lg font-semibold text-[var(--mk-text)]"
          >
            Direct Invitations
          </h2>
          <p className="mt-1 text-sm text-[var(--mk-muted)]">
            Review invitations already sent for this job.
          </p>
        </div>
        {canInvite ? (
          <a
            href="#choose-marketers-heading"
            className="mk-primary-button inline-flex min-h-11 items-center justify-center px-4 text-sm font-semibold"
          >
            Invite Marketers
          </a>
        ) : null}
      </div>

      {!isFresh ? (
        <div className="mk-error-notice rounded-xl p-4" role="alert">
          <p className="font-semibold">Current invitation statuses are unavailable</p>
          <p className="mt-1 text-sm">
            {error ?? "Refresh current invitations before sending more requests."}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            disabled={isRefreshing}
            onClick={onRefresh}
          >
            {isRefreshing ? "Refreshing…" : "Refresh invitations"}
          </Button>
        </div>
      ) : invitations.length === 0 ? (
        <Card className="mk-card mk-card-padding gap-2">
          <p className="font-semibold">
            {canInvite ? "No invitations sent yet" : "No invitations were sent for this job"}
          </p>
          <p className="text-sm leading-6 text-[var(--mk-muted)]">
            {canInvite
              ? "Choose marketers below to send the first direct invitation for this job."
              : "This job is no longer pending, so invitations cannot be sent."}
          </p>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {invitations.map((invitation) => (
            <SentInvitationCard key={invitation.job_request_id} invitation={invitation} />
          ))}
        </ul>
      )}
    </section>
  );
}

type StateSetter<Value> = Dispatch<SetStateAction<Value>>;

type RequestResultSetters = {
  setState: StateSetter<JobRequestActionState>;
  setConfirmationOpen: StateSetter<boolean>;
  setSentInvitations: StateSetter<SentJobInvitation[]>;
  setSentInvitationsFresh: StateSetter<boolean>;
  setSentInvitationsError: StateSetter<string | null>;
  setSelectedMarketersById: StateSetter<Map<number, JobInviteMarketer>>;
  setDuplicateMarketerNames: StateSetter<string[]>;
  setDuplicateRefreshFailed: StateSetter<boolean>;
  setDuplicateDialogOpen: StateSetter<boolean>;
};

function applyRequestResult(
  result: JobRequestActionState,
  selectedMarketers: JobInviteMarketer[],
  setters: RequestResultSetters,
) {
  setters.setState(result);
  setters.setConfirmationOpen(false);

  switch (result.status) {
    case "success": {
      const namesById = new Map<number, string>(
        selectedMarketers.map((marketer) => [marketer.marketer_id, marketer.display_name]),
      );
      const createdInvitations: SentJobInvitation[] = result.requests
        .map((request) => ({
          ...request,
          marketer_name: namesById.get(request.marketer_id) ?? `Marketer #${request.marketer_id}`,
        }))
        .sort((left, right) => right.job_request_id - left.job_request_id);
      setters.setSentInvitations((current) => [...createdInvitations, ...current]);
      setters.setSentInvitationsFresh(true);
      setters.setSentInvitationsError(null);
      setters.setSelectedMarketersById(new Map());
      setters.setDuplicateMarketerNames([]);
      setters.setDuplicateDialogOpen(false);
      return;
    }
    case "duplicate":
      if (result.refreshStatus === "success") {
        applyRefreshedDuplicate(result, selectedMarketers, setters);
      } else {
        setters.setSentInvitationsFresh(false);
        setters.setSentInvitationsError(result.message);
        setters.setDuplicateMarketerNames([]);
        setters.setDuplicateRefreshFailed(true);
        setters.setDuplicateDialogOpen(true);
      }
      return;
    case "reconcile":
      setters.setSentInvitationsFresh(false);
      setters.setSentInvitationsError(result.message);
      setters.setDuplicateDialogOpen(false);
      return;
    default:
      setters.setDuplicateDialogOpen(false);
  }
}

function applyRefreshedDuplicate(
  result: Extract<JobRequestActionState, { status: "duplicate"; refreshStatus: "success" }>,
  selectedMarketers: JobInviteMarketer[],
  setters: RequestResultSetters,
) {
  const conflictingIds = new Set(result.conflictingMarketerIds);
  const conflictingNames = selectedMarketers
    .filter((marketer) => conflictingIds.has(marketer.marketer_id))
    .map((marketer) => marketer.display_name);
  setters.setSentInvitations(result.sentInvitations);
  setters.setSentInvitationsFresh(true);
  setters.setSentInvitationsError(null);
  setters.setSelectedMarketersById((current) => {
    const next = new Map(current);
    for (const marketerId of conflictingIds) next.delete(marketerId);
    return next;
  });
  setters.setDuplicateMarketerNames(conflictingNames);
  setters.setDuplicateRefreshFailed(false);
  setters.setDuplicateDialogOpen(true);
}

function DuplicateRequestDialog({
  open,
  onOpenChange,
  onReview,
  portalContainer,
  marketerNames,
  refreshFailed,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReview: () => void;
  portalContainer: RefObject<HTMLDivElement | null>;
  marketerNames: string[];
  refreshFailed: boolean;
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
              {refreshFailed
                ? "The server rejected this batch because an active invitation exists, but current statuses could not be refreshed. Refresh the invitation list before trying again."
                : marketerNames.length > 0
                  ? "These selected marketers already have an active invitation. They were removed from your selection."
                  : "The invitation status changed while you were sending. Review the current list before trying again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {marketerNames.length > 0 ? (
            <ul aria-label="Marketers with active invitations" className="-mt-2 space-y-1 text-sm">
              {marketerNames.map((name) => (
                <li key={name} className="rounded-lg bg-[var(--mk-field)] px-3 py-2">
                  {name}
                </li>
              ))}
            </ul>
          ) : null}
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
  jobStatus = "Pending",
  marketers: initialMarketers,
  totalMarketers: initialTotalMarketers,
  pageSize: initialPageSize,
  sentInvitations: initialSentInvitations,
  sentInvitationsFresh: initialSentInvitationsFresh,
  sentInvitationsError: initialSentInvitationsError,
  marketersError: initialMarketersError,
}: JobInviteSelectorProps) {
  const [closedJobId, setClosedJobId] = useState<number | null>(null);
  const [state, setState] = useState<JobRequestActionState>(INITIAL_ACTION_STATE);
  const [isSending, startSendTransition] = useTransition();
  const [isLoadingPage, startPageTransition] = useTransition();
  const [isRefreshingInvitations, startRefreshTransition] = useTransition();
  const [sentInvitations, setSentInvitations] = useState(initialSentInvitations);
  const [sentInvitationsFresh, setSentInvitationsFresh] = useState(initialSentInvitationsFresh);
  const [sentInvitationsError, setSentInvitationsError] = useState<string | null>(
    initialSentInvitationsFresh
      ? null
      : (initialSentInvitationsError ?? "Refresh before sending more invitations."),
  );
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
  const [pageError, setPageError] = useState<string | null>(initialMarketersError ?? null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateMarketerNames, setDuplicateMarketerNames] = useState<string[]>([]);
  const [duplicateRefreshFailed, setDuplicateRefreshFailed] = useState(false);
  const portalContainer = useRef<HTMLDivElement>(null);
  const latestPageRequest = useRef(0);

  const { marketers, page, pageSize, totalMarketers } = pageData;
  const pageCount = Math.max(1, Math.ceil(totalMarketers / pageSize));
  const selectedMarketers = useMemo(
    () => [...selectedMarketersById.values()],
    [selectedMarketersById],
  );
  const activeStatusByMarketerId = useMemo(() => {
    const result = new Map<number, "Pending" | "Accepted">();
    for (const invitation of sentInvitations) {
      if (invitation.request_status === "Pending" || invitation.request_status === "Accepted") {
        result.set(invitation.marketer_id, invitation.request_status);
      }
    }
    return result;
  }, [sentInvitations]);
  const searchIsStale = pageData.keyword !== search.trim();
  const canInvite = jobStatus === "Pending" && closedJobId !== jobId;
  const isBusy = isSending || isLoadingPage || isRefreshingInvitations || searchIsStale;

  const toggleMarketer = (marketerId: number, checked: boolean) => {
    if (!canInvite || !sentInvitationsFresh || activeStatusByMarketerId.has(marketerId)) return;
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

  const refreshInvitations = () => {
    startRefreshTransition(async () => {
      let result: Awaited<ReturnType<typeof loadJobSentInvitations>>;
      try {
        result = await loadJobSentInvitations(jobId);
      } catch {
        result = {
          status: "error",
          message:
            "Current invitations could not be refreshed. Check your connection and try again.",
        };
      }
      startRefreshTransition(() => {
        if (result.status === "error") {
          setSentInvitationsFresh(false);
          setSentInvitationsError(result.message);
          return;
        }

        const activeIds = new Set(
          result.items.filter(isActiveJobInvitation).map((invitation) => invitation.marketer_id),
        );
        const conflictingSelected = selectedMarketers.filter((marketer) =>
          activeIds.has(marketer.marketer_id),
        );
        setSentInvitations(result.items);
        setSentInvitationsFresh(true);
        setSentInvitationsError(null);
        setSelectedMarketersById((current) => {
          const next = new Map(current);
          for (const marketerId of activeIds) next.delete(marketerId);
          return next;
        });
        if (conflictingSelected.length > 0) {
          setDuplicateMarketerNames(conflictingSelected.map((marketer) => marketer.display_name));
          setDuplicateRefreshFailed(false);
          setState({
            status: "duplicate",
            refreshStatus: "success",
            sentInvitations: result.items,
            conflictingMarketerIds: conflictingSelected.map((marketer) => marketer.marketer_id),
            message:
              "Current invitation statuses are refreshed. Active invitations were removed from your selection.",
          });
          setDuplicateDialogOpen(true);
        } else {
          setState(INITIAL_ACTION_STATE);
          setDuplicateMarketerNames([]);
          setDuplicateRefreshFailed(false);
          setDuplicateDialogOpen(false);
        }
      });
    });
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
    if (!canInvite) return;
    if (!sentInvitationsFresh) {
      setSelectionError("Refresh current invitations before sending.");
      return;
    }
    if (selectedMarketersById.size === 0) {
      setSelectionError("Select at least one marketer to continue.");
      return;
    }
    if (selectedMarketers.some((marketer) => activeStatusByMarketerId.has(marketer.marketer_id))) {
      setSelectedMarketersById((current) => {
        const next = new Map(current);
        for (const marketerId of activeStatusByMarketerId.keys()) next.delete(marketerId);
        return next;
      });
      setSelectionError(
        "Active invitations were removed from your selection. Review the updated statuses.",
      );
      return;
    }
    setSelectionError(null);
    setConfirmationOpen(true);
  };

  const sendRequests = () => {
    if (!canInvite) {
      setConfirmationOpen(false);
      return;
    }
    if (!sentInvitationsFresh) {
      setConfirmationOpen(false);
      setSelectionError("Refresh current invitations before sending.");
      return;
    }
    if (selectedMarketers.some((marketer) => activeStatusByMarketerId.has(marketer.marketer_id))) {
      setConfirmationOpen(false);
      setSelectionError(
        "Active invitations were removed from your selection. Review the updated statuses.",
      );
      return;
    }
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
        applyRequestResult(result, selectedMarketers, {
          setState,
          setConfirmationOpen,
          setSentInvitations,
          setSentInvitationsFresh,
          setSentInvitationsError,
          setSelectedMarketersById,
          setDuplicateMarketerNames,
          setDuplicateRefreshFailed,
          setDuplicateDialogOpen,
        });
        if (result.status === "job_not_pending") setClosedJobId(jobId);
      });
    });
  };

  return (
    <>
      <div ref={portalContainer} />
      <DirectInvitationsSection
        invitations={sentInvitations}
        isFresh={sentInvitationsFresh}
        error={sentInvitationsError}
        isRefreshing={isRefreshingInvitations}
        canInvite={canInvite}
        onRefresh={refreshInvitations}
      />
      <section aria-labelledby="choose-marketers-heading" className="space-y-4">
        <MarketerSearchToolbar
          selectedCount={selectedMarketersById.size}
          totalAvailable={totalMarketers}
          isBusy={isBusy}
          search={search}
          onClear={clearSelection}
          onSearchChange={updateSearch}
        />
        <InvitationSelectionFeedback
          selectionError={selectionError}
          pageError={pageError}
          isBusy={isBusy}
          isLoadingPage={isLoadingPage}
          onRetry={() => loadPage(page, search.trim())}
        />
        <JobRequestFeedback state={state} canInvite={canInvite} />

        <div role="group" aria-label="Select marketers to invite" className="min-w-0">
          <MarketerOptions
            marketers={marketers}
            isLoading={searchIsStale || isLoadingPage}
            searchFailed={pageError !== null && (searchIsStale || pageData.marketers.length === 0)}
            keyword={pageData.keyword}
            selectedMarketersById={selectedMarketersById}
            disabled={isBusy || !sentInvitationsFresh || !canInvite}
            activeStatusByMarketerId={activeStatusByMarketerId}
            onChange={toggleMarketer}
          />
        </div>

        <MarketerPagination
          total={totalMarketers}
          page={page}
          pageSize={pageSize}
          pageCount={pageCount}
          isBusy={isBusy}
          isLoadingPage={isLoadingPage}
          onPageChange={(nextPage) => loadPage(nextPage, search.trim())}
        />
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
            disabled={
              isBusy || !canInvite || !sentInvitationsFresh || selectedMarketersById.size === 0
            }
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
        marketerNames={duplicateMarketerNames}
        refreshFailed={duplicateRefreshFailed}
      />
    </>
  );
}
