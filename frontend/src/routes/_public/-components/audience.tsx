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

import { REVEAL, STAGGER } from './reveal'

/** Os públicos, na ordem do posicionamento: os povos originários primeiro. */
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
 * Para quem a Maiyu constrói: a lista dos setores, em tipo grande, depois dos
 * serviços.
 *
 * Os serviços dizem o que a Maiyu faz; sem esta seção a página não dizia para
 * quem, e a organização indígena ou a prefeitura que chega não se reconhecia
 * em lugar nenhum. É lista e não grade de cards: cada linha é um nome, e o
 * marcador em losango de urucum é o mesmo desenho do trançado.
 */
export function Audience(): React.JSX.Element {
  return (
    <section data-slot="home-audience" className="py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 md:grid-cols-12 md:px-8">
        <div className={cn(REVEAL, 'md:col-span-5')}>
          <h2 className="text-display tracking-[-0.015em]">
            {m.home_audienceTitle()}
          </h2>
          <p className="mt-6 max-w-[42ch] font-serif text-body-lg text-foreground/80">
            {m.home_audienceDesc()}
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
            {m.home_audienceReach()}
          </p>
        </div>
      </div>
    </section>
  )
}
