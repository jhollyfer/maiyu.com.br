import type * as React from 'react'

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from '#/components/ui/item'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

import { Photo } from './photo'
import { REVEAL, STAGGER } from './reveal'

type Service = {
  title: () => string
  description: () => string
}

/** O que a Maiyu faz, na ordem em que um projeto costuma precisar. */
const SERVICES: ReadonlyArray<Service> = [
  {
    title: () => m.home_serviceConsulting(),
    description: () => m.home_serviceConsultingDesc(),
  },
  {
    title: () => m.home_serviceDesign(),
    description: () => m.home_serviceDesignDesc(),
  },
  {
    title: () => m.home_serviceWeb(),
    description: () => m.home_serviceWebDesc(),
  },
  {
    title: () => m.home_serviceBackend(),
    description: () => m.home_serviceBackendDesc(),
  },
  {
    title: () => m.home_serviceImpact(),
    description: () => m.home_serviceImpactDesc(),
  },
]

/**
 * Os serviços: a frase de posicionamento e o rio à esquerda, a lista regrada
 * à direita.
 *
 * Sem ícone por serviço: o título já diz o que é, e seis ícones iguais eram
 * enfeite. A lista entra em cascata, um item a cada `STAGGER`.
 */
export function Capabilities(): React.JSX.Element {
  return (
    <section data-slot="home-capabilities" className="py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 md:grid-cols-12 md:px-8">
        <div className={cn(REVEAL, 'flex flex-col gap-10 md:col-span-5')}>
          <h2 className="text-h1">{m.home_servicesHeading()}</h2>
          <Photo
            name="river"
            ratio={4 / 3}
            sizes="(min-width: 768px) 40vw, 100vw"
          />
        </div>

        <ItemGroup className="gap-0 divide-y divide-border border-y border-border md:col-span-7">
          {SERVICES.map((service, index) => (
            <Item
              key={index}
              render={<li />}
              className={cn(
                REVEAL,
                'flex-nowrap items-start rounded-none border-0 px-0 py-6 text-body',
              )}
              style={{ animationDelay: `${index * STAGGER}ms` }}
            >
              <ItemContent className="gap-0">
                <ItemTitle className="line-clamp-none text-h3">
                  {/* O ItemTitle é `div`: o h3 dentro dele mantém o serviço no sumário de títulos da página. */}
                  <h3>{service.title()}</h3>
                </ItemTitle>
                <ItemDescription className="mt-2 line-clamp-none max-w-[56ch] font-serif text-body-lg text-foreground/75">
                  {service.description()}
                </ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      </div>
    </section>
  )
}
