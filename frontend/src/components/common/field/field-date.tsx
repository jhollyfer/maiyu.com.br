import { DatePicker } from '#/components/common/date-picker/date-picker'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '#/components/ui/field'
import { useFieldValidation } from '#/integrations/react-hook-form/use-field-validation'

import { FieldRequiredMark } from './field-required-mark'

type FieldDateProps = {
  readonly label: string
  readonly placeholder?: string
  readonly description?: React.ReactNode
  readonly disabled?: boolean
  readonly required?: boolean
  readonly onValueChange?: (value: string) => void
  /** `data-slot`; the `data-testid` is `<slot>-input`. */
  readonly slot?: string
}

/**
 * `DatePicker` bound to `AppField`: label, calendar trigger and error.
 *
 * The form keeps the `YYYY-MM-DD` string the API exchanges, never a `Date`:
 * the conversion lives in `DatePicker` (Luxon, local zone), so a calendar day
 * does not drift across time zones here either.
 */
export function FieldDate({
  label,
  placeholder,
  description,
  disabled,
  required,
  onValueChange,
  slot = 'field-date',
}: FieldDateProps): React.JSX.Element {
  const { field, isInvalid, errors, errorId, describedBy } = useFieldValidation<
    string | null
  >('FieldDate')
  const { ref: fieldRef } = field
  return (
    <Field
      data-slot={slot}
      data-testid={`${slot}-input`}
      data-invalid={isInvalid}
    >
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && <FieldRequiredMark />}
      </FieldLabel>
      <DatePicker
        ref={fieldRef}
        id={field.name}
        value={field.value}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={isInvalid}
        aria-describedby={describedBy}
        onBlur={field.onBlur}
        onValueChange={(value) => {
          field.onChange(value)
          // A pick closes the popover without a blur on the trigger, so
          // `mode: 'onTouched'` would only validate on the next focus change.
          field.onBlur()
          onValueChange?.(value)
        }}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError id={errorId} errors={errors} />}
    </Field>
  )
}
