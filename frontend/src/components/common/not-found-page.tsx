import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from '@phosphor-icons/react'

import { SkyBackdrop } from '#/components/common/sky'
import { Button } from '#/components/ui/button'
import { ButtonGroup } from '#/components/ui/button-group'
import { cn } from '#/lib/utils'
import type { Merge } from '#/lib/interfaces'
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
 * `Actions`, `HomeButton`), com a cara da Maiyu no lugar do painel preto e do
 * astronauta: céu, mata e a pílula navy com o código. Sem children, escreve o
 * 404 genérico; a fronteira de erro troca as partes que quiser.
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
      className={cn(
        'relative flex min-h-dvh items-center overflow-hidden px-4 pt-16',
        className,
      )}
      {...props}
    >
      <SkyBackdrop />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center pb-[clamp(140px,17vw,240px)] text-center">
        <span className="mb-7 inline-flex items-center rounded-full bg-navy px-3.5 py-1.5 text-micro font-bold text-brand-green dark:border dark:border-brand-green/50 dark:bg-brand-green/5">
          {code}
        </span>
        {children ?? (
          <>
            <NotFoundPageTitle>{m.notFound_title()}</NotFoundPageTitle>
            <NotFoundPageDescription>
              {m.notFound_description()}
            </NotFoundPageDescription>
            <NotFoundPageActions>
              <NotFoundPageHomeButton />
            </NotFoundPageActions>
          </>
        )}
      </div>
    </section>
  )
}

export function NotFoundPageTitle({
  className,
  ...props
}: React.ComponentProps<'h1'>): React.JSX.Element {
  return (
    <h1
      data-slot="not-found-page-title"
      className={cn('text-display tracking-[-0.02em]', className)}
      {...props}
    />
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
        'mt-7 max-w-[44ch] text-lead text-foreground/80',
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
      className={cn('mt-10 flex-wrap items-center justify-center', className)}
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
          {children ?? m.notFound_returnHome()}
        </Link>
      }
    />
  )
}
