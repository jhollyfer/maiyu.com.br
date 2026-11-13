import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { cva } from 'class-variance-authority'
import type * as React from 'react'

import { buttonVariants } from '#/components/ui/button'
import { cn } from '#/lib/cn'
import type { Merge } from '@maiyu/shared'

/**
 * The site's pill: the round button of the hero, of the end of the home and of the inner
 * pages.
 *
 * It follows the aporta's `PillButton` piece (same name and same API, which goes to the kit):
 * `PillButton` IS a TanStack `Link` wearing the pill classes, and `pillVariants` returns the
 * class string. Never `Button render={<Link />}`: Base UI forces `role="button"` and wipes
 * out the link (#440, `frontend.md`). The tones live in the cva below, and not in
 * `ui/button.tsx`, because `ui/` is not edited here; they sit on top of `buttonVariants()`
 * with its default variant and size, the ones that interfere least (no dark-only classes,
 * and every tone sets `bg-*`, `hover:bg-*`, `h-*`, `px-*` and `gap-*`, which `cn` resolves in
 * the pill's favor).
 *
 * An external link is not a `Link`: use `<a className={pillVariants(...)}>`.
 *
 * In the public shell and not in `components/common/`: there the panel does not use it.
 *
 * The tone names are academy's; the colors are Maiyu's:
 *
 *   ink           the main action: navy with green in light, green with navy
 *                 in dark, the logo's pair
 *   outline       the secondary beside it; green at night
 *   neon          solid green, the conversation call, and the only one that lives
 *                 inside the navy band as well
 *   neon-outline  the secondary inside the navy band
 */
export type PillTone = 'ink' | 'outline' | 'neon' | 'neon-outline'
export type PillScale = 'md' | 'lg'
export type PillStyle = { tone?: PillTone; scale?: PillScale }

const pillToneVariants = cva(
  "rounded-full border-[1.5px] font-medium transition-[background-color,border-color,color,transform] duration-300 ease-out-expo active:scale-[0.98] motion-reduce:transition-none [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      tone: {
        ink: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/85 hover:text-primary-foreground',
        outline:
          'border-foreground/25 bg-transparent text-foreground hover:border-foreground/50 hover:bg-foreground/[0.04] hover:text-foreground dark:border-brand-green/60 dark:text-brand-green dark:hover:bg-brand-green/10 dark:hover:text-brand-green',
        neon: 'border-transparent bg-brand-green text-navy shadow-[0_10px_28px_-12px_rgba(136,255,154,0.75)] hover:bg-brand-blue hover:text-navy',
        'neon-outline':
          'border-brand-green/60 bg-transparent text-brand-green hover:bg-brand-green/10 hover:text-brand-green',
      },
      scale: {
        md: 'h-10 gap-2 px-4 text-small',
        lg: 'h-12 gap-2 px-6 text-small',
      },
    },
    defaultVariants: {
      tone: 'ink',
      scale: 'lg',
    },
  },
)

/** The classes of a pill, for the `PillButton` and for the external `<a>`. */
export function pillVariants({ tone, scale }: PillStyle): string {
  return cn(buttonVariants(), pillToneVariants({ tone, scale }))
}

type PillButtonProps = Merge<
  LinkProps,
  PillStyle & {
    className?: string
    children: React.ReactNode
  }
>

export function PillButton({
  tone,
  scale,
  className,
  children,
  ...link
}: PillButtonProps): React.JSX.Element {
  return (
    <Link {...link} className={cn(pillVariants({ tone, scale }), className)}>
      {children}
    </Link>
  )
}
