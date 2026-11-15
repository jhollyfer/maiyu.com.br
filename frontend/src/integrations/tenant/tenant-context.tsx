import * as React from 'react'

import type { CityResponse } from '@maiyu/shared'

/** The tenant of the page, when the URL or the session names one (DECISIONS.md #390). */
export type TenantSummary = Readonly<{ id: string; slug: string; name: string }>

type TenantContextValue = Readonly<{
  city: CityResponse
  tenant: TenantSummary | null
}>

const TenantContext = React.createContext<TenantContextValue | null>(null)

/**
 * The city and the tenant the page renders for (DECISIONS.md #390). The project's `/$city` route
 * resolves them in its `loader` (the city by the URL segment, the tenant by the second segment or
 * by the session) and wraps its subtree here; the kit pieces read the clock (`timeZone`) and the
 * name for `{city}` messages from it, never from a constant. Per request on the server: the value
 * is the route's, not module state.
 */
export function TenantProvider({
  city,
  tenant = null,
  children,
}: React.PropsWithChildren<{
  city: CityResponse
  tenant?: TenantSummary | null
}>): React.JSX.Element {
  const value = React.useMemo(() => ({ city, tenant }), [city, tenant])

  return <TenantContext value={value}>{children}</TenantContext>
}

function useTenantContext(): TenantContextValue {
  const value = React.use(TenantContext)
  if (!value)
    throw new Error('useCity and useTenant run under a <TenantProvider>')

  return value
}

/** The page's city: its name for `{city}` messages and its `timeZone` for every date. */
export function useCity(): CityResponse {
  return useTenantContext().city
}

/** The page's tenant, `null` on a city-wide page. */
export function useTenant(): TenantSummary | null {
  return useTenantContext().tenant
}
