import type * as React from 'react'

import { cn } from '#/lib/cn'
import { m } from '#/paraglide/messages'

import { Photo } from '../photo'
import { PillButton } from '../pill-button'
import { REVEAL } from '../reveal'

/**
 * The first fold: the typographic cover and, right below, the city.
 *
 * The home's only `h1`. Two lines in serif, the second in the forest color, and the green
 * bar closes beneath them: it is the small signature of the promotional artwork.
 * No illustration: whoever arrives needs to see the place Maiyu speaks from, and so
 * the photo of the city, the only one with `priority`, comes in bleeding right after the
 * buttons, which fit on the first fold at 1440x900.
 *
 * The entrance is staggered by `delay-*`, in reading order: title, text and
 * actions, photo.
 */
export function Hero(): React.JSX.Element {
  return (
    <section data-slot="home-hero" className="pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <h1 className="text-display-xl tracking-[-0.02em] text-foreground">
          <span className={cn(REVEAL, 'block')}>{m.home_hero_title1()}</span>
          <span className={cn(REVEAL, 'block delay-100')}>
            <span className="text-forest dark:text-brand-green">
              {m.home_hero_title2()}
            </span>
          </span>
        </h1>
        <span
          aria-hidden="true"
          className={cn(REVEAL, 'brand-bar mt-6 w-28 delay-200')}
        />

        <div
          className={cn(
            REVEAL,
            'mt-10 grid gap-8 delay-300 md:grid-cols-12 md:gap-12',
          )}
        >
          <div className="flex flex-col items-start gap-6 md:col-span-8 md:col-start-5">
            <p className="max-w-[48ch] font-serif text-lead leading-snug text-foreground/85">
              {m.home_hero_description()}
            </p>
            <div className="flex flex-wrap gap-2">
              <PillButton className="rounded-xl" to="/contact">
                {m.home_start_project()}
              </PillButton>
              <PillButton tone="outline" className="rounded-xl" to="/portfolio">
                {m.home_view_work()}
              </PillButton>
            </div>
          </div>
        </div>

        <div className={cn(REVEAL, 'mt-14 delay-500 md:mt-20')}>
          <Photo
            name="town"
            ratio={21 / 9}
            sizes="(min-width: 1280px) 1216px, 100vw"
            priority
          />
        </div>
      </div>
    </section>
  )
}
