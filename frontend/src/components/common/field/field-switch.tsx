import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '#/components/ui/field'
import { Switch } from '#/components/ui/switch'
import { useFieldValidation } from '#/integrations/react-hook-form/use-field-validation'

import { FieldRequiredMark } from './field-required-mark'

type FieldSwitchProps = {
  readonly label: string
  readonly description?: React.ReactNode
  readonly disabled?: boolean
  readonly required?: boolean
}

/**
 * A boolean bound to `AppField`, for a setting that reads as on or off.
 *
 * `nativeButton` with a `<button>`: with a sibling label (`htmlFor`/`id`) the
 * page tells to render the switch as a native button, so the `id` and the
 * accessible name land on the focusable element and the `ref` focuses it
 * (`_doc-lib/base-ui.md#react/components/switch`,
 * https://base-ui.com/react/components/switch).
 */
export function FieldSwitch({
  label,
  description,
  disabled,
  required,
}: FieldSwitchProps): React.JSX.Element {
  const { field, isInvalid, errors, errorId, describedBy } =
    useFieldValidation<boolean>('FieldSwitch')
  const { ref: fieldRef } = field

  return (
    <Field
      data-slot="field-switch"
      data-invalid={isInvalid}
      orientation="horizontal"
    >
      <FieldContent>
        <FieldLabel htmlFor={field.name}>
          {label}
          {required && <FieldRequiredMark />}
        </FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
        {isInvalid && <FieldError id={errorId} errors={errors} />}
      </FieldContent>
      <Switch
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
    </Field>
  )
}
