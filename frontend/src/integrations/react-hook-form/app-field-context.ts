import * as React from 'react'
import type {
  ControllerFieldState,
  ControllerRenderProps,
  FieldValues,
} from 'react-hook-form'

import type { Merge } from '@maiyu/shared'

/**
 * The pair the react-hook-form `Controller` hands to render: the field binding
 * (`value`/`onChange`/`onBlur`/`name`/`ref`) and its state (`invalid`,
 * `error`, `isTouched`).
 */
export type FieldContextValue<TValue = unknown> = {
  readonly field: Merge<
    ControllerRenderProps<FieldValues, string>,
    { value: TValue }
  >
  readonly fieldState: ControllerFieldState
}

export const FieldContext = React.createContext<FieldContextValue | null>(null)

/**
 * The field binding, for the field components that sit inside an
 * `AppField`.
 *
 * `consumer` goes into the message so the error says **which** component was
 * left outside the provider; without it the error only reports "missing provider"
 * and leaves the search to whoever reads the stack.
 */
export function useFieldContext<TValue = unknown>(
  consumer: string,
): FieldContextValue<TValue> {
  const value = React.use(FieldContext)
  if (!value)
    throw new Error(`\`${consumer}\` precisa estar dentro de \`AppField\``)
  return value
}
