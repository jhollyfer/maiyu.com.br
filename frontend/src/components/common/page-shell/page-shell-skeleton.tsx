import type * as React from 'react'

import { Skeleton } from '#/components/ui/skeleton'
import { m } from '#/paraglide/messages'

import { PageShell, PageShellContent, PageShellHeader } from './page-shell'

/**
 * O esqueleto de uma tela de detalhe ou de edição, para o `pendingComponent`
 * da rota (`_standards/frontend.md` §1.2 e §5): o cabeçalho com voltar, título
 * e ações, e blocos de campo no corpo. O par da listagem é o `TableSkeleton`.
 *
 * Mora no arquivo crítico da rota pelo mesmo motivo do `TableSkeleton`: dentro
 * do chunk lazy ele só chegaria quando já não fosse preciso.
 */
export function DetailSkeleton({
  fields = 6,
}: {
  /** Quantos blocos de campo desenhar. */
  readonly fields?: number
}): React.JSX.Element {
  return (
    <PageShell aria-busy="true">
      <span className="sr-only" role="status">
        {m.kit_loading()}
      </span>

      <PageShellHeader aria-hidden>
        <div className="flex items-center gap-3">
          <Skeleton className="size-9" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-3 w-72" />
          </div>
        </div>
        <Skeleton className="h-9 w-32" />
      </PageShellHeader>

      <PageShellContent aria-hidden>
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: fields }, (_, field) => (
            <div key={field} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      </PageShellContent>
    </PageShell>
  )
}
