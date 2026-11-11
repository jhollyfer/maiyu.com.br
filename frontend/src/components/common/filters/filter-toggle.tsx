import * as React from 'react'

import { Field, FieldLabel, FieldTitle } from '#/components/ui/field'
import { Switch } from '#/components/ui/switch'

/**
 * Um eixo booleano: ícone, rótulo e interruptor à direita.
 *
 * Interruptor e não caixa de seleção porque o eixo é um **modo**, não um item de
 * uma lista, "só peças disponíveis" liga e desliga, não se soma a nada. A
 * distinção é a mesma que separa uma preferência de uma escolha múltipla, e usar
 * a peça certa é o que faz o painel parecer projetado em vez de montado.
 */
export function FilterToggle({
  id,
  icon,
  label,
  checked,
  onToggle,
}: {
  readonly id: string
  readonly icon?: React.ReactNode
  readonly label: string
  readonly checked: boolean
  readonly onToggle: () => void
}): React.JSX.Element {
  return (
    <FieldLabel
      htmlFor={id}
      data-slot="filter-toggle"
      className="min-h-11 cursor-pointer rounded-chip px-2 py-1.5 text-sm hover:bg-link-hover"
    >
      <Field orientation="horizontal">
        {icon}

        <FieldTitle className="min-w-0 flex-1 font-normal">{label}</FieldTitle>

        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onToggle}
          className="focus-ring shrink-0"
        />
      </Field>
    </FieldLabel>
  )
}
