import type * as React from 'react'

import {
  Item,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '#/components/ui/item'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

import { REVEAL, STAGGER } from '../reveal'

/** The audiences, in the positioning's order: the original peoples first. */
const AUDIENCES = [
  () => m.home_audience1(),
  () => m.home_audience2(),
  () => m.home_audience3(),
  () => m.home_audience4(),
  () => m.home_audience5(),
  () => m.home_audience6(),
  () => m.home_audience7(),
] as const

/**
 * Who Maiyu builds for: the list of sectors, in large type, after the
 * services.
 *
 * The services say what Maiyu does; without this section the page did not say for
 * whom, and the Indigenous organization or the city hall that arrives did not recognize
 * itself anywhere. It is a list and not a grid of cards: each line is a name, and the
 * annatto diamond marker is the same design as the weave.
 */
export function Audience(): React.JSX.Element {
  return (
    <section data-slot="home-audience" className="py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 md:grid-cols-12 md:px-8">
        <div className={cn(REVEAL, 'md:col-span-5')}>
          <h2 className="text-display tracking-[-0.015em]">
            {m.home_audience_title()}
          </h2>
          <p className="mt-6 max-w-[42ch] font-serif text-body-lg text-foreground/80">
            {m.home_audience_desc()}
          </p>
        </div>

        <div className="md:col-span-7">
          <ItemGroup className="gap-0 divide-y divide-border border-y border-border">
            {AUDIENCES.map((label, index) => (
              <Item
                key={index}
                render={<li />}
                className={cn(
                  REVEAL,
                  'flex-nowrap gap-5 rounded-none border-0 px-0 py-5 text-body',
                )}
                style={{ animationDelay: `${index * STAGGER}ms` }}
              >
                <ItemMedia>
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rotate-45 bg-urucum"
                  />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className="line-clamp-none text-h3 font-semibold">
                    {label()}
                  </ItemTitle>
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
          <p
            className={cn(
              REVEAL,
              'mt-8 font-serif text-lead text-forest dark:text-brand-green',
            )}
          >
            {m.home_audience_reach()}
          </p>
        </div>
      </div>
    </section>
  )
}
