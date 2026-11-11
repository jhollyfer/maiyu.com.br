import type * as React from 'react'
import { Controller } from 'react-hook-form'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'

import { FieldContext } from './app-field-context'

type AppFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = {
  readonly name: TName
  readonly control: Control<TFieldValues>
  readonly children: React.ReactNode
}

/**
 * Binds a field component to the form.
 *
 * It is a react-hook-form `Controller` that publishes `field`/`fieldState` in a
 * context, so the field component does not need to receive both as props on
 * every use. Fields are bound through `Controller`, never through `register`: the
 * components come from Base UI and work with `value`/`onValueChange`, not with a
 * native input `ref`.
 */
export function AppField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  name,
  control,
  children,
}: AppFieldProps<TFieldValues, TName>): React.JSX.Element {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FieldContext.Provider value={{ field, fieldState }}>
          {children}
        </FieldContext.Provider>
      )}
    />
  )
}
