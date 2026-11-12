import { CaretDownIcon } from '@phosphor-icons/react'
import * as React from 'react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '#/components/ui/collapsible'
import { Separator } from '#/components/ui/separator'
import type { Merge } from '@maiyu/shared'

import { useSectionState } from './use-section-state'

type FilterSectionProps = Merge<
  React.ComponentProps<'div'>,
  {
    /** A chave da persistência. Um eixo, um valor estável. */
    readonly axis: string
    readonly title: string
  }
>

/**
 * Uma seção do painel: título, chevron que gira, conteúdo retrátil.
 *
 * `Collapsible` do catálogo, e não `Accordion`, que era o que estava aqui:
 * accordion coordena um grupo, com a expectativa de que abrir um feche outro, e
 * o painel de filtros quer o oposto, cada eixo independente do vizinho. Com o
 * Collapsible cada seção guarda o próprio estado e a animação de altura vem de
 * graça pelos `data-*` do Base UI.
 *
 * O estado sobrevive à navegação (ver `useSectionState`): quem fecha
 * "Técnicas" porque não usa não quer reabri-la a cada filtro aplicado.
 *
 * A régua vem com a seção, e não do container: assim o painel continua aceitando
 * qualquer conjunto de eixos, quem monta escolhe quais, e a divisão acompanha.
 * Sem `decorative`: essa prop é do Radix, e o `Separator` daqui é do Base UI,
 * onde o padrão **já** é decorativo quando não há orientação semântica
 * (`_doc-lib/base-ui.md`, components/separator). `first:hidden` porque a
 * primeira seção não separa nada do que vem antes.
 */
export function FilterSection({
  axis,
  title,
  children,
  ...rest
}: FilterSectionProps): React.JSX.Element {
  const [open, setOpen] = useSectionState(axis)

  return (
    <React.Fragment>
      <Separator className="first:hidden" />

      <Collapsible
        data-slot="filter-section"
        open={open}
        onOpenChange={setOpen}
        render={<div {...rest} />}
      >
        <CollapsibleTrigger className="focus-ring group flex w-full items-center justify-between rounded-chip py-2 text-left">
          <span className="section-title">{title}</span>
          <CaretDownIcon className="size-4 shrink-0 text-sea-ink-soft transition-transform duration-150 ease-out group-data-[panel-open]:rotate-180 motion-reduce:transition-none" />
        </CollapsibleTrigger>

        <CollapsibleContent className="flex flex-col gap-1 pt-0.5 pb-3">
          {children}
        </CollapsibleContent>
      </Collapsible>
    </React.Fragment>
  )
}
