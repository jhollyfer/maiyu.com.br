import * as React from 'react'
import { cn } from '#/lib/cn'
// casa: translated labels, the registry ships English
import { m } from '#/paraglide/messages'

import { Button } from '#/components/ui/button.tsx'
import {
  CaretLeftIcon,
  CaretRightIcon,
  DotsThreeIcon,
} from '@phosphor-icons/react'

function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      role="navigation"
      // casa: translated label
      aria-label={m.kit_ui_pagination_label()}
      data-slot="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn('flex items-center gap-0.5', className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<'li'>) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, 'size'> &
  React.ComponentProps<'a'>

function PaginationLink({
  className,
  isActive,
  size = 'icon',
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      variant={isActive ? 'outline' : 'ghost'}
      size={size}
      className={cn(className)}
      nativeButton={false}
      render={
        <a
          aria-current={isActive ? 'page' : undefined}
          data-slot="pagination-link"
          data-active={isActive}
          {...props}
        />
      }
    />
  )
}

function PaginationPrevious({
  className,
  // casa: translated label
  text = m.kit_ui_pagination_previous_text(),
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      // casa: translated label
      aria-label={m.kit_ui_pagination_previous()}
      size="default"
      className={cn('pl-1.5!', className)}
      {...props}
    >
      <CaretLeftIcon data-icon="inline-start" />
      <span className="hidden sm:block">{text}</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  // casa: translated label
  text = m.kit_ui_pagination_next_text(),
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      // casa: translated label
      aria-label={m.kit_ui_pagination_next()}
      size="default"
      className={cn('pr-1.5!', className)}
      {...props}
    >
      <span className="hidden sm:block">{text}</span>
      <CaretRightIcon data-icon="inline-end" />
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-8 items-center justify-center [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <DotsThreeIcon />
      {/* casa: translated label */}
      <span className="sr-only">{m.kit_ui_pagination_more()}</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
