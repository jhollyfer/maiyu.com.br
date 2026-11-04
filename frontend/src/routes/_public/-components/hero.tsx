import type * as React from 'react'
import { Link } from '@tanstack/react-router'

import { Glider } from './glider'
import { REVEAL } from './reveal'
import { PillButton } from './pill-button'
import { SkyBackdrop } from '#/components/common/sky'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

/**
 * A primeira dobra: céu, mata, o título em duas linhas e a folha planando.
 *
 * O único `h1` da home. As duas linhas do título se desencontram de propósito,
 * a primeira à esquerda e a segunda à direita na cor da mata, e a barra verde
 * fecha sob a segunda: é a composição das artes de divulgação da Maiyu.
 *
 * A entrada é escalonada por `animationDelay`, na ordem de leitura: título,
 * barra, folha e, por último, o texto e as ações.
 */
export function Hero(): React.JSX.Element {
  return (
    <section
      data-slot="home-hero"
      className="relative isolate flex min-h-[100dvh] flex-col overflow-hidden pt-28 pb-[clamp(170px,17vw,240px)]"
    >
      <SkyBackdrop className="-z-10" />
      <div className="rails pointer-events-none absolute inset-0 -z-10 opacity-60" />

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 md:px-8">
        <h1 className="relative mt-10 text-[clamp(2.8rem,8.4vw,7.75rem)] leading-[0.95] tracking-[-0.015em] text-foreground md:mt-14">
          <span className={cn(REVEAL, 'block md:pl-[4%]')}>
            {m.home_heroTitle1()}
          </span>
          <span className={cn(REVEAL, 'block text-right delay-100 md:pr-[4%]')}>
            <span className="text-forest dark:text-brand-green">
              {m.home_heroTitle2()}
            </span>
          </span>
        </h1>
        <span
          aria-hidden="true"
          className={cn(
            REVEAL,
            'brand-bar mt-6 ml-auto w-28 delay-200 md:mr-[4%]',
          )}
        />

        <div
          className={cn(
            REVEAL,
            'pointer-events-none mx-auto -mt-2 w-[46vw] max-w-[300px] delay-300 md:absolute md:top-[46%] md:left-[10%] md:mt-0 md:w-[18vw]',
          )}
        >
          <Glider />
        </div>

        <div
          className={cn(
            REVEAL,
            'mt-auto flex flex-col items-start gap-6 pt-10 delay-500 md:ml-auto md:max-w-md',
          )}
        >
          <p className="flex items-center gap-3 text-small font-semibold text-foreground/75">
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rotate-45 bg-urucum"
            />
            {m.home_heroPlace()}
          </p>
          <p className="font-serif text-lead leading-snug text-foreground/85">
            {m.home_heroDescription()}
          </p>
          <div className="flex flex-wrap gap-2">
            <PillButton
              className="rounded-xl"
              render={<Link to="/contact">{m.home_startProject()}</Link>}
            />
            <PillButton
              tone="outline"
              className="rounded-xl"
              render={<Link to="/portfolio">{m.home_viewWork()}</Link>}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
