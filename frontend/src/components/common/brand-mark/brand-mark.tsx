import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import type * as React from 'react'

import { Picture } from '#/components/common/picture/picture'
import { BRAND } from '#/lib/brand'
import { cn } from '#/lib/cn'
import { m } from '#/paraglide/messages'

/**
 * The size is a variant of the root, and the parts read it from `data-size` through
 * `group-data-[size=...]/brand`: no context for a value the CSS already carries.
 */
const brandMarkVariants = cva('group/brand flex items-center leading-none', {
  variants: {
    size: { sm: 'gap-1.5', md: 'gap-2', lg: 'gap-3' },
  },
  defaultVariants: { size: 'md' },
})

type BrandMarkProps = Readonly<
  React.ComponentProps<'span'> & VariantProps<typeof brandMarkVariants>
>

/**
 * The product's brand: a `bg-primary` disc with the symbol, and the name beside it. The symbol
 * comes from `lib/brand.ts` and the name from `brand_name` in the project's messages, both the
 * project's; the colors are the theme's tokens.
 *
 * Without children it draws the symbol and the name. With children the parts are the composition
 * (`<BrandMark><BrandMarkSymbol label="..." /></BrandMark>` for the symbol alone).
 *
 * It is not a link: whoever uses it decides where it leads.
 */
export function BrandMark({
  className,
  size,
  children,
  ...rest
}: BrandMarkProps): React.JSX.Element {
  return (
    <span
      data-slot="brand-mark"
      data-size={size ?? 'md'}
      {...rest}
      className={cn(brandMarkVariants({ size }), className)}
    >
      {children ?? (
        <>
          <BrandMarkSymbol />
          <BrandMarkName />
        </>
      )}
    </span>
  )
}

type BrandMarkSymbolProps = Readonly<
  Omit<React.ComponentProps<'span'>, 'children'> & {
    /** The accessible name, only when the symbol stands alone; beside the name it is decorative. */
    label?: string
  }
>

/** Decorative beside the name; an image with the name when the symbol stands alone. */
function a11yOf(label: string | undefined): React.ComponentProps<'span'> {
  if (label === undefined) {
    return { 'aria-hidden': true }
  }

  return { role: 'img', 'aria-label': label }
}

/**
 * The disc with the symbol, or the project's own logo when `BRAND.logo` is set. Decorative by
 * default (the name beside it already says it); with `label` it is an image with that name.
 */
export function BrandMarkSymbol({
  className,
  label,
  ...rest
}: BrandMarkSymbolProps): React.JSX.Element {
  const SymbolIcon = BRAND.icon
  const { logo } = BRAND

  return (
    <span
      data-slot="brand-mark-symbol"
      {...a11yOf(label)}
      {...rest}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full group-data-[size=sm]/brand:size-6 group-data-[size=md]/brand:size-8 group-data-[size=lg]/brand:size-10 group-data-[collapsible=icon]:size-7',
        logo === undefined && 'bg-primary',
        className,
      )}
    >
      {logo === undefined && (
        <SymbolIcon
          weight="fill"
          className="text-primary-foreground group-data-[size=sm]/brand:size-3 group-data-[size=md]/brand:size-4 group-data-[size=lg]/brand:size-5"
        />
      )}
      {logo !== undefined && (
        <Picture
          src={logo}
          alt=""
          width={40}
          height={40}
          className="size-full object-contain"
          placement="lcp"
        />
      )}
    </span>
  )
}

/**
 * The name in `--foreground`. In the collapsed sidebar only the symbol is left: the name leaves
 * the screen, not the screen reader. Outside the sidebar the selector matches nothing.
 */
export function BrandMarkName({
  className,
  ...rest
}: Omit<React.ComponentProps<'span'>, 'children'>): React.JSX.Element {
  return (
    <span
      data-slot="brand-mark-name"
      {...rest}
      className={cn(
        'font-bold text-foreground group-data-[size=sm]/brand:text-base group-data-[size=md]/brand:text-lg group-data-[size=lg]/brand:text-xl group-data-[collapsible=icon]:sr-only',
        className,
      )}
    >
      {m.brand_name()}
    </span>
  )
}
