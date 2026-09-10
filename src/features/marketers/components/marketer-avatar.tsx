import { cn } from "@/lib/utils";

type MarketerAvatarProps = {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "size-10 text-base",
  md: "size-16 text-2xl",
  lg: "size-[92px] text-4xl",
};

/**
 * Initials-only avatar. Marketer photos would come from the backend, which has
 * no marketer contract yet, so there is nothing to load — and a single initial
 * is what the Figma Avatar component documents anyway.
 */
export function MarketerAvatar({ name, size = "md", className }: MarketerAvatarProps) {
  const initial = name
    .replace(/^(mr|ms|mrs|dr)\.?\s+/i, "")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-brand-subtle font-medium text-brand",
        sizeClasses[size],
        className,
      )}
    >
      {initial || "?"}
    </span>
  );
}
