import type * as React from 'react'

import { cn } from '#/lib/cn'

import { REVEAL } from './reveal'

type PageHeroProps = {
  /** The page's `h1`. */
  title: React.ReactNode
  /** The phrase under the title. */
  lead?: string
  /** What comes after the text: category pill, actions. */
  children?: React.ReactNode
}

/**
 * The editorial cover of the inner pages: a large title on the
 * left, the supporting phrase and the weave as a base line.
 *
 * No illustration: the page opens with typography only, and the photo of a place comes in
 * right below, in the next section. It plays the role of academy's `SectionTitle as="h1"`,
 * which opens the inner pages there, and lives here for the same reason as before: it is a
 * storefront piece.
 *
 * The weave sits at the end of the cover, and not in the middle of the page: it separates the
 * opening chapter from the first content, like the line that closes a notebook's
 * page.
 */
export function PageHero({
  title,
  lead,
  children,
}: PageHeroProps): React.JSX.Element {
  return (
    <section data-slot="page-hero" className="pt-36 md:pt-44">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <h1
          className={cn(
            REVEAL,
            'max-w-5xl text-display leading-[0.98] tracking-[-0.02em] text-balance text-foreground',
          )}
        >
          {title}
        </h1>
        {lead && (
          <p
            className={cn(
              REVEAL,
              'mt-8 max-w-[56ch] text-lead leading-snug text-foreground/80 delay-100',
            )}
          >
            {lead}
          </p>
        )}
        {children && (
          <div className={cn(REVEAL, 'mt-8 delay-200')}>{children}</div>
        )}
        <span
          aria-hidden="true"
          className="trancado mt-16 block w-full md:mt-20"
        />
      </div>
    </section>
  )
}
