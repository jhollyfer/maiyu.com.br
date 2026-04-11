import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium font-sans transition-all duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/30 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background hover:bg-[color:var(--color-forest)] hover:text-[color:var(--color-canvas-cream)] dark:hover:bg-[color:var(--color-forest-bright)]",
        forest:
          "bg-[color:var(--color-forest)] text-[color:var(--color-canvas-cream)] hover:bg-[color:var(--color-forest-bright)] dark:bg-[color:var(--color-forest-bright)] dark:text-[color:var(--color-canvas-night)]",
        amber:
          "bg-[color:var(--color-amber)] text-[color:var(--color-canvas-night)] hover:bg-[color:var(--color-amber-warm)] shadow-[0_1px_0_rgba(0,0,0,0.08),0_8px_24px_-8px_rgba(216,138,43,0.4)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:opacity-90 focus-visible:ring-destructive/40",
        outline:
          "border border-foreground/20 bg-transparent text-foreground hover:border-foreground/40 hover:bg-foreground/[0.04]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        ghost:
          "bg-transparent hover:bg-foreground/[0.06] text-foreground",
        link:
          "text-[color:var(--color-forest)] dark:text-[color:var(--color-forest-bright)] underline-offset-4 hover:underline rounded-none",
      },
      size: {
        default: "h-10 px-5 py-2 has-[>svg]:px-4",
        sm: "h-8 px-4 gap-1.5 text-xs has-[>svg]:px-3",
        lg: "h-12 px-7 text-[15px] has-[>svg]:px-6",
        xl: "h-14 px-9 text-base has-[>svg]:px-8",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
