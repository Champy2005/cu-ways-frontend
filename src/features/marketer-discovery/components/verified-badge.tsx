import Image from "next/image";

type VerifiedBadgeProps = {
  size?: number;
};

/**
 * The green check from the Figma frames, exported from the design file rather
 * than redrawn (public/marketers/verified-badge.svg).
 */
export function VerifiedBadge({ size = 16 }: VerifiedBadgeProps) {
  return (
    <Image
      src="/marketers/verified-badge.svg"
      alt="Verified marketer"
      width={size}
      height={size}
      className="shrink-0"
    />
  );
}
