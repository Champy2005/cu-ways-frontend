import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusText } from "@/components/ui/status-text";
import { formatDate } from "@/features/job-invitations/format";
import { ApiError } from "@/lib/api/errors";
import { requireSession } from "@/lib/auth/guards";
import { formatTHB } from "./format";
import { HistoryPagination, HistorySearch, RetryButton } from "./history-controls";
import { historyHref, readHistoryQuery } from "./history-url";
import { listTransactions, transactionPageSize } from "./queries";
import type { Transaction, Workspace } from "./types";

export async function TransactionHistory({
  workspace,
  searchParams,
}: {
  workspace: Workspace;
  searchParams: Promise<{ keyword?: string | string[]; page?: string | string[] }>;
}) {
  await requireSession();
  const { keyword, page } = readHistoryQuery(await searchParams);
  return (
    <section className="mx-auto w-full max-w-[1100px] space-y-5">
      <header>
        <h1 className="mk-page-title">Transactions</h1>
        <p className="mt-1 text-sm text-[var(--mk-muted)]">
          Payment records for your completed jobs.
        </p>
      </header>
      <HistorySearch workspace={workspace} keyword={keyword} />
      <Suspense fallback={<p role="status">Loading transactions…</p>}>
        <HistoryResults workspace={workspace} keyword={keyword} page={page} />
      </Suspense>
    </section>
  );
}

async function HistoryResults({
  workspace,
  keyword,
  page,
}: {
  workspace: Workspace;
  keyword: string;
  page: number;
}) {
  let result;
  let emptyHistory;
  try {
    result = await listTransactions(workspace, keyword, page);
    emptyHistory =
      result.total === 0 && (!keyword || (await listTransactions(workspace, "", 1)).total === 0);
  } catch (error) {
    return <HistoryFailure expired={error instanceof ApiError && error.status === 401} />;
  }

  const pages = Math.ceil(result.total / transactionPageSize);
  if (page > Math.max(1, pages)) redirect(historyHref(workspace, keyword));
  if (result.total === 0) return <EmptyHistory workspace={workspace} emptyHistory={emptyHistory} />;

  return (
    <>
      <h2
        id="transaction-results-heading"
        tabIndex={-1}
        className="text-sm text-[var(--mk-muted)]"
        aria-live="polite"
      >
        {result.total} completed {result.total === 1 ? "job" : "jobs"}
      </h2>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {result.items.map((item) => (
          <TransactionCard key={item.job_id} item={item} workspace={workspace} />
        ))}
      </div>
      <HistoryPagination workspace={workspace} keyword={keyword} page={page} pages={pages} />
    </>
  );
}

function HistoryFailure({ expired }: { expired: boolean }) {
  return (
    <div className="mk-card space-y-3 p-5" role="alert">
      <h2 className="font-semibold">Could not load transactions</h2>
      <p>
        {expired
          ? "Your session expired. Sign in again to continue."
          : "Your records could not be loaded."}
      </p>
      {expired ? (
        <Link href="/login" className="underline">
          Sign in
        </Link>
      ) : (
        <RetryButton />
      )}
    </div>
  );
}

function EmptyHistory({
  workspace,
  emptyHistory,
}: {
  workspace: Workspace;
  emptyHistory: boolean;
}) {
  const current =
    workspace === "creator"
      ? { href: "/creator/jobs", label: "My jobs" }
      : { href: "/marketer/offers", label: "My Offers" };
  const action = emptyHistory ? current : { href: historyHref(workspace), label: "Clear search" };
  return (
    <div className="mk-card space-y-3 p-5">
      <h2 className="font-semibold">
        {emptyHistory ? "No transactions yet" : "No matching transactions"}
      </h2>
      <p>
        {emptyHistory
          ? "Completed jobs with a recorded payment will appear here."
          : "Try another job number, title, name or payment method."}
      </p>
      <Link
        className="mk-secondary-button inline-flex min-h-12 items-center px-4"
        href={action.href}
      >
        {action.label}
      </Link>
    </div>
  );
}

function TransactionCard({ item, workspace }: { item: Transaction; workspace: Workspace }) {
  const jobHref = `/${workspace}/jobs/${item.job_id}`;
  return (
    <article className="mk-card min-w-0 space-y-3 p-5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <p>Job #{item.job_id}</p>
        <StatusText status="Completed" />
      </div>
      <h3 className="text-lg font-semibold wrap-anywhere">
        {item.job_title || `Job #${item.job_id}`}
      </h3>
      <p className="text-2xl font-semibold">{formatTHB(item.accepted_price)}</p>
      <p className="text-sm text-[var(--mk-muted)]">Accepted price</p>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt>Creator</dt>
          <dd className="wrap-anywhere">{item.creator.name}</dd>
        </div>
        <div>
          <dt>Marketer</dt>
          <dd className="wrap-anywhere">{item.marketer.name}</dd>
        </div>
        <div>
          <dt>Payment method</dt>
          <dd>{item.payment_method}</dd>
        </div>
        <div>
          <dt>Marketer payout</dt>
          <dd>
            <StatusText status={item.payout_status} />
          </dd>
        </div>
        <div className="col-span-2">
          <dt>Completed</dt>
          <dd>
            {item.completed_at ? (
              <time dateTime={item.completed_at}>{formatDate(item.completed_at)}</time>
            ) : (
              "Completion date unavailable"
            )}
          </dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-x-5">
        <Link className="inline-flex min-h-12 items-center underline" href={`${jobHref}/payment`}>
          View payment
        </Link>
        {workspace === "creator" && typeof item.has_review === "boolean" && (
          <Link className="inline-flex min-h-12 items-center underline" href={`${jobHref}/review`}>
            {item.has_review ? "View review" : "Write a review"}
          </Link>
        )}
      </div>
    </article>
  );
}
