import React from 'react'
import type { RefCallBack } from 'react-hook-form'

import { errorId, invalidProps } from '#/lib/form-a11y'

import { useFieldContext } from './app-field-context'
import type { FieldContextValue } from './app-field-context'

type FieldBinding<TValue> = {
  readonly name: string
  readonly value: TValue
  readonly onChange: (value: TValue) => void
  readonly onBlur: () => void
  /** On the focusable control: the submit focuses the first invalid field. */
  readonly ref: RefCallBack
}

type UseFieldValidationResult<TValue> = {
  field: FieldBinding<TValue>
  isInvalid: boolean
  /** The shadcn `FieldError` `errors` shape, passed straight through. */
  errors: Array<{ message: string }>
  /** The `FieldError` `id`, from the `name` (already prefixed). */
  errorId: string
  /** The control `aria-describedby`: the error, only when invalid. */
  describedBy: string | undefined
}

/**
 * `name` prefix the fields use as `id` and `htmlFor`.
 *
 * Row fields build the `id` from the slug. A form opened on top of another
 * (the "Novo registro em <tabela>" sheet) repeated the ids of the one behind,
 * and the sheet label pointed to the wrong field. Whoever stacks a form
 * declares a prefix; the main form has none.
 */
const FieldIdPrefixContext = React.createContext('')

export const FieldIdPrefixProvider = FieldIdPrefixContext.Provider

/**
 * The field binding plus the already resolved error state.
 *
 * Invalid is the `Controller` `fieldState.invalid`; the server error arrives
 * through the same path, via `form.setError(name, ...)`.
 */
export function useFieldValidation<TValue = unknown>(
  consumer: string,
): UseFieldValidationResult<TValue> {
  // Through the provider's own hook, not a parallel `React.use`: it was the
  // same access and the same guard written twice, and only one of them said
  // which component was left out.
  const context = useFieldContext<TValue>(consumer)
  const prefix = React.use(FieldIdPrefixContext)

  const result = buildFromReactHookForm<TValue>(context)
  // Only `name` changes: the binding (value, onChange, ref) stays the
  // `Controller` one, and `name` serves the fields for `id`/`htmlFor`/`name`.
  let field = result.field
  if (prefix) field = { ...field, name: prefix.concat(field.name) }

  const { 'aria-describedby': describedBy } = invalidProps(
    result.isInvalid,
    field.name,
  )

  return { ...result, field, errorId: errorId(field.name), describedBy }
}

function buildFromReactHookForm<TValue>(
  context: FieldContextValue<TValue>,
): Omit<UseFieldValidationResult<TValue>, 'errorId' | 'describedBy'> {
  const errors: Array<{ message: string }> = []
  if (context.fieldState.error?.message) {
    errors.push({ message: context.fieldState.error.message })
  }

  return {
    // The context keeps the common shape; each field component picks the value
    // type.
    field: context.field,
    isInvalid: context.fieldState.invalid,
    errors,
  }
}
