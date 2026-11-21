import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '#/lib/cn'

/**
 * `layout` is how the pairs sit: `stacked` (label over value, a grid of pairs, for a section of a
 * detail screen) or `rows` (label beside value from `sm` up, one pair per ruled row, for a block of
 * metadata). `labelWidth` is the label column of `rows`, set as a custom property the items read,
 * so a wider label is a variant of the list and never a class on each item
 * (`_standards/frontend.md` §6.1, `DECISIONS.md` #822).
 */
export const descriptionListVariants = cva('', {
  variants: {
    layout: {
      stacked: 'grid gap-4',
      rows: 'rounded-md border bg-muted/30',
    },
    labelWidth: {
      narrow: '[--description-label-width:6.5rem]',
      default: '[--description-label-width:8.75rem]',
      wide: '[--description-label-width:12rem]',
    },
  },
  defaultVariants: { layout: 'stacked', labelWidth: 'default' },
})

type DescriptionListProps = React.ComponentProps<'dl'> &
  VariantProps<typeof descriptionListVariants>

/**
 * The `<dl>` of a read-only screen: a list of label/value pairs, a real description list so the
 * screen reader announces each term with its details. Compound: `DescriptionItem` wraps a
 * `DescriptionTerm` and a `DescriptionDetails` (a `<div>` around `<dt>` and `<dd>` is valid inside
 * `<dl>`, HTML living standard). Also what `DetailRowsSkeleton` draws, so the skeleton and the
 * screen cannot drift apart.
 */
export function DescriptionList({
  layout = 'stacked',
  labelWidth = 'default',
  className,
  ...props
}: DescriptionListProps): React.JSX.Element {
  return (
    <dl
      data-slot="description-list"
      data-layout={layout}
      className={cn(
        'group/description-list',
        descriptionListVariants({ layout, labelWidth }),
        className,
      )}
      {...props}
    />
  )
}

/** A label/value pair. In `rows` it is a ruled row; the last one drops its rule. */
export function DescriptionItem({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="description-item"
      className={cn(
        'flex min-w-0 flex-col gap-1',
        'group-data-[layout=rows]/description-list:grid group-data-[layout=rows]/description-list:gap-1 group-data-[layout=rows]/description-list:border-b group-data-[layout=rows]/description-list:border-border/60 group-data-[layout=rows]/description-list:px-3 group-data-[layout=rows]/description-list:py-2 group-data-[layout=rows]/description-list:last:border-b-0 group-data-[layout=rows]/description-list:sm:grid-cols-[var(--description-label-width)_minmax(0,1fr)] group-data-[layout=rows]/description-list:sm:gap-3',
        className,
      )}
      {...props}
    />
  )
}

export function DescriptionTerm({
  className,
  ...props
}: React.ComponentProps<'dt'>): React.JSX.Element {
  return (
    <dt
      data-slot="description-term"
      className={cn(
        'text-sm font-medium group-data-[layout=rows]/description-list:text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

export function DescriptionDetails({
  className,
  ...props
}: React.ComponentProps<'dd'>): React.JSX.Element {
  return (
    <dd
      data-slot="description-details"
      className={cn('min-w-0 text-sm break-words', className)}
      {...props}
    />
  )
}
