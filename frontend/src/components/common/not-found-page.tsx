import { ArrowLeftIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import * as React from 'react'

import { Button } from '#/components/ui/button'
import { ButtonGroup } from '#/components/ui/button-group'
import type { Merge } from '#/lib/interfaces'
import { cn } from '#/lib/utils'
import { m } from '#/paraglide/messages'

type NotFoundPageProps = Merge<
  React.ComponentProps<'section'>,
  {
    /**
     * O código na pílula. `404` por padrão; a fronteira de erro do router passa
     * `500`, e sem este parâmetro anunciaria "404" para uma falha de servidor.
     */
    code?: React.ReactNode
  }
>

/**
 * A página de saída: endereço que não existe, e também erro não tratado.
 *
 * A mesma API compound do academy (`Title`, `Subtitle`, `Description`,
 * `Actions`, `HomeButton`), em tipografia: o código num marcador de losango
 * de urucum, o título em serifa de exibição, texto à esquerda e a faixa
 * trançada no pé. Sem céu nem mata: a ilustração competia com a única coisa
 * que a pessoa precisa ler, que é como sair daqui. Sem children, escreve o 404
 * genérico; a fronteira de erro troca as partes que quiser.
 */
export function NotFoundPage({
  className,
  code = '404',
  children,
  ...props
}: NotFoundPageProps): React.JSX.Element {
  return (
    <section
      data-slot="not-found-page"
      className={cn('flex min-h-dvh flex-col pt-16', className)}
      {...props}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-24 md:px-8">
        <div className="flex max-w-3xl flex-col items-start text-balance">
          <p className="mb-7 flex items-center gap-3 text-small font-medium text-muted-foreground">
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rotate-45 bg-urucum"
            />
            {code}
          </p>
          {children ?? (
            <>
              <NotFoundPageTitle>{m.not_found_title()}</NotFoundPageTitle>
              <NotFoundPageDescription>
                {m.not_found_description()}
              </NotFoundPageDescription>
              <NotFoundPageActions>
                <NotFoundPageHomeButton />
              </NotFoundPageActions>
            </>
          )}
        </div>
      </div>
      <div aria-hidden="true" className="trancado" />
    </section>
  )
}

export function NotFoundPageTitle({
  className,
  children,
  ...props
}: React.ComponentProps<'h1'>): React.JSX.Element {
  return (
    <h1
      data-slot="not-found-page-title"
      className={cn('text-display tracking-[-0.02em]', className)}
      {...props}
    >
      {children}
    </h1>
  )
}

export function NotFoundPageSubtitle({
  className,
  ...props
}: React.ComponentProps<'p'>): React.JSX.Element {
  return (
    <p
      data-slot="not-found-page-subtitle"
      className={cn('mt-4 text-h4 font-semibold text-foreground', className)}
      {...props}
    />
  )
}

export function NotFoundPageDescription({
  className,
  ...props
}: React.ComponentProps<'p'>): React.JSX.Element {
  return (
    <p
      data-slot="not-found-page-description"
      className={cn(
        'mt-7 max-w-[62ch] text-lead text-foreground/80',
        className,
      )}
      {...props}
    />
  )
}

export function NotFoundPageActions({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element | null {
  if (!children) return null

  return (
    // Cada ação num grupo aninhado, como no academy: o `ButtonGroup` cola os
    // filhos diretos, e estas são saídas independentes, não um controle
    // segmentado.
    <ButtonGroup
      data-slot="not-found-page-actions"
      className={cn('mt-10 flex-wrap items-center', className)}
      {...props}
    >
      {React.Children.map(children, (action) => {
        if (!action) return null

        return <ButtonGroup>{action}</ButtonGroup>
      })}
    </ButtonGroup>
  )
}

/**
 * A saída padrão: voltar ao início.
 *
 * `to` segue prop, porque é destino de navegação e não markup, e como `Link` o
 * botão responde a abrir em nova aba e ao clique do meio.
 */
export function NotFoundPageHomeButton({
  to = '/',
  children,
}: {
  to?: string
  children?: React.ReactNode
}): React.JSX.Element {
  return (
    <Button
      nativeButton={false}
      variant="outline"
      size="lg"
      data-slot="not-found-page-home-button"
      className="w-fit rounded-full px-6"
      render={
        <Link to={to}>
          <ArrowLeftIcon />
          {children ?? m.not_found_return_home()}
        </Link>
      }
    />
  )
}
