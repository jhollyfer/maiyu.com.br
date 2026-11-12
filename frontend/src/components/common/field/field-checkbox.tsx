import { Checkbox } from '#/components/ui/checkbox'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '#/components/ui/field'
import { useFieldValidation } from '#/integrations/react-hook-form/use-field-validation'

import { FieldRequiredMark } from './field-required-mark'

type FieldCheckboxProps = {
  readonly label: string
  readonly description?: React.ReactNode
  readonly disabled?: boolean
  readonly required?: boolean
}

/**
 * A boolean bound to `AppField`, for a choice that only counts on save (the
 * switch is for an effect that applies at once, `_doc-lib/shadcn.md#switch`).
 *
 * `nativeButton` with a `<button>`: with a sibling label (`htmlFor`/`id`) the
 * page tells to render the checkbox as a native button, so the `id` and the
 * accessible name land on the focusable element and the `ref` focuses it
 * (`_doc-lib/base-ui.md#react/components/checkbox`,
 * https://base-ui.com/react/components/checkbox).
 */
export function FieldCheckbox({
  label,
  description,
  disabled,
  required,
}: FieldCheckboxProps): React.JSX.Element {
  const { field, isInvalid, errors, errorId, describedBy } =
    useFieldValidation<boolean>('FieldCheckbox')
  const { ref: fieldRef } = field

  return (
    <Field
      data-slot="field-checkbox"
      data-invalid={isInvalid}
      orientation="horizontal"
    >
      <Checkbox
        nativeButton
        render={<button type="button" />}
        ref={fieldRef}
        id={field.name}
        name={field.name}
        disabled={disabled}
        // RHF default values come as `undefined` before the first edit.
        checked={field.value ?? false}
        onCheckedChange={(checked) => field.onChange(checked)}
        onBlur={field.onBlur}
        aria-invalid={isInvalid}
        aria-required={required || undefined}
        aria-describedby={describedBy}
      />
      <FieldContent>
        <FieldLabel htmlFor={field.name}>
          {label}
          {required && <FieldRequiredMark />}
        </FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
        {isInvalid && <FieldError id={errorId} errors={errors} />}
      </FieldContent>
    </Field>
  )
}
