import * as React from 'react'

import { cn } from '#/lib/cn'
import { m } from '#/paraglide/messages'

import { REVEAL } from '../reveal'
import { useScrollStep } from './use-scroll-step'
import { VisionScene } from './vision-scenes'
import type { VisionStep } from './vision-scenes'

/**
 * The three steps of the vision. Functions and not keys assembled from text
 * (`home.vision${n}Title`): nobody checks the assembled key, and the paraglide
 * function is checked, by the compiler.
 */
const ITEMS = [
  {
    title: () => m.home_vision1_title(),
    description: () => m.home_vision1_desc(),
  },
  {
    title: () => m.home_vision2_title(),
    description: () => m.home_vision2_desc(),
  },
  {
    title: () => m.home_vision3_title(),
    description: () => m.home_vision3_desc(),
  },
] as const

/** The index as a typed step, so the scene only accepts what exists. */
const STEPS: readonly [VisionStep, ...VisionStep[]] = [0, 1, 2]

/**
 * "The vision": three numbered steps on the left and the navy stage on the right, pinned
 * to the screen while the reading goes down.
 *
 * On desktop the section is 280vh tall and the content is `sticky`: the scroll inside
 * it chooses the step. Whoever asked for less motion gets none of this, and through
 * CSS (`motion-safe:`): the section has the height of the content and the three steps
 * show open all at once.
 *
 * The active step is marked by `data-active`, and its design lives in the
 * `data-[active=true]:` classes. On the phone all three stay always open, because there the
 * stage is not pinned to the side.
 */
export function Vision(): React.JSX.Element {
  const ref = React.useRef<HTMLElement>(null)
  const step = useScrollStep(ref, STEPS)
  const current = ITEMS[step]

  return (
    <section
      ref={ref}
      data-slot="home-vision"
      className="relative md:motion-safe:h-[280vh]"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-24 md:grid-cols-12 md:gap-12 md:px-8 md:motion-safe:sticky md:motion-safe:top-0 md:motion-safe:h-[100dvh]">
        <div className="flex flex-col md:col-span-5">
          <div className={REVEAL}>
            <h2 className="text-display">{m.home_vision_title()}</h2>
          </div>
          <ol className="mt-auto space-y-3 pt-10">
            {ITEMS.map((item, index) => (
              <li
                key={index}
                data-active={index === step}
                className="group flex gap-5"
              >
                <span className="font-display text-h3 leading-none font-medium tracking-[-0.015em] text-foreground/25 transition-[font-size,color] duration-500 group-data-[active=true]:text-[3.5rem] group-data-[active=true]:text-foreground motion-reduce:text-[3.5rem] motion-reduce:text-foreground motion-reduce:transition-none">
                  {index + 1}
                </span>
                <div className="grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-500 group-data-[active=true]:grid-rows-[1fr] group-data-[active=true]:opacity-100 max-md:grid-rows-[1fr] max-md:opacity-100 motion-reduce:grid-rows-[1fr] motion-reduce:opacity-100 motion-reduce:transition-none">
                  <div className="overflow-hidden">
                    <h3 className="pt-2 text-h4">{item.title()}</h3>
                    <p className="mt-2 max-w-[44ch] font-serif text-body-lg text-foreground/75">
                      {item.description()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div
          className={cn(
            REVEAL,
            'relative isolate min-h-[420px] overflow-hidden rounded-2xl bg-navy delay-200 md:col-span-7',
          )}
        >
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(49,225,247,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(49,225,247,0.07)_1px,transparent_1px)] bg-[size:64px_64px]" />
          <VisionScene step={step} />
          <span className="absolute bottom-6 left-6 rounded-lg border border-on-navy/30 px-3 py-1.5 text-small text-on-navy">
            {current.title()}
          </span>
          <span className="absolute top-6 right-6 text-small text-on-navy/50">
            {step + 1} / {ITEMS.length}
          </span>
        </div>
      </div>
    </section>
  )
}
