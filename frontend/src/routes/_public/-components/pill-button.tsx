import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import type * as React from 'react'

import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import type { Merge } from '@maiyu/shared'

/**
 * The site's pill: the round button of the hero, of the end of the home and of the inner
 * pages.
 *
 * The same piece as academy's, and for the same reason: it lives outside
 * `components/ui/button.tsx` because that directory is what `shadcn`
 * delivers, and `shadcn add button` rewrites the whole file. What belongs to Maiyu
 * **composes** the stock button, which keeps handling focus, `disabled`,
 * `render` and icon.
 *
 * In the public shell and not in `components/common/`, which is where academy
 * keeps it: there the panel uses it too, and here only the storefront does.
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
const pillVariants = cva(
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

/**
 * The rest of the props goes to `Button`, and `variant`/`size` stay out: whoever
 * decides both is this component. Without the `Omit`, a forgotten `variant="link"`
 * would pass through the type and silently take the pill apart.
 */
type PillButtonProps = Merge<
  Omit<React.ComponentProps<typeof Button>, 'variant' | 'size'>,
  VariantProps<typeof pillVariants>
>

function PillButton({
  className,
  tone = 'ink',
  scale = 'lg',
  render,
  nativeButton,
  ...props
}: PillButtonProps): React.JSX.Element {
  /*
    Almost every pill here is a link. Base UI's `Button` assumes
    `nativeButton` true and warns in the console on every render when the
    final element is not a `<button>`; with `render` present the default becomes
    `false`, and whoever wants the opposite still says so in the call.
  */
  let isNativeButton = nativeButton
  if (isNativeButton === undefined) isNativeButton = !render

  return (
    <Button
      {...props}
      render={render}
      nativeButton={isNativeButton}
      className={cn(pillVariants({ tone, scale }), className)}
    />
  )
}

export { PillButton, pillVariants }
