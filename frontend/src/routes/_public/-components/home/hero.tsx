import { ArrowRightIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import type * as React from 'react'

import { buttonVariants } from '#/components/ui/button'
import { cn } from '#/lib/cn'
import { m } from '#/paraglide/messages'

import { Photo } from '../photo'
import { REVEAL } from '../reveal'

/**
 * The first fold: the typographic cover and, right below, the city.
 *
 * The home's only `h1`. Two lines of the display serif, the second in italic, and a short rule in
 * the single accent closes the title (`docs/DESIGN.md` §3). No illustration and no colored
 * surface: whoever arrives sees the place Maiyu speaks from, and so the photo of the city, the
 * only one with `priority`, comes in right after the actions, which fit on the first fold at
 * 1440x900. The primary action is one ink button and the second is a text link: one weight
 * per fold.
 *
 * The entrance is staggered by `delay-*`, in reading order: title, text and actions, photo.
 */
export function Hero(): React.JSX.Element {
  return (
    <section data-slot="home-hero" className="pt-32 pb-16 md:pt-44 md:pb-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <h1 className="max-w-[18ch] text-display-xl tracking-[-0.025em] text-foreground">
          <span className={cn(REVEAL, 'block')}>{m.home_hero_title1()}</span>
          <span className={cn(REVEAL, 'block italic delay-100')}>
            {m.home_hero_title2()}
          </span>
        </h1>
        <span
          aria-hidden="true"
          className={cn(REVEAL, 'brand-bar mt-8 delay-200')}
        />

        <div
          className={cn(
            REVEAL,
            'mt-12 grid gap-8 delay-300 md:grid-cols-12 md:gap-12',
          )}
        >
          <div className="flex flex-col items-start gap-8 md:col-span-6 md:col-start-7">
            <p className="max-w-[46ch] font-serif text-lead leading-snug text-foreground/80">
              {m.home_hero_description()}
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <Link
                to="/contact"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'h-11 px-6 text-body',
                )}
              >
                {m.home_start_project()}
              </Link>
              <Link
                to="/portfolio"
                className={buttonVariants({ variant: 'link', size: 'lg' })}
              >
                {m.home_view_work()}
                <ArrowRightIcon aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        <div className={cn(REVEAL, 'mt-16 delay-500 md:mt-24')}>
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
