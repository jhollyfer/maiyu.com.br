import { ArrowUpRightIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import type * as React from 'react'

import { CALL_URL } from '#/lib/site'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

import { Photo } from '../photo'
import { PillButton } from '../pill-button'
import { REVEAL } from '../reveal'

/**
 * The final invitation: the large phrase over the paper, the actions and the photo of Leticia,
 * across the border.
 *
 * "Schedule a conversation" opens WhatsApp, and not the contact page: it is the end of the
 * reading, and whoever got this far has already decided to talk. The contact page
 * is one link below, for whoever prefers to write.
 */
export function ClosingCta(): React.JSX.Element {
  return (
    <section data-slot="home-closing-cta" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className={cn(REVEAL, 'grid gap-10 md:grid-cols-12 md:gap-12')}>
          <h2 className="text-display-xl tracking-[-0.02em] text-foreground md:col-span-8">
            {m.home_cta_title()}
          </h2>
          <div className="flex flex-col items-start md:col-span-4 md:justify-end">
            <p className="max-w-[40ch] font-serif text-lead text-foreground/80">
              {m.home_cta_desc()}
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              <PillButton
                className="rounded-xl"
                render={
                  <a href={CALL_URL} target="_blank" rel="noopener noreferrer">
                    {m.home_start_project()}
                    <ArrowUpRightIcon />
                  </a>
                }
              />
              <PillButton
                tone="outline"
                className="rounded-xl"
                render={<Link to="/portfolio">{m.home_view_work()}</Link>}
              />
            </div>
            <Link
              to="/contact"
              className="mt-4 inline-flex min-h-11 items-center gap-1 text-small text-foreground/70 hover:text-foreground"
            >
              {m.nav_contact()} <ArrowUpRightIcon size={13} />
            </Link>
          </div>
        </div>

        <div className={cn(REVEAL, 'mt-16 delay-200 md:mt-20')}>
          <Photo
            name="sunset"
            ratio={21 / 9}
            sizes="(min-width: 1280px) 1216px, 100vw"
          />
        </div>
      </div>
    </section>
  )
}
