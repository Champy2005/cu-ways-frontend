import { InlineError } from "@/components/feedback/inline-error";
import { ReportPagination, ReportTable } from "@/features/admin/report-table";
import { jobStatuses, listAdminJobs, reportPage } from "@/features/admin/reports";
import { formatTHB } from "@/features/transactions/format";
import { getDisplayError } from "@/lib/api/errors";

const paidDate = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Bangkok",
});

export default async function AdminJobsPage({ searchParams }: PageProps<"/admin/jobs">) {
  const raw = await searchParams;
  const status = jobStatuses.find((item) => item === raw.status) ?? "";
  const page = reportPage(raw.page);
  const result = await listAdminJobs(page, status).then(
    (data) => ({ data, error: null }),
    (error: unknown) => ({ data: null, error }),
  );
  return (
    <section className="space-y-5 text-zinc-950">
      <h1 className="text-2xl font-semibold">Jobs and payments</h1>
      <form action="/admin/jobs" className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm">
          Job status
          <select
            name="status"
            defaultValue={status}
            className="rounded-md border border-zinc-300 bg-white p-2"
          >
            <option value="">All statuses</option>
            {jobStatuses.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white">
          Filter jobs
        </button>
      </form>
      {result.data ? (
        <>
          <ReportTable
            columns={[
              "Job",
              "Creator",
              "Surveys",
              "Status",
              "Recorded amount",
              "Payment",
              "Paid at (ICT)",
            ]}
            empty="No jobs match this status."
            rows={result.data.items.map((job) => ({
              id: job.job_id,
              cells: [
                `#${job.job_id}`,
                job.creator_name,
                job.survey_titles.join(", ") || "—",
                job.job_status,
                job.amount === null ? "—" : formatTHB(job.amount),
                job.payment_status ?? "Not paid",
                job.paid_at ? (
                  <time dateTime={job.paid_at} title={job.paid_at}>
                    {paidDate.format(new Date(job.paid_at))}
                  </time>
                ) : (
                  "—"
                ),
              ],
            }))}
          />
          <ReportPagination
            path="/admin/jobs"
            page={result.data.page}
            pageSize={result.data.page_size}
            total={result.data.total}
            status={status}
          />
        </>
      ) : (
        <InlineError message={getDisplayError(result.error)} />
      )}
    </section>
  );
}
