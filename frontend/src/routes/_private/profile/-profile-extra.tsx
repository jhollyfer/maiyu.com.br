import type * as React from 'react'

import type { AccountProfileShowResponse } from '@maiyu/shared'

type ProfileExtraProps = Readonly<{
  /** A conta da sessão: o `context.account` do `_private`, a mesma que o formulário do perfil recebe. */
  account: AccountProfileShowResponse
}>

/**
 * O que o perfil mostra abaixo do formulário: o que é do projeto, como o link para a área de quem não
 * tem papel (o entregador, o vendedor aprovado, `frontend.md` §3.4, DECISIONS.md #765). É ponto de
 * extensão do projeto (KIT.md §2, DECISIONS.md #774): o sync cria este esqueleto se faltar e nunca o
 * sobrescreve. O `index.lazy.tsx` do perfil o renderiza dentro do `PageShellContent`, depois do
 * `AccountProfileForm`, com a conta da sessão em `account`: o projeto decide o que mostrar sem refazer
 * a consulta da conta.
 *
 * Vazio por padrão: projeto sem nada a acrescentar não mostra nada (a constante tipada mantém a prop no
 * contrato sem parâmetro sem uso). Para mostrar, troque-a por
 * `export function ProfileExtra({ account }: ProfileExtraProps): React.JSX.Element | null` e devolva o
 * markup inteiro. O vínculo de domínio vem do recurso que o prova
 * (`<recurso>MeQueryOptions`, ex. `GET /courier/me`), nunca de campo novo no `AccountProfileShowResponse`
 * (#765). O link é `Link` com `buttonVariants`, nunca `Button` com `render={<Link />}` (DECISIONS.md
 * #440), e o alvo de toque de 44 px no celular vem do `buttonVariants` (#461):
 *
 *   const courier = useQuery(courierMeQueryOptions)
 *   if (!courier.data) return null
 *   return (
 *     <Link to="/courier" className={buttonVariants({ variant: 'outline' })}>
 *       {m.profile_courier_area()}
 *     </Link>
 *   )
 *
 * A mensagem é do projeto (chave fora de `kit_*`) e a rota da área também.
 */
export const ProfileExtra: (
  props: ProfileExtraProps,
) => React.JSX.Element | null = () => null
