import * as React from 'react'
import {
  ArrowsClockwiseIcon,
  CompassIcon,
  HammerIcon,
  PenNibIcon,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'

import { REVEAL } from './reveal'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

type Step = {
  icon: Icon
  title: () => string
  description: () => string
}

/** Os quatro passos, do diagnóstico à evolução. */
const STEPS: ReadonlyArray<Step> = [
  {
    icon: CompassIcon,
    title: () => m.home_step1Title(),
    description: () => m.home_step1Desc(),
  },
  {
    icon: PenNibIcon,
    title: () => m.home_step2Title(),
    description: () => m.home_step2Desc(),
  },
  {
    icon: HammerIcon,
    title: () => m.home_step3Title(),
    description: () => m.home_step3Desc(),
  },
  {
    icon: ArrowsClockwiseIcon,
    title: () => m.home_step4Title(),
    description: () => m.home_step4Desc(),
  },
]

/**
 * "Como trabalhamos": quatro painéis lado a lado, e o ativo se alarga.
 *
 * Abre no clique e no `hover`, porque no desktop passar o mouse é a leitura
 * natural de uma fileira de painéis, e no celular não há `hover`. Cada painel
 * é `button` com `aria-pressed`, que é o que ele é: um controle que escolhe
 * qual está aberto.
 *
 * O conteúdo do painel aberto só existe enquanto ele está aberto, então cada
 * troca o monta de novo, e montar é o que refaz a entrada.
 */
export function Process(): React.JSX.Element {
  const [active, setActive] = React.useState(0)

  return (
    <section
      data-slot="home-process"
      className="border-y border-foreground/[0.08] bg-surface py-24 md:py-32"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className={cn(REVEAL, 'mx-auto mb-14 max-w-2xl text-center')}>
          <h2 className="text-h2">{m.home_processTitle()}</h2>
          <span aria-hidden="true" className="brand-bar mx-auto mt-5" />
          <p className="mt-5 font-serif text-lead text-foreground/75">
            {m.home_processDesc()}
          </p>
        </div>

        <div className="flex flex-col gap-3 md:h-[420px] md:flex-row">
          {STEPS.map((step, index) => {
            const on = index === active

            return (
              <button
                key={index}
                type="button"
                onClick={() => setActive(index)}
                onMouseEnter={() => setActive(index)}
                aria-pressed={on}
                data-active={on}
                className="relative flex min-w-0 flex-col justify-between gap-6 overflow-hidden rounded-2xl border border-foreground/10 bg-background p-6 text-left transition-[flex-grow,background-color,border-color] duration-700 ease-out-expo hover:border-foreground/25 data-[active=true]:border-transparent data-[active=true]:bg-tint-peach motion-reduce:transition-none md:flex-1 md:data-[active=true]:flex-[2.6]"
              >
                <div className="flex w-full items-start justify-between gap-4">
                  <span className="text-h4 font-medium tracking-[-0.02em]">
                    {step.title()}
                  </span>
                  <span className="shrink-0 text-micro text-foreground/55">
                    {index + 1} / {STEPS.length}
                  </span>
                </div>
                {on && (
                  <div className={cn(REVEAL, 'delay-150')}>
                    <step.icon
                      size={40}
                      weight="light"
                      className="mb-6 text-foreground"
                    />
                    <p className="max-w-[40ch] font-serif text-lead leading-snug text-foreground/90">
                      {step.description()}
                    </p>
                  </div>
                )}
                {!on && (
                  <p className="line-clamp-2 text-small text-foreground/55 max-md:hidden">
                    {step.description()}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
