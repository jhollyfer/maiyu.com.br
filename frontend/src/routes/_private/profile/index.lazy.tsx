import { createLazyFileRoute, getRouteApi } from '@tanstack/react-router'
import type * as React from 'react'

import { AccountProfileForm } from '#/components/common/account-profile-form/account-profile-form'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderTitle,
} from '#/components/common/page-shell/page-header'
import {
  PageShell,
  PageShellContent,
  PageShellHeader,
} from '#/components/common/page-shell/page-shell'
import { m } from '#/paraglide/messages'

// `getRouteApi` no escopo do módulo, nunca importar o `Route` do arquivo da rota: o ciclo de chunk
// devolve `undefined` no primeiro SSR (`check-chunk-cycles.mjs`).
const route = getRouteApi('/_private/profile/')

export const Route = createLazyFileRoute('/_private/profile/')({
  component: RouteComponent,
})

function RouteComponent(): React.JSX.Element {
  const { account } = route.useRouteContext()

  return (
    <PageShell>
      <PageShellHeader>
        <PageHeader>
          <PageHeaderTitle>{m.kit_profile_title()}</PageHeaderTitle>
          <PageHeaderDescription>
            {account.email ?? account.phone}
          </PageHeaderDescription>
        </PageHeader>
      </PageShellHeader>
      <PageShellContent>
        <AccountProfileForm account={account} />
      </PageShellContent>
    </PageShell>
  )
}
