import { createContext, use } from 'react'

export type OptionComboboxItem = {
  readonly value: string
  readonly label: string
  /** The color class of the state dot, when the field has one. */
  readonly dot?: string
}

type OptionComboboxContextValue = {
  readonly selected: OptionComboboxItem | null
  readonly disabled: boolean | undefined
  readonly clear: () => void
}

export const OptionComboboxContext =
  createContext<OptionComboboxContextValue | null>(null)

export function useOptionComboboxContext(
  consumer: string,
): OptionComboboxContextValue {
  const context = use(OptionComboboxContext)
  if (!context)
    throw new Error(`<${consumer}> must be used inside <OptionCombobox>`)
  return context
}
