"use client";
import * as ProgressPrimitive from "@radix-ui/react-progress";
// shadcn/ui Progress, styled with local design tokens (MIT).
export function Progress({
  value = 0,
  label,
}: {
  value?: number;
  label: string;
}) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <ProgressPrimitive.Root
      className="ui-progress"
      value={safe}
      aria-label={label}
    >
      <ProgressPrimitive.Indicator
        className="ui-progress-indicator"
        style={{ transform: `translateX(-${100 - safe}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
