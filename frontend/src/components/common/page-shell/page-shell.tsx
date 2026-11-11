import * as React from 'react'

import { cn } from '#/lib/cn'
import type { Merge } from '@maiyu/shared'

/**
 * A casca de uma tela do painel: cabeçalho fixo, conteúdo que rola, rodapé fixo.
 *
 * O que ela resolve é uma coisa só, e é a que mais dá trabalho em CSS: a
 * paginação parar de descer junto com a lista. Sem ela a tela inteira rola, e a
 * paginação de uma lista de 50 linhas fica abaixo da dobra: para trocar de
 * página é preciso rolar até o fim, e ao chegar na página seguinte rolar de
 * volta ao topo.
 *
 * A corrente de `min-h-0` é o que faz isso funcionar: um filho `flex` não encolhe
 * abaixo do próprio conteúdo por default, então sem ele o `overflow-auto` do
 * meio nunca recebe altura limitada e o scroll vaza para fora.
 *
 * Compound e não uma prop `header`/`footer`: os slots aceitam qualquer coisa, e
 * a ordem no JSX é a ordem na tela.
 */
type PageShellProps = Merge<
  React.ComponentProps<'div'>,
  { readonly children: React.ReactNode }
>

export function PageShell({
  children,
  className,
  ...props
}: PageShellProps): React.JSX.Element {
  return (
    <div
      data-slot="page-shell"
      // `min-h-0 flex-1` e não `h-full`: dentro de um pai flex com altura ela
      // preenche o que sobra; fora de um, ela simplesmente flui. `h-full`
      // resolveria para `auto` no segundo caso e o `overflow-hidden`
      // recortaria o conteúdo.
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-4 overflow-hidden',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * A linha divisória embaixo é da peça; conteúdo que já tem borda tira a dela por `className`
 * (`border-b-0`), sem prop booleana de layout (KIT.md §1 item 6).
 */
type PageShellHeaderProps = Merge<
  React.ComponentProps<'div'>,
  { readonly children: React.ReactNode }
>

export function PageShellHeader({
  children,
  className,
  ...props
}: PageShellHeaderProps): React.JSX.Element {
  return (
    <div
      data-slot="page-shell-header"
      className={cn(
        'flex shrink-0 flex-col gap-2 border-b pb-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * A área que rola de toda tela do painel.
 *
 * **`data-scroll-restoration-id` é o que dá nome a esta rolagem.** O router
 * salva a posição de qualquer elemento que role, mas sem um id ele identifica
 * o elemento por um seletor posicional montado subindo a árvore com índices de
 * `nth-child`. Basta a página renderizar com um filho a mais numa visita, o
 * `Alert` de "loja fora da vitrine" do painel da empresa é condicional, para o
 * seletor gravado não casar mais com o elemento, e a volta cair no topo da
 * lista em vez de onde a pessoa estava.
 *
 * Constante e não derivado da rota: só existe uma destas por tela, e o router
 * guarda a posição por chave de localização, não por id.
 */
const SCROLL_ID = 'page-shell-content'

export function PageShellContent({
  children,
  className,
  ...props
}: PageShellProps): React.JSX.Element {
  return (
    <div
      data-slot="page-shell-content"
      data-scroll-restoration-id={SCROLL_ID}
      className={cn(
        'relative flex min-h-0 flex-1 flex-col overflow-auto',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

type PageShellFooterProps = Merge<
  React.ComponentProps<'div'>,
  { readonly children?: React.ReactNode }
>

export function PageShellFooter({
  children,
  className,
  ...props
}: PageShellFooterProps): React.JSX.Element {
  return (
    <div
      data-slot="page-shell-footer"
      className={cn('shrink-0 border-t pt-3', className)}
      {...props}
    >
      {children}
    </div>
  )
}
