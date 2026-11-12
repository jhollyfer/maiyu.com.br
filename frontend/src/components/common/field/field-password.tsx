import React from 'react'

import { Field, FieldError, FieldLabel } from '#/components/ui/field'
import { useFieldValidation } from '#/integrations/react-hook-form/use-field-validation'
import { m } from '#/paraglide/messages'

import { FieldRequiredMark } from './field-required-mark'
import { SecretInput } from './secret-input'

type FieldPasswordProps = {
  readonly label: string
  /**
   * Which password the field holds, for the browser's password manager.
   * Required on purpose: without it the manager fills the signed-in user's
   * saved password into any password field -- the new user's password on
   * `/users/new`, and "new" and "confirm" on `/profile` -- and the admin saves
   * an account that silently carries their own credential.
   */
  readonly autoComplete: 'current-password' | 'new-password'
  readonly placeholder?: string
  readonly disabled?: boolean
  readonly required?: boolean
}

export function FieldPassword({
  label,
  autoComplete,
  placeholder,
  disabled,
  required,
}: FieldPasswordProps): React.JSX.Element {
  const { field, isInvalid, errors, errorId, describedBy } =
    useFieldValidation<string>('FieldPassword')
  return (
    <Field
      data-slot="field-password"
      data-testid="field-password-input"
      data-invalid={isInvalid}
    >
      <FieldLabel htmlFor={field.name}>
        {label} {required && <FieldRequiredMark />}
      </FieldLabel>
      <SecretInput
        data-testid="field-password-input"
        toggleLabel={() => m.kit_toggle_password()}
        toggleTestId="field-password-toggle-btn"
        disabled={disabled}
        id={field.name}
        name={field.name}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={field.value}
        onBlur={field.onBlur}
        onChange={(e) => field.onChange(e.target.value)}
        aria-invalid={isInvalid}
        aria-required={required || undefined}
        aria-describedby={describedBy}
      />
      {isInvalid && <FieldError id={errorId} errors={errors} />}
    </Field>
  )
}
