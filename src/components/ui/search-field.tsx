import type { ComponentProps } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchField({
  label,
  className,
  ...props
}: ComponentProps<"input"> & { label: string }) {
  return (
    <label className={cn("workspace-search", className)}>
      <span className="sr-only">{label}</span>
      <Input {...props} aria-label={label} type="search" className="workspace-search-input" />
      <Search size={19} aria-hidden="true" />
    </label>
  );
}
