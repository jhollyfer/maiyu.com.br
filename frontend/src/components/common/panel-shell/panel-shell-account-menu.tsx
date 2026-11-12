import {
  CaretDownIcon,
  SignOutIcon,
  UserCircleIcon,
} from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import * as React from 'react'

import { TenantSwitcher } from '#/components/common/tenant-switcher/tenant-switcher'
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { AccountName } from '#/lib/account-name'
import { createConfirmHandle } from '#/lib/dialog-handle'
import { m } from '#/paraglide/messages'

import { usePanelShellContext } from './panel-shell-context'
import { PanelShellSignOutConfirm } from './panel-shell-sign-out-confirm'

/**
 * O menu da conta: quem é, o perfil, a troca de vínculo (com dois ou mais) e sair. A foto vem da API
 * já com a URL assinada; sem ela, as iniciais. Tema e idioma ficam no cabeçalho, que cabe os dois
 * botões em 360 px (o `LocaleSwitcher` compacto existe para isto).
 */
export function PanelShellAccountMenu(): React.JSX.Element {
  const { account } = usePanelShellContext('PanelShellAccountMenu')
  const [signOutHandle] = React.useState(createConfirmHandle)

  return (
    <React.Fragment>
      <DropdownMenu>
        <DropdownMenuTrigger
          data-slot="panel-shell-account-menu"
          className="flex min-h-11 items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-muted motion-reduce:transition-none"
        >
          <Avatar className="size-8">
            {account.avatar && <AvatarImage src={account.avatar.url} alt="" />}
            <AvatarFallback
              aria-hidden="true"
              className="bg-primary text-xs font-semibold text-primary-foreground"
            >
              {AccountName.initials(account.name)}
            </AvatarFallback>
          </Avatar>
          {/* O nome acessível contém o visível (WCAG 2.5.3). */}
          <span className="sr-only">{m.kit_panel_account_label()}</span>
          <span className="sr-only text-sm leading-none font-semibold lg:not-sr-only">
            {account.name}
          </span>
          <CaretDownIcon
            aria-hidden="true"
            className="size-3 text-muted-foreground"
          />
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-60" align="end">
          {/* O grupo é exigido pelo `GroupLabel` do Base UI: sem ele, abrir o menu lança. */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="truncate font-medium">{account.name}</span>
              <span className="truncate text-xs font-normal text-muted-foreground">
                {account.email ?? account.phone}
              </span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            render={
              <Link to="/profile">
                <UserCircleIcon />
                {m.kit_panel_my_profile()}
              </Link>
            }
            className="min-h-11"
          />
          <DropdownMenuSeparator />
          <TenantSwitcher />
          <DropdownMenuItem
            className="min-h-11"
            onClick={() => signOutHandle.open(null)}
          >
            <SignOutIcon />
            {m.kit_sign_out()}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Irmã do menu, não filha do conteúdo: o conteúdo desmonta ao fechar e levaria a confirmação. */}
      <PanelShellSignOutConfirm handle={signOutHandle} />
    </React.Fragment>
  )
}
