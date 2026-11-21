import type * as React from 'react'

import { Skeleton } from '#/components/ui/skeleton'
import { m } from '#/paraglide/messages'

import { PageShell, PageShellContent, PageShellHeader } from './page-shell'

type DetailSkeletonProps = {
  /** Quantos blocos de campo (ou linhas rótulo/valor) desenhar. */
  readonly fields?: number
}

/**
 * O cabeçalho de toda tela de detalhe: voltar, título e ação. `min-w-0` e `max-w-full` seguram a
 * barra do título dentro de 375px.
 */
function DetailSkeletonShell({
  children,
}: {
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <PageShell data-slot="detail-skeleton" aria-busy="true">
      <span className="sr-only" role="status">
        {m.kit_loading()}
      </span>

      <PageShellHeader aria-hidden>
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="size-9 shrink-0" />
          <div className="flex min-w-0 flex-col gap-2">
            <Skeleton className="h-8 w-56 max-w-full" />
            <Skeleton className="h-3 w-72 max-w-full" />
          </div>
        </div>
        <Skeleton className="h-9 w-32 max-sm:w-full" />
      </PageShellHeader>

      <PageShellContent aria-hidden>{children}</PageShellContent>
    </PageShell>
  )
}

/**
 * O esqueleto de uma tela de detalhe ou de edição em blocos de campo, para o `pendingComponent` da
 * rota (`_standards/frontend.md` §5): cabeçalho e rótulo sobre campo, em duas colunas de `md` para
 * cima e em uma no celular. O par da listagem é o `TableSkeleton`, o do formulário é o
 * `FormShellSkeleton`.
 *
 * Mora no arquivo crítico da rota pelo mesmo motivo do `TableSkeleton`: dentro do chunk lazy ele só
 * chegaria quando já não fosse preciso.
 */
export function DetailSkeleton({
  fields = 6,
}: DetailSkeletonProps): React.JSX.Element {
  return (
    <DetailSkeletonShell>
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: fields }, (_, field) => (
          <div key={field} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </DetailSkeletonShell>
  )
}

/**
 * O detalhe só de leitura, em linhas rótulo/valor mais um bloco de texto (um log, um registro): o
 * rótulo estreito sobre o valor no celular, lado a lado de `sm` para cima.
 */
export function DetailRowsSkeleton({
  fields = 6,
}: DetailSkeletonProps): React.JSX.Element {
  return (
    <DetailSkeletonShell>
      <section className="flex flex-col gap-3">
        <div className="rounded-md border bg-muted/30">
          {Array.from({ length: fields }, (_, row) => (
            <div
              key={row}
              className="grid gap-1 border-b border-border/60 px-3 py-2 last:border-b-0 sm:grid-cols-[140px_1fr] sm:gap-3"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-56 max-w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-40 w-full rounded-md" />
      </section>
    </DetailSkeletonShell>
  )
}
