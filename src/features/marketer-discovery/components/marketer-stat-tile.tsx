import type { ReactNode } from "react";

type MarketerStatTileProps = {
  label: string;
  icon: ReactNode;
  value: ReactNode;
};

export function MarketerStatTile({ label, icon, value }: MarketerStatTileProps) {
  return (
    <div className="rounded-2xl bg-background/30 p-4 shadow-card">
      <p className="text-xs font-medium text-muted-strong">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        {icon}
        {value}
      </div>
    </div>
  );
}
