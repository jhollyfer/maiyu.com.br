import type * as React from 'react'

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { formatNumber } from '#/lib/i18n'
import { m } from '#/paraglide/messages'
import type { PlatformOverviewResponse } from '@maiyu/shared'

/**
 * The platform owner's page (DECISIONS.md #390): how many clients each city has and how many members
 * each client has. Counts only: the owner sees the platform, never a client's records. The data
 * comes by prop, from the project's query of `GET /platform/overview`; the route that mounts it
 * sits behind the owner's area, like every page of the panel.
 */
export function PlatformOverview({
  overview,
}: {
  readonly overview: PlatformOverviewResponse
}): React.JSX.Element {
  const cityName = new Map(overview.cities.map((city) => [city.id, city.name]))

  return (
    <div data-slot="platform-overview" className="flex flex-col gap-8">
      <Table>
        <TableCaption>{m.kit_platform_cities_caption()}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>{m.kit_platform_city()}</TableHead>
            <TableHead className="text-right">
              {m.kit_platform_tenants()}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {overview.cities.map((city) => (
            <TableRow key={city.id}>
              <TableCell>{city.name}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(city.tenants)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Table>
        <TableCaption>{m.kit_platform_tenants_caption()}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>{m.kit_platform_tenant()}</TableHead>
            <TableHead>{m.kit_platform_city()}</TableHead>
            <TableHead className="text-right">
              {m.kit_platform_members()}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {overview.tenants.map((tenant) => (
            <TableRow key={tenant.id}>
              <TableCell>{tenant.name}</TableCell>
              <TableCell>{cityName.get(tenant.cityId) ?? ''}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(tenant.members)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
