"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";

import { cn } from "@/lib/utils";

/**
 * Range slider. Pass a tuple to `value` for two thumbs, a number for one.
 * Renders one thumb per value, matching Base UI's own convention.
 */
function Slider({
  className,
  value,
  thumbLabels,
  ...props
}: SliderPrimitive.Root.Props<number | number[]> & { thumbLabels?: string[] }) {
  const thumbCount = Array.isArray(value) ? value.length : 1;

  return (
    <SliderPrimitive.Root data-slot="slider" value={value} {...props}>
      <SliderPrimitive.Control
        className={cn("flex w-full touch-none items-center py-2 select-none", className)}
      >
        <SliderPrimitive.Track className="h-1.5 w-full rounded-full bg-muted-strong/40 select-none">
          <SliderPrimitive.Indicator className="h-full rounded-full bg-brand select-none" />
          {Array.from({ length: thumbCount }, (_, index) => (
            <SliderPrimitive.Thumb
              key={index}
              getAriaLabel={() => thumbLabels?.[index] ?? `Value ${index + 1}`}
              className="size-4 rounded-full bg-background shadow-[0px_2px_3px_0px_rgba(0,0,0,0.25)] outline-2 outline-brand select-none focus-visible:outline-3 focus-visible:outline-ring"
            />
          ))}
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
