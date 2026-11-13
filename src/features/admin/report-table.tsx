import Link from "next/link";
import type { ReactNode } from "react";

export function ReportPagination({
  path,
  page,
  pageSize,
  total,
  status = "",
}: {
  path: string;
  page: number;
  pageSize: number;
  total: number;
  status?: string;
}) {
  const last = Math.max(1, Math.ceil(total / pageSize));
  const href = (target: number) => {
    const query = new URLSearchParams({ page: String(target) });
    if (status) query.set("status", status);
    return `${path}?${query}`;
  };
  return (
    <nav
      className="flex flex-wrap items-center gap-4 text-sm text-zinc-700"
      aria-label="Results pages"
    >
      <span>{total} results</span>
      {page > last ? (
        <Link className="underline" href={href(last)}>
          Go to page {last}
        </Link>
      ) : (
        <>
          <span>
            Page {page} of {last}
          </span>
          {page > 1 && (
            <Link className="underline" href={href(page - 1)}>
              Previous page
            </Link>
          )}
          {page < last && (
            <Link className="underline" href={href(page + 1)}>
              Next page
            </Link>
          )}
        </>
      )}
    </nav>
  );
}

export function ReportTable({
  columns,
  rows,
  empty,
}: {
  columns: readonly string[];
  rows: { id: number; cells: ReactNode[] }[];
  empty: string;
}) {
  if (!rows.length) return <p className="text-zinc-700">{empty}</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
      <table className="w-full min-w-[38rem] text-left text-sm text-zinc-900">
        <thead className="bg-zinc-100">
          <tr>
            {columns.map((column) => (
              <th scope="col" key={column} className="p-3">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200">
          {rows.map(({ id, cells }) => (
            <tr key={id}>
              {cells.map((cell, index) => (
                <td className="p-3 align-top" key={columns[index]}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
