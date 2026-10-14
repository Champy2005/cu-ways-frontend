import Image from "next/image";

/** Figma exports in public/register, at their root SVG size. */
const ASSETS = {
  "alert-circle": [19, 19.1414],
  "bird-creator": [53.9716, 51.342],
  "bird-marketer": [53.9716, 51.342],
  "bird-unsure": [29.9713, 28.5112],
  "eye-closed": [14.5004, 8.9076],
  "eye-open": [15.5004, 10.1662],
  spinner: [29, 29],
  "step-check": [18.8542, 13.6458],
  "step-done": [30, 30],
  "success-check": [60, 60],
  "success-creator": [204, 194.061],
  "success-marketer": [204, 194.061],
} as const;

export type RegisterAssetName = keyof typeof ASSETS;

export function RegisterAsset({
  name,
  className,
  alt = "",
}: {
  name: RegisterAssetName;
  className?: string;
  alt?: string;
}) {
  const [width, height] = ASSETS[name];
  return (
    <Image
      src={`/register/${name}.svg`}
      width={width}
      height={height}
      alt={alt}
      aria-hidden={alt === "" ? true : undefined}
      className={className}
    />
  );
}
