import { Link } from '@tanstack/react-router'
import type * as React from 'react'

import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert'
import { buttonVariants } from '#/components/ui/button'
import { ProfilePending } from '#/lib/profile-pending'
import { m } from '#/paraglide/messages'

type ProfileIncompleteNoticeProps = Readonly<{
  /** Os campos do perfil que faltam: o dado que o projeto lê do recurso que os exige. */
  missing: ReadonlyArray<string>
  /** O rótulo do projeto por campo; sem ele vale o `FIELD_LABELS` do `shared/`. */
  labels?: Readonly<Record<string, string>>
}>

/**
 * O aviso de perfil incompleto (DECISIONS.md #799): a conta entra e usa o painel, e este aviso pede
 * que ela complete o perfil, com o link para a página dele (`/profile`). Só a função que depende do
 * dado fica travada; o que falta chega por `missing`, lido pelo projeto do recurso que o exige (o
 * restaurante sem Pix, `<recurso>MeQueryOptions`), nunca de campo novo no `AccountProfileShowResponse`.
 * Sem pendência, nada aparece. O `PanelShell` o mostra no topo do conteúdo quando recebe
 * `profilePending`.
 *
 * É o `Alert` do shadcn, o aviso que fica na tela (_doc-lib/shadcn.md#alert,
 * https://ui.shadcn.com/docs/components/base/alert.md). O link é `Link` com `buttonVariants`, nunca
 * `Button` com `render={<Link />}` (DECISIONS.md #440).
 */
export function ProfileIncompleteNotice({
  missing,
  labels,
}: ProfileIncompleteNoticeProps): React.JSX.Element | null {
  if (missing.length === 0) return null

  return (
    <Alert data-slot="profile-incomplete-notice">
      <AlertTitle>{m.kit_profile_incomplete_title()}</AlertTitle>
      <AlertDescription>
        {m.kit_profile_incomplete_description({
          fields: ProfilePending.describe(missing, { labels }),
        })}
      </AlertDescription>
      <Link
        to="/profile"
        className={buttonVariants({
          variant: 'outline',
          size: 'sm',
          className: 'mt-2 justify-self-start',
        })}
      >
        {m.kit_profile_incomplete_action()}
      </Link>
    </Alert>
  )
}
