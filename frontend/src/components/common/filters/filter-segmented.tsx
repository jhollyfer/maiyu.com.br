import type * as React from 'react'

import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'
import { cn } from '#/lib/cn'
import { asSelection } from '#/lib/selection'

export type FilterSegment = {
  value: string
  label: string
}

/**
 * Um eixo binário como dois botões de largura igual.
 *
 * Larguras iguais de propósito: opções de peso igual desenhadas com pesos
 * diferentes sugerem uma recomendação que ninguém fez. O ativo ganha borda e
 * texto na primária; o inativo fica em cinza, e não em fundo sólido, para o
 * conjunto não competir com os cards.
 *
 * `ToggleGroup` e não N botões com `aria-pressed`, pelo mesmo motivo escrito em
 * `product-purchase-variants.tsx`: a escolha é **única**, e o grupo é o que dá o
 * papel certo, um só tab stop e as setas do teclado andando entre as opções.
 * Sem `multiple` o Base UI já é exclusivo, e o valor é sempre array.
 */
export function FilterSegmented({
  label,
  segments,
  value,
  onSelect,
}: {
  /** O rótulo do grupo, para o leitor de tela. Não aparece na tela. */
  readonly label: string
  readonly segments: ReadonlyArray<FilterSegment>
  readonly value: string | undefined
  readonly onSelect: (value: string) => void
}): React.JSX.Element {
  return (
    <ToggleGroup
      data-slot="filter-segmented"
      aria-label={label}
      loopFocus
      value={asSelection(value)}
      onValueChange={([next]) => {
        // Clicar no que já está escolhido devolve array vazio. O eixo sempre
        // tem um lado ativo, então desligar não é um estado: fica onde está.
        if (next) onSelect(next)
      }}
      className="w-full px-2 py-1"
    >
      {segments.map((segment) => {
        const active = segment.value === value

        return (
          <ToggleGroupItem
            key={segment.value}
            value={segment.value}
            variant="outline"
            className={cn(
              'focus-ring h-10 flex-1 rounded-control text-xs font-medium',
              !active && 'text-sea-ink-soft',
              active && 'border-primary text-primary',
            )}
          >
            {segment.label}
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
