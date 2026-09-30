import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-3 py-0.5 text-[10px] font-medium font-sans tracking-[0.18em] uppercase w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none transition-colors duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-foreground/[0.06] text-foreground",
        outline:
          "border-foreground/25 text-foreground/80 hover:border-foreground/50",
        forest:
          "border-foreground/20 text-foreground bg-brand-green/25 dark:border-brand-green/40 dark:text-brand-green dark:bg-brand-green/10",
        amber:
          "border-brand-azure/35 text-brand-azure bg-brand-cyan/10 dark:border-brand-cyan/40 dark:text-brand-cyan",
        river:
          "border-[color:var(--color-river)]/30 text-[color:var(--color-river)] bg-[color:var(--color-river)]/5",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-[color:var(--color-clay)]/30 text-[color:var(--color-clay)] bg-[color:var(--color-clay)]/5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
