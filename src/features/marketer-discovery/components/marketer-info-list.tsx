type InfoRow = {
  label: string;
  value: string;
};

type MarketerInfoListProps = {
  rows: InfoRow[];
};

export function MarketerInfoList({ rows }: MarketerInfoListProps) {
  return (
    <dl className="flex flex-col gap-1.5">
      {rows.map((row) => (
        <div key={row.label} className="flex items-baseline justify-between gap-4">
          <dt className="text-[13px] text-label">{row.label}</dt>
          <dd className="text-right text-[13px] text-foreground/35">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
