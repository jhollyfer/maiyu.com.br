import type * as React from 'react'

/**
 * O que a entrada mostra abaixo do formulário: o caminho para o cadastro do projeto ("Ainda não tem
 * conta? Crie"). É ponto de extensão do projeto (KIT.md §3.4, DECISIONS.md #763): o sync cria este
 * esqueleto se faltar e nunca o sobrescreve, porque o cadastro é do projeto (#491, D4). O `.lazy.tsx`
 * da entrada o renderiza dentro do `AuthShellContent`, depois do `SignInForm`.
 *
 * Vazio por padrão: projeto sem cadastro público não mostra nada. Com cadastro, devolva o markup
 * inteiro aqui. O link é `Link` com `buttonVariants({ variant: 'link' })`, nunca `Button` com
 * `render={<Link />}` (DECISIONS.md #440), e o alvo de toque de 44 px no celular vem do `buttonVariants`
 * (#461), sem classe à mão:
 *
 *   <p className="text-center text-sm text-muted-foreground">
 *     {m.sign_in_no_account()}{' '}
 *     <Link to="/sign-up" className={buttonVariants({ variant: 'link' })}>
 *       {m.sign_in_create_account()}
 *     </Link>
 *   </p>
 *
 * A mensagem é do projeto (chave fora de `kit_*`) e a rota `/sign-up` também.
 */
export function SignInFooter(): React.JSX.Element | null {
  return null
}
