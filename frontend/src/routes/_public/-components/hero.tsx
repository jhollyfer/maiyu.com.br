import type * as React from 'react'
import { Link } from '@tanstack/react-router'

import { Photo } from './photo'
import { REVEAL } from './reveal'
import { PillButton } from './pill-button'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

/**
 * A primeira dobra: a capa tipográfica e, logo abaixo, a cidade.
 *
 * O único `h1` da home. Duas linhas em serifa, a segunda na cor da mata, e a
 * barra verde fecha sob elas: é a assinatura pequena das artes de divulgação.
 * Sem ilustração: quem chega precisa ver o lugar de onde a Maiyu fala, e por
 * isso a foto da cidade, a única com `priority`, entra sangrada logo depois dos
 * botões, que cabem na primeira dobra a 1440x900.
 *
 * A entrada é escalonada por `delay-*`, na ordem de leitura: título, texto e
 * ações, foto.
 */
export function Hero(): React.JSX.Element {
  return (
    <section data-slot="home-hero" className="pt-28 pb-16 md:pt-36 md:pb-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <h1 className="text-display-xl tracking-[-0.02em] text-foreground">
          <span className={cn(REVEAL, 'block')}>{m.home_heroTitle1()}</span>
          <span className={cn(REVEAL, 'block delay-100')}>
            <span className="text-forest dark:text-brand-green">
              {m.home_heroTitle2()}
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
          <p className="flex items-start gap-3 text-small font-semibold text-foreground/75 md:col-span-4">
            <span
              aria-hidden="true"
              className="mt-1.5 size-2 shrink-0 rotate-45 bg-urucum"
            />
            {m.home_heroPlace()}
          </p>
          <div className="flex flex-col items-start gap-6 md:col-span-8">
            <p className="max-w-[48ch] font-serif text-lead leading-snug text-foreground/85">
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
