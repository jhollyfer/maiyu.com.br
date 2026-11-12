import * as React from 'react'

import { Badge } from '#/components/ui/badge'
import { Empty, EmptyDescription } from '#/components/ui/empty'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { cn } from '#/lib/cn'

import { FilterMore, useVisibleCutoff } from './filter-cutoff'

export type FilterChipItem = {
  key: string
  label: string
  /** A explicação, no tooltip. Sigla sem explicação não ajuda a decidir. */
  hint?: string
  count?: number
  /** Ícone antes do rótulo, quando o eixo tem um. */
  icon?: React.ReactNode
  /** Ocupa a linha inteira. É o que separa a subcategoria da categoria mãe. */
  wide?: boolean
  active: boolean
  onSelect: () => void
}

/**
 * Qual chip o clique atingiu.
 *
 * O Base UI devolve o valor **novo** do grupo, e não o item clicado: sem
 * `multiple` ele é `[valor]` ao ligar e `[]` ao desligar
 * (`@base-ui/react/toggle-group/ToggleGroup.mjs`). No vazio, quem foi clicado só
 * pode ser o que estava aceso, e é daí que sai a invariante desta grade:
 * **no máximo um item ativo por vez**.
 *
 * Com dois acesos a dedução pega o primeiro e alterna o eixo errado. Foi o que
 * aconteceu enquanto a subcategoria acendia junto com a categoria mãe: clicar na
 * filha chamava o `onSelect` da mãe, que limpava `categorySlug` e deixava
 * `subcategorySlug` sozinho na URL, um recorte ativo que nem o painel nem os
 * chips da barra sabiam desenhar, e portanto ninguém conseguia tirar.
 */
export function resolveToggleTarget(
  items: ReadonlyArray<FilterChipItem>,
  keys: ReadonlyArray<string>,
): FilterChipItem | undefined {
  if (keys.length > 0) return items.find((item) => item.key === keys[0])

  return items.find((item) => item.active)
}

/**
 * As opções de um eixo, como chips numa grade de duas colunas.
 *
 * **Chip e não caixa de seleção**: `/storefront/products` aceita **um**
 * `categorySlug`, **um** `techniqueSlug`, um valor por eixo, não uma lista. A
 * caixa quadrada que estava aqui prometia soma onde não há soma; o chip com
 * estado diz a verdade. Clicar no que já está ligado desliga, e desmarcar tudo
 * continua sendo um estado válido.
 *
 * **Quem monta os itens mantém no máximo um `active`**: ver
 * `resolveToggleTarget`, que é quem depende disso.
 *
 * `ToggleGroup` e não N `<button aria-pressed>` soltos: a escolha é única, e o
 * grupo é o que dá o papel certo, um só tab stop e as setas do teclado andando
 * entre as opções. Sem `multiple` o Base UI já é exclusivo, e o valor é sempre
 * array.
 *
 * O `Composite` do Base UI não conhece grade: as setas andam pela ordem do DOM,
 * então ← e → percorrem a lista inteira e ↑ e ↓ não fazem nada. É o limite
 * aceito: a alternativa seria reimplementar o foco itinerante em duas
 * dimensões, e a ordem linear ainda alcança toda opção.
 *
 * O estado ativo é pintado por `aria-pressed:`, que a primitiva já emite, não
 * há classe condicional em JavaScript aqui porque não precisa.
 *
 * **Duas colunas, e é o que faz o painel caber sem barra própria**: o mesmo eixo
 * empilhado gasta o dobro da altura, e cinco eixos empilhados passavam da coluna
 * com uma dúzia de opções no total.
 */
