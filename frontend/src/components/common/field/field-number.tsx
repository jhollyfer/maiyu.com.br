import { NumberField } from '@base-ui/react/number-field'

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '#/components/ui/field'
import { InputGroup, InputGroupInput } from '#/components/ui/input-group'
import { useFieldValidation } from '#/integrations/react-hook-form/use-field-validation'

import { FieldRequiredMark } from './field-required-mark'

type FieldNumberProps = {
  readonly label: string
  readonly placeholder?: string
  readonly description?: React.ReactNode
  readonly disabled?: boolean
  readonly required?: boolean
  readonly min?: number
  readonly max?: number
  readonly step?: number
  /** Goes straight to the Base UI `format` (`Intl.NumberFormatOptions`). */
  readonly format?: Intl.NumberFormatOptions
  /** Without it Base UI reads the runtime locale; the server and the browser may differ. */
  readonly locale?: Intl.LocalesArgument
}

/**
 * A number bound to `AppField`: the form keeps `number | null`, never the text.
 *
 * Base UI `NumberField` because shadcn has no pair and `<input type="number">`
 * hands a string and takes `e` and `+` (`_doc-lib/base-ui.md#react/components/number-field`,
 * https://base-ui.com/react/components/number-field). The input is the shadcn
 * `InputGroupInput` through `render`, so it keeps the kit look.
 */
export function FieldNumber({
  label,
  placeholder,
  description,
  disabled,
  required,
  min,
  max,
  step,
  format,
  locale,
}: FieldNumberProps): React.JSX.Element {
  const { field, isInvalid, errors, errorId, describedBy } = useFieldValidation<
    number | null
  >('FieldNumber')
  const { ref: fieldRef } = field

  return (
    <Field data-slot="field-number" data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && <FieldRequiredMark />}
      </FieldLabel>
      <NumberField.Root
        render={<InputGroup />}
        id={field.name}
        name={field.name}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        format={format}
        locale={locale}
        // RHF default values come as `undefined` before the first edit; Base UI
        // would treat it as uncontrolled.
        value={field.value ?? null}
        onValueChange={(next) => field.onChange(next)}
      >
        <NumberField.Input
          render={<InputGroupInput />}
          ref={fieldRef}
          placeholder={placeholder}
          onBlur={field.onBlur}
          aria-invalid={isInvalid}
          aria-required={required || undefined}
          aria-describedby={describedBy}
        />
      </NumberField.Root>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError id={errorId} errors={errors} />}
    </Field>
  )
}
