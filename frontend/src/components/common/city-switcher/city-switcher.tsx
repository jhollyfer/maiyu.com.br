import { MapPinIcon } from '@phosphor-icons/react'
import { useLocation, useRouter } from '@tanstack/react-router'
import type * as React from 'react'

import { NativeSelect, NativeSelectOption } from '#/components/ui/native-select'
import { CityPath } from '#/lib/city-path'
import { m } from '#/paraglide/messages'
import type { CityResponse } from '@maiyu/shared'

type CitySwitcherProps = Omit<
  React.ComponentProps<typeof NativeSelect>,
  'value' | 'onChange' | 'children'
> & {
  /** The cities to offer, from the project's query of `GET /storefront/cities`. */
  readonly cities: ReadonlyArray<Pick<CityResponse, 'slug' | 'name'>>
}

/**
 * The city selector (DECISIONS.md #390), the pair of `LocaleSwitcher` for the segment after the
 * language. No state of its own: the value is the city of the URL (`CityPath.slugOf`) and the
 * switch navigates to the same page in the other city, so the link stays shareable and the server
 * renders the right city. The cities come by prop: the kit does no I/O of the project.
 */
export function CitySwitcher({
  cities,
  ...props
}: CitySwitcherProps): React.JSX.Element {
  const router = useRouter()
  const pathname = useLocation({ select: (location) => location.pathname })
  const current = CityPath.slugOf(pathname) ?? ''

  return (
    <div data-slot="city-switcher" className="flex items-center gap-2">
      <MapPinIcon aria-hidden className="size-4 text-muted-foreground" />
      <NativeSelect
        aria-label={m.kit_city_switcher_label()}
        value={current}
        onChange={(event) => {
          const next = event.target.value
          if (!next || next === current) return

          void router.navigate({ href: CityPath.switchTo(pathname, next) })
        }}
        {...props}
      >
        {cities.map((city) => (
          <NativeSelectOption key={city.slug} value={city.slug}>
            {city.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  )
}
