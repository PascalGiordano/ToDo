
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, indicatorClassName, style, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
    style={style} // The style containing the CSS variable definition is applied here to the Root
  >
    <ProgressPrimitive.Indicator
      className={cn("h-full w-full flex-1 bg-primary transition-all", indicatorClassName)} // bg-primary or other class-based background acts as a fallback
      style={{
        transform: `translateX(-${100 - (value || 0)}%)`,
        // If the `style` prop (for Root) defines '--custom-progress-indicator-color',
        // then the Indicator's background should use this CSS variable.
        // This inline style will override the class-based background if the condition is met.
        // Otherwise, backgroundColor will be undefined here, and CSS classes will determine it.
        backgroundColor: (style && typeof style === 'object' && style['--custom-progress-indicator-color']) ? 'var(--custom-progress-indicator-color)' : undefined,
      }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
