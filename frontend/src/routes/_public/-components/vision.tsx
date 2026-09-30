import * as React from 'react'

import { REVEAL } from './reveal'
import { useScrollStep } from './use-scroll-step'
import { VisionScene } from './vision-scenes'
import type { VisionStep } from './vision-scenes'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

/**
 * Os três passos da visão. Funções e não chaves montadas por texto
 * (`home.vision${n}Title`): a chave montada não é conferida por ninguém, e a
 * função do paraglide é, pelo compilador.
 */
const ITEMS = [
  {
    title: () => m.home_vision1Title(),
    description: () => m.home_vision1Desc(),
  },
  {
    title: () => m.home_vision2Title(),
    description: () => m.home_vision2Desc(),
  },
  {
    title: () => m.home_vision3Title(),
    description: () => m.home_vision3Desc(),
  },
] as const

/** O índice como passo tipado, para a cena só aceitar o que existe. */
const STEPS: ReadonlyArray<VisionStep> = [0, 1, 2]

/**
 * "A visão": três passos numerados à esquerda e o palco navy à direita, preso
 * na tela enquanto a leitura desce.
 *
 * No desktop a seção tem 280vh e o conteúdo é `sticky`: a rolagem por dentro
 * dela escolhe o passo. Quem pediu menos movimento não recebe nada disso, e
 * por CSS (`motion-safe:`): a seção tem a altura do conteúdo e os três passos
 * aparecem abertos de uma vez.
 *
 * O passo ativo é marcado por `data-active`, e o desenho dele mora nas classes
 * `data-[active=true]:`. No celular os três ficam sempre abertos, porque ali o
 * palco não fica preso ao lado.
 */
export function Vision(): React.JSX.Element {
  const ref = React.useRef<HTMLElement>(null)
  const step = STEPS[useScrollStep(ref, ITEMS.length)]
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
            <p className="eyebrow">{m.home_visionLabel()}</p>
            <h2 className="text-h2">{m.home_visionTitle()}</h2>
            <span aria-hidden="true" className="brand-bar mt-5" />
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
            'relative isolate min-h-[420px] overflow-hidden rounded-[1.75rem] bg-navy delay-200 md:col-span-7',
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
