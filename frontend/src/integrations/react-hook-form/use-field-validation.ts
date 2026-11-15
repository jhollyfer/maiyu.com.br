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
  /**
   * The control `id` and its label `htmlFor`: `useId()` plus the `name`. Two forms on the same
   * page with a field of the same name (checkout and newsletter e-mail) would share the `id`
   * from the `name` alone, and each label would point at the first field
   * (https://react.dev/reference/react/useId, stable between SSR and hydration).
   */
  controlId: string
  isInvalid: boolean
  /** The shadcn `FieldError` `errors` shape, passed straight through. */
  errors: Array<{ message: string }>
  /** The `FieldError` `id`, from `controlId`. */
  errorId: string
  /** The control `aria-describedby`: the error, only when invalid. */
  describedBy: string | undefined
}

/**
 * `name` prefix of a form opened on top of another (the "Novo registro em <tabela>" sheet).
 *
 * It once kept the `id` of the stacked form apart from the one behind; the `id` now comes from
 * `useId()` (`controlId`), unique per instance, and the prefix only reaches the `name`. The main
 * form has none.
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
  const reactId = React.useId()

  const result = buildFromReactHookForm<TValue>(context)
  // Only `name` changes: the binding (value, onChange, ref) stays the
  // `Controller` one, and `name` serves the fields for `name`.
  let field = result.field
  if (prefix) field = { ...field, name: prefix.concat(field.name) }
  const controlId = `${reactId}-${field.name}`

  const { 'aria-describedby': describedBy } = invalidProps(
    result.isInvalid,
    controlId,
  )

  return {
    ...result,
    field,
    controlId,
    errorId: errorId(controlId),
    describedBy,
  }
}

function buildFromReactHookForm<TValue>(
  context: FieldContextValue<TValue>,
): Omit<
  UseFieldValidationResult<TValue>,
  'controlId' | 'errorId' | 'describedBy'
> {
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
