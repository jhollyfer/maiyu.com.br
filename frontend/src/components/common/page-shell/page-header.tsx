import { ArrowLeftIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import * as React from 'react'

import { buttonVariants } from '#/components/ui/button'
import { ButtonGroup } from '#/components/ui/button-group'
import { cn } from '#/lib/cn'
import { m } from '#/paraglide/messages'

/**
 * O título de uma tela, com voltar opcional à esquerda e ações à direita.
 *
 * Separado do `PageShellHeader` porque nem todo cabeçalho é um título: o de uma
 * tela de formulário em passos tem outra coisa ali.
 *
 * Slots e não props de texto porque as telas não concordam sobre o que vai
 * aqui: umas não voltam para lugar nenhum, outras têm três botões à direita, e
 * a ficha de um produto mostra dois badges que a de um endereço não tem. Com
 * prop, cada variação dessas vira mais uma prop opcional aqui dentro.
 *
 * A grade tem três colunas fixas, `[auto_1fr_auto]`, e cada parte declara
 * onde entra. Assim a ordem no JSX não decide o layout, e a coluna de uma parte
 * ausente colapsa para largura zero sozinha, sem `has-data-[...]`.
 */
export function PageHeader({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="page-header"
      className={cn(
        'grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-0.5',
        className,
      )}
      {...props}
    />
  )
}

type PageHeaderBackProps = {
  /**
   * Para onde o botão de voltar aponta.
   *
   * Uma rota, e não um callback: voltar é navegação, e como `Link` ele responde
   * a abrir em nova aba, ao clique do meio e ao menu de contexto. Um `onClick`
   * com `navigate()` não faz nada disso. Por isso segue prop e não slot: é
   * destino, não markup.
   */
  readonly to: LinkProps['to']
  readonly params?: LinkProps['params']
}

/** A seta de voltar. A tela que não veio de lugar nenhum simplesmente não a escreve. */
export function PageHeaderBack({
  to,
  params,
}: PageHeaderBackProps): React.JSX.Element {
  return (
    <Link
      to={to}
      params={params}
      data-slot="page-header-back"
      aria-label={m.kit_back()}
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'icon' }),
        'col-start-1 row-span-2 row-start-1 self-center',
      )}
    >
      <ArrowLeftIcon />
    </Link>
  )
}

export function PageHeaderTitle({
  className,
  children,
  ...props
}: React.ComponentProps<'h1'>): React.JSX.Element {
  return (
    <h1
      data-slot="page-header-title"
      className={cn(
        'col-start-2 row-start-1 flex flex-wrap items-center gap-3 text-2xl font-bold',
        className,
      )}
      {...props}
    >
      {children}
    </h1>
  )
}

/**
 * Os badges à direita do título, na mesma linha.
 *
 * Parte própria, e não texto solto dentro do título: o `<span>` isola o que é
 * estado do que é nome. Para quem lê a tela por leitor de tela, "Cacau em pó
 * Ativo Arquivado" viraria o nome do registro.
 */
export function PageHeaderBadges({
  className,
  children,
  ...props
}: React.ComponentProps<'span'>): React.JSX.Element | null {
  if (!children) return null

  return (
    <span
      data-slot="page-header-badges"
      className={cn(
        'flex flex-wrap items-center gap-3 text-base font-normal',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

/** Some quando a tela não tem o que explicar. */
export function PageHeaderDescription({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element | null {
  if (!children) return null

  return (
    <div
      data-slot="page-header-description"
      className={cn(
        'col-start-2 row-start-2 text-xs text-muted-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * As ações da direita: criar, editar, arquivar, exportar, uma, três ou
 * nenhuma. `flex-wrap` porque três botões não cabem lado a lado no telefone.
 *
 * Cada ação entra num `ButtonGroup` próprio, e não solta no grupo de fora: o
 * `ButtonGroup` **cola** os filhos diretos, tira o arredondamento da direita e
 * a borda da esquerda, e é assim que se desenha um controle segmentado. Estas
 * ações não são um controle só; são botões independentes que às vezes quebram
 * linha. Um filho sozinho no grupo aninhado recebe o arredondamento de volta
 * pela regra `:not(:has(~[data-slot]))`, então desenha igual a um `Button` solto,
 * e o grupo de fora reconhece os aninhados e devolve o `gap-2`.
 */
export function PageHeaderActions({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element | null {
  if (!children) return null

  return (
    <ButtonGroup
      data-slot="page-header-actions"
      className={cn(
        'col-start-3 row-span-2 row-start-1 flex-wrap items-center justify-end self-center',
        className,
      )}
      {...props}
    >
      {React.Children.map(children, (action) => {
        if (!action) return null

        return <ButtonGroup>{action}</ButtonGroup>
      })}
    </ButtonGroup>
  )
}
