import { SignOutIcon } from '@phosphor-icons/react'
import { useRouter } from '@tanstack/react-router'
import type * as React from 'react'

import { ConfirmDialog } from '#/components/common/confirm-dialog/confirm-dialog'
import {
  ConfirmDialogCancel,
  ConfirmDialogConfirm,
  ConfirmDialogFooter,
} from '#/components/common/confirm-dialog/confirm-dialog-footer'
import {
  ConfirmDialogDescription,
  ConfirmDialogHeader,
  ConfirmDialogMedia,
  ConfirmDialogTitle,
} from '#/components/common/confirm-dialog/confirm-dialog-header'
import { useSignOut } from '#/integrations/tanstack-query/mutations/account'
import type { ConfirmHandle } from '#/lib/dialog-handle'
import { m } from '#/paraglide/messages'

type PanelShellSignOutConfirmProps = Readonly<{
  /** O alerta aberto de fora, sem gatilho: o item do menu de conta chama `handle.open(null)`. */
  handle: ConfirmHandle
}>

/**
 * A confirmação antes de encerrar a sessão. Existe porque sair não tem desfazer na tela: quem clica
 * sem querer volta ao login e refaz a autenticação. É um `AlertDialog` (pelo `ConfirmDialog`), e não
 * um `Dialog`, então nem Esc nem clique fora respondem por quem clicou: a escolha é explícita. Sem
 * `destructive`: sair não apaga nada, e o vermelho continua valendo o que vale em arquivar e excluir.
 *
 * Irmã do menu de conta, não filha do conteúdo dele: o conteúdo desmonta ao fechar e levaria a
 * confirmação junto. Depois de sair, a conta já está fora do cache (`useSignOut`) e a tela vai para a
 * entrada, sem `?redirect=`: quem saiu não quer voltar para onde estava.
 */
export function PanelShellSignOutConfirm({
  handle,
}: PanelShellSignOutConfirmProps): React.JSX.Element {
  const router = useRouter()
  // `mutate` e não `mutateAsync`: ninguém espera o resultado aqui, e a promise de `mutateAsync`
  // rejeitaria sem tratador. Quem trata o fim é o `onSettled` do hook.
  const signOut = useSignOut({
    leave: () => router.navigate({ to: '/sign-in' }),
  })

  return (
    <ConfirmDialog
      data-slot="panel-shell-sign-out-confirm"
      handle={handle}
      destructive={false}
      isPending={signOut.isPending}
      onConfirm={() => signOut.mutate()}
    >
      <ConfirmDialogHeader>
        <ConfirmDialogMedia>
          <SignOutIcon />
        </ConfirmDialogMedia>
        <ConfirmDialogTitle>{m.kit_sign_out_title()}</ConfirmDialogTitle>
        <ConfirmDialogDescription>
          {m.kit_sign_out_description()}
        </ConfirmDialogDescription>
      </ConfirmDialogHeader>
      <ConfirmDialogFooter>
        <ConfirmDialogCancel />
        <ConfirmDialogConfirm>{m.kit_sign_out()}</ConfirmDialogConfirm>
      </ConfirmDialogFooter>
    </ConfirmDialog>
  )
}
