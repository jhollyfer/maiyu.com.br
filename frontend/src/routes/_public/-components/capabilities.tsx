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
          <ul className="divide-y divide-foreground/10 bg-surface md:col-span-7">
            {SERVICES.map((service, index) => (
              <li
                key={index}
                className={cn(REVEAL, 'flex gap-5 p-6 md:px-8')}
                style={{ animationDelay: `${index * STAGGER}ms` }}
              >
                <service.icon size={20} className="mt-1 shrink-0" />
                <div>
                  <h3 className="text-h4 font-medium">{service.title()}</h3>
                  <p className="mt-2 max-w-[56ch] font-serif text-body-lg text-foreground/70">
                    {service.description()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