export function FilterChipGrid({
  label,
  items,
  emptyLabel,
}: {
  /** O nome do grupo, para o leitor de tela. Não aparece na tela. */
  readonly label: string
  readonly items: ReadonlyArray<FilterChipItem>
  /** O que dizer quando não há opção. Ausente, a seção some. */
  readonly emptyLabel?: string
}): React.JSX.Element | null {
  const { visible, hidden, expand } = useVisibleCutoff(items)
  const group = React.useRef<HTMLDivElement>(null)

  /**
   * Revela o resto, e leva o foco junto.
   *
   * O botão some no mesmo commit em que os chips aparecem, e o foco cairia no
   * `<body>`: quem usa teclado voltaria a tabular desde o topo do painel. O
   * primeiro chip revelado é onde a pessoa estava indo, e o índice dele é o
   * tamanho da fatia de antes.
   */
  const revealed = visible.length

  function onExpand(): void {
    expand()

    requestAnimationFrame(() => {
      const chips = group.current?.querySelectorAll<HTMLElement>(
        '[data-slot="toggle-group-item"]',
      )

      chips?.[revealed]?.focus()
    })
  }

  if (items.length === 0) {
    if (!emptyLabel) return null

    // `Empty` do catálogo: `_doc-lib/shadcn.md` pede estado vazio "em toda
    // listagem", e um eixo sem opção é uma. Sem a moldura tracejada e sem o
    // centro: dentro de uma seção de 280px ela viraria caixa dentro de caixa.
    return (
      <Empty className="items-start gap-0 p-2 text-left">
        <EmptyDescription>{emptyLabel}</EmptyDescription>
      </Empty>
    )
  }

  return (
    <React.Fragment>
      <ToggleGroup
        ref={group}
        data-slot="filter-chip-grid"
        aria-label={label}
        loopFocus
        value={items.filter((item) => item.active).map((item) => item.key)}
        // Desmarcar o chip aceso é voltar a "todos", e é um estado válido:
        // por isso o vazio não é ignorado, é resolvido. Ver `resolveToggleTarget`.
        onValueChange={(keys) => resolveToggleTarget(items, keys)?.onSelect()}
        // `items-stretch` porque o `items-center` das classes-base do
        // `ToggleGroup` sobrevive ao `cn`: o tailwind-merge troca `flex` por
        // `grid`, que é outro grupo de utilitário, e deixa o alinhamento de pé.
        className="grid w-full grid-cols-2 items-stretch gap-2 px-2"
      >
        {visible.map((item) => (
          <FilterChip key={item.key} item={item} />
        ))}
      </ToggleGroup>

      <FilterMore hidden={hidden} onExpand={onExpand} />
    </React.Fragment>
  )
}

function FilterChip({
  item,
}: {
  readonly item: FilterChipItem
}): React.JSX.Element {
  const chip = (
    <ToggleGroupItem
      value={item.key}
      variant="outline"
      className={cn(
        // 44px de alvo no toque e 36 no ponteiro, pelo mesmo motivo escrito em
        // `product-listing/results-toolbar-chips.tsx`. O corte é `lg:` porque é exatamente ali
        // que o painel deixa de ser o Sheet do dedo e vira a coluna do mouse.
        'focus-ring min-h-11 w-full justify-between gap-1.5 rounded-control border-line px-2.5 py-1.5 text-left text-sm text-sea-ink-soft lg:min-h-9',
        'transition-colors duration-150 ease-out motion-reduce:transition-none',
        'hover:border-primary/40 hover:bg-link-hover',
        // O par `aria-pressed:hover:` também: sem ele o fundo do chip ligado
        // volta ao de repouso assim que o ponteiro passa por cima.
        'aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:font-semibold aria-pressed:text-primary',
        'aria-pressed:hover:bg-primary/10',
        item.wide && 'col-span-2',
      )}
    >
      {item.icon}

      <span className="min-w-0 flex-1 truncate">{item.label}</span>

      {item.count !== undefined && (
        <Badge variant="secondary" className="shrink-0 tabular-nums">
          {item.count}
        </Badge>
      )}
    </ToggleGroupItem>
  )

  if (!item.hint) return chip

  // `Tooltip` e não o `title` nativo: o atributo não dispara no foco por
  // teclado, então a explicação só existiria para quem usa mouse.
  return (
    <Tooltip>
      <TooltipTrigger render={chip} />
      <TooltipContent side="right">{item.hint}</TooltipContent>
    </Tooltip>
  )
}
