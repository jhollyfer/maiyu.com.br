import type * as React from 'react'

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from '#/components/ui/item'
import { cn } from '#/lib/cn'
import { m } from '#/paraglide/messages'

import { Photo } from '../photo'
import { REVEAL, STAGGER } from '../reveal'

type Service = {
  title: () => string
  description: () => string
}

/** What Maiyu does, in the order a project usually needs it. */
const SERVICES: ReadonlyArray<Service> = [
  {
    title: () => m.home_service_consulting(),
    description: () => m.home_service_consulting_desc(),
  },
  {
    title: () => m.home_service_design(),
    description: () => m.home_service_design_desc(),
  },
  {
    title: () => m.home_service_web(),
    description: () => m.home_service_web_desc(),
  },
  {
    title: () => m.home_service_backend(),
    description: () => m.home_service_backend_desc(),
  },
  {
    title: () => m.home_service_impact(),
    description: () => m.home_service_impact_desc(),
  },
]

/**
 * The services: the positioning phrase and the river on the left, the ruled list
 * on the right.
 *
 * No icon per service: the title already says what it is, and six identical icons were
 * decoration. The list enters in a cascade, one item every `STAGGER`.
 */
export function Capabilities(): React.JSX.Element {
  return (
    <section data-slot="home-capabilities" className="py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 md:grid-cols-12 md:px-8">
        <div className={cn(REVEAL, 'flex flex-col gap-10 md:col-span-5')}>
          <h2 className="text-h1">{m.home_services_heading()}</h2>
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
                  {/* ItemTitle is a `div`: the h3 inside it keeps the service in the page's heading outline. */}
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
