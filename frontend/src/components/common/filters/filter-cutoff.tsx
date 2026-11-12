import { CaretDownIcon } from '@phosphor-icons/react'
import * as React from 'react'

import { Button } from '#/components/ui/button'
import { m } from '#/paraglide/messages'

/** Quantos itens aparecem antes do "Ver mais". */
const VISIBLE = 5

/**
 * O corte de um eixo longo, e o que sobrou dele.
 *
 * O corte existe porque a coluna tem 280px: um eixo com trinta técnicas
 * empurra os outros para fora da tela, e a pessoa não descobre que eles
 * existem. Sem volta de propósito: quem abriu a lista quer escolher, e um
 * "Ver menos" reorganizaria o painel embaixo do dedo.
 *
 * **O que está escolhido nunca fica do lado escondido**: uma técnica na décima
 * segunda posição some atrás do corte, e o eixo passa a se anunciar vazio, a
 * pessoa vê a lista filtrada sem nenhum chip aceso que explique por quê. Quando
 * o ativo cai fora da fatia ele entra no fim dela, e a ordem quebrada é o preço
 * certo por manter visível a única opção que dá para desligar.
 *
 * Isso, e não um `useState` inicial: os eixos chegam de consulta, e o primeiro
 * render tem a lista vazia, um estado semeado ali nasceria errado e ficaria.
 */
export function useVisibleCutoff<T extends { active: boolean }>(
  items: ReadonlyArray<T>,
  limit: number = VISIBLE,
): {
  visible: ReadonlyArray<T>
  hidden: number
  expand: () => void
} {
  const [expanded, setExpanded] = React.useState(false)

  let visible = items

  if (!expanded) {
    visible = items.slice(0, limit)

    const active = items.find((item) => item.active)
    if (active && !visible.includes(active)) visible = [...visible, active]
  }

  return {
    visible,
    hidden: items.length - visible.length,
    expand: () => setExpanded(true),
  }
}

/**
 * O botão que revela o resto.
 *
 * **Fora do `ToggleGroup`**, sempre: ele não é uma opção do eixo, e um botão
 * comum dentro do grupo entraria no foco itinerante das setas como se fosse
 * mais um valor escolhível.
 */
export function FilterMore({
  hidden,
  onExpand,
}: {
  readonly hidden: number
  readonly onExpand: () => void
}): React.JSX.Element | null {
  if (hidden <= 0) return null

  return (
    <Button
      variant="ghost"
      onClick={onExpand}
      className="focus-ring h-8 justify-start gap-1 px-2 text-xs font-medium text-sea-ink-soft"
    >
      {m.kit_filters_show_more({ count: hidden })}
      <CaretDownIcon className="size-3" />
    </Button>
  )
}
