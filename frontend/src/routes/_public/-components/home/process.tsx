import type * as React from 'react'

import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

import { REVEAL, STAGGER } from '../reveal'

type Step = {
  title: () => string
  description: () => string
}

/** The four steps, from diagnosis to evolution. */
const STEPS: ReadonlyArray<Step> = [
  {
    title: () => m.home_step1_title(),
    description: () => m.home_step1_desc(),
  },
  {
    title: () => m.home_step2_title(),
    description: () => m.home_step2_desc(),
  },
  {
    title: () => m.home_step3_title(),
    description: () => m.home_step3_desc(),
  },
  {
    title: () => m.home_step4_title(),
    description: () => m.home_step4_desc(),
  },
]

/**
 * "How we work": the four steps in a numbered list.
 *
 * Here the numbering carries information, because the order matters (diagnosis
 * comes before design, and design before the build), and so the number is large and
 * in annatto. It is a real `ol`: the screen reader announces "item 2 of 4" on its own,
 * which the earlier panels, which depended on hovering, did not give.
 */
export function Process(): React.JSX.Element {
  return (
    <section data-slot="home-process" className="py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 md:grid-cols-12 md:px-8">
        <div className={cn(REVEAL, 'md:col-span-5')}>
          <h2 className="text-display tracking-[-0.015em]">
            {m.home_process_title()}
          </h2>
          <p className="mt-6 max-w-[40ch] font-serif text-lead text-foreground/75">
            {m.home_process_desc()}
          </p>
        </div>

        <ol className="divide-y divide-border border-y border-border md:col-span-7">
          {STEPS.map((step, index) => (
            <li
              key={index}
              className={cn(REVEAL, 'grid grid-cols-[3.5rem_1fr] gap-4 py-8')}
              style={{ animationDelay: `${index * STAGGER}ms` }}
            >
              <span
                aria-hidden="true"
                className="font-display text-h1 leading-none text-urucum"
              >
                {index + 1}
              </span>
              <div>
                <h3 className="text-h3">{step.title()}</h3>
                <p className="mt-3 max-w-[52ch] font-serif text-body-lg text-foreground/80">
                  {step.description()}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
