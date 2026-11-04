import type * as React from 'react'
import {
  DeviceMobileIcon,
  GlobeIcon,
  HardDrivesIcon,
  LeafIcon,
  LightbulbIcon,
  PaletteIcon,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'

import { Glider } from './glider'
import { REVEAL, STAGGER } from './reveal'
import { SkyBackdrop } from '#/components/common/sky'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '#/components/ui/item'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

type Service = {
  icon: Icon
  title: () => string
  description: () => string
}

/** O que a Maiyu faz, na ordem em que um projeto costuma precisar. */
const SERVICES: ReadonlyArray<Service> = [
  {
    icon: LightbulbIcon,
    title: () => m.home_serviceConsulting(),
    description: () => m.home_serviceConsultingDesc(),
  },
  {
    icon: PaletteIcon,
    title: () => m.home_serviceDesign(),
    description: () => m.home_serviceDesignDesc(),
  },
  {
    icon: GlobeIcon,
    title: () => m.home_serviceWeb(),
    description: () => m.home_serviceWebDesc(),
  },
  {
    icon: DeviceMobileIcon,
    title: () => m.home_serviceMobile(),
    description: () => m.home_serviceMobileDesc(),
  },
  {
    icon: HardDrivesIcon,
    title: () => m.home_serviceBackend(),
    description: () => m.home_serviceBackendDesc(),
  },
  {
    icon: LeafIcon,
    title: () => m.home_serviceImpact(),
    description: () => m.home_serviceImpactDesc(),
  },
]

/**
 * Os serviços: um cartão de céu com a folha à esquerda e a lista regrada à
 * direita.
 *
 * A lista entra em cascata, um item a cada `STAGGER`, como o
 * `StaggerContainer` fazia com o motion no site antigo.
 */
export function Capabilities(): React.JSX.Element {
  return (
    <section data-slot="home-capabilities" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className={cn(REVEAL, 'mb-12 flex flex-col gap-5')}>
          <h2 className="max-w-3xl text-h2">{m.home_servicesHeading()}</h2>
          <span aria-hidden="true" className="brand-bar" />
        </div>

        <div className="grid grid-cols-1 overflow-hidden rounded-[1.75rem] border border-foreground/10 md:grid-cols-12">
          <div className="relative min-h-[280px] md:col-span-5">
            <SkyBackdrop fade={false} />
            <div className="absolute top-[38%] left-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2">
              <Glider />
            </div>
          </div>
          <ItemGroup className="gap-0 divide-y divide-foreground/10 bg-surface md:col-span-7">
            {SERVICES.map((service, index) => (
              <Item
                key={index}
                render={<li />}
                className={cn(
                  REVEAL,
                  'flex-nowrap items-start gap-5 rounded-none border-0 p-6 text-body md:px-8',
                )}
                style={{ animationDelay: `${index * STAGGER}ms` }}
              >
                <ItemMedia variant="icon" className="mt-1">
                  <service.icon size={20} className="size-5" />
                </ItemMedia>
                <ItemContent className="gap-0">
                  <ItemTitle className="line-clamp-none text-h4">
                    {/* O ItemTitle é `div`: o h3 dentro dele mantém o serviço no sumário de títulos da página. */}
                    <h3>{service.title()}</h3>
                  </ItemTitle>
                  <ItemDescription className="mt-2 line-clamp-none max-w-[56ch] font-serif text-body-lg text-foreground/70">
                    {service.description()}
                  </ItemDescription>
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
        </div>
      </div>
    </section>
  )
}
