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
          "bg-foreground text-background hover:bg-navy-2 dark:hover:bg-brand-blue",
        forest:
          "bg-navy text-brand-green hover:bg-navy-2 dark:bg-brand-green dark:text-navy dark:hover:bg-brand-blue",
        amber:
          "bg-brand-green text-navy hover:bg-brand-blue shadow-[0_10px_28px_-12px_rgba(136,255,154,0.75)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:opacity-90 focus-visible:ring-destructive/40",
        outline:
          "border border-foreground/20 bg-transparent text-foreground hover:border-foreground/40 hover:bg-foreground/[0.04]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        ghost:
          "bg-transparent hover:bg-foreground/[0.06] text-foreground",
        link:
          "text-foreground dark:text-brand-green underline-offset-4 hover:underline rounded-none",
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
