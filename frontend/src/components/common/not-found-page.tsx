import type * as React from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from '@phosphor-icons/react'

import { SkyBackdrop } from '#/components/common/sky'
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
 * Mesma API compound do academy (`Title`, `Description`, `Actions`), com a cara
 * da Maiyu: céu, mata e a pílula navy com o código. Sem children, escreve o 404
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
              <NotFoundPageHomeLink />
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

export function NotFoundPageDescription({
  className,
  ...props
}: React.ComponentProps<'p'>): React.JSX.Element {
  return (
    <p
      data-slot="not-found-page-description"
      className={cn('mt-7 max-w-[44ch] text-lead text-foreground/80', className)}
      {...props}
    />
  )
}

export function NotFoundPageActions({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="not-found-page-actions"
      className={cn('mt-10 flex flex-wrap justify-center gap-2', className)}
      {...props}
    />
  )
}

/**
 * A saída padrão: voltar ao início. Link e não botão, para responder a abrir em
 * nova aba e ao clique do meio.
 */
export function NotFoundPageHomeLink(): React.JSX.Element {
  return (
    <Link
      to="/"
      data-slot="not-found-page-home-link"
      className="inline-flex items-center gap-2 rounded-full border border-foreground/25 px-6 py-3 text-small font-medium transition-colors hover:border-foreground/50 hover:bg-foreground/[0.04]"
    >
      <ArrowLeftIcon size={15} />
      {m.notFound_returnHome()}
    </Link>
  )
}
