import { InlineError } from "@/components/feedback/inline-error";
import { ReportPagination, ReportTable } from "@/features/admin/report-table";
import { listFlaggedMarketers, reportPage } from "@/features/admin/reports";
import { formatTHB } from "@/features/transactions/format";
import { getDisplayError } from "@/lib/api/errors";

export default async function FlaggedMarketersPage({
  searchParams,
}: PageProps<"/admin/flagged-marketers">) {
  const page = reportPage((await searchParams).page);
  const result = await listFlaggedMarketers(page).then(
    (data) => ({ data, error: null }),
    (error: unknown) => ({ data: null, error }),
  );
  return (
    <section className="space-y-5 text-zinc-950">
      <h1 className="text-2xl font-semibold">Flagged marketers</h1>
      <p className="text-sm text-zinc-700">
        Marketers with at least two hired jobs that were cancelled or received a review below three
        stars.
      </p>
      {result.data ? (
        <>
          <ReportTable
            columns={["Marketer ID", "Name", "Flagged jobs", "Accepted offer value", "Attachments"]}
            empty="No marketers meet the reporting threshold."
            rows={result.data.items.map((marketer) => ({
              id: marketer.marketer_id,
              cells: [
                marketer.marketer_id,
                marketer.name,
                marketer.flagged_jobs,
                formatTHB(marketer.total_value),
                marketer.attachment_count,
              ],
            }))}
          />
          <ReportPagination
            path="/admin/flagged-marketers"
            page={result.data.page}
            pageSize={result.data.page_size}
            total={result.data.total}
          />
        </>
      ) : (
        <InlineError message={getDisplayError(result.error)} />
      )}
    </section>
  );
}
