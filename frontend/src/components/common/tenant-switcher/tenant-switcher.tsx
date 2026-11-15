import { useQuery } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import type * as React from 'react'

import {
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '#/components/ui/dropdown-menu'
import { useAuthenticationTenantSelectMutation } from '#/integrations/tanstack-query/mutations/account'
import { accountTenantsQueryOptions } from '#/integrations/tanstack-query/queries/account'
import { m } from '#/paraglide/messages'

/**
 * A troca do vínculo ativo (DECISIONS.md #390): a conta que trabalha em mais de um tenant escolhe
 * em qual. É um grupo de itens de rádio para dentro de um `DropdownMenuContent` (o menu de conta do
 * `PanelShell`), e só aparece com dois ou mais vínculos: com um, ou nenhum, não há o que escolher.
 *
 * A lista só é lida quando o menu abre (o conteúdo monta aberto). Trocar relê a conta e invalida o
 * cache, e o router recarrega a tela no vínculo novo: o `context.account` que a guarda de área lê
 * não pode ficar com o papel do vínculo anterior.
 */
export function TenantSwitcher(): React.JSX.Element | null {
  const router = useRouter()
  const tenants = useQuery(accountTenantsQueryOptions())
  const select = useAuthenticationTenantSelectMutation({
    onSuccess: () => router.invalidate(),
  })

  if (!tenants.data || tenants.data.data.length < 2) return null

  return (
    <DropdownMenuGroup data-slot="tenant-switcher">
      <DropdownMenuLabel>{m.kit_tenant_switcher_label()}</DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={tenants.data.activeId ?? ''}
        onValueChange={(tenantId: string) => select.mutate({ tenantId })}
      >
        {tenants.data.data.map((tenant) => (
          <DropdownMenuRadioItem
            key={tenant.id}
            value={tenant.id}
            className="min-h-11"
          >
            {tenant.name}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuGroup>
  )
}
