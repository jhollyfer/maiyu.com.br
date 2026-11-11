import {
  OptionCombobox,
  OptionComboboxDot,
  OptionComboboxIcon,
  OptionComboboxInput,
  OptionComboboxList,
} from '#/components/common/option-combobox/option-combobox'
import type { OptionComboboxItem } from '#/components/common/option-combobox/option-combobox-context'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '#/components/ui/field'
import { useFieldValidation } from '#/integrations/react-hook-form/use-field-validation'

import { FieldRequiredMark } from './field-required-mark'

type FieldComboboxProps = {
  readonly label: string
  /** The closed list, already as `{ value, label }` (`toOptions` for an enum). */
  readonly options: ReadonlyArray<OptionComboboxItem>
  readonly placeholder?: string
  /** The text of the empty search; defaults to the kit message. */
  readonly empty?: string
  readonly description?: React.ReactNode
  readonly disabled?: boolean
  readonly required?: boolean
  /** Icon before the value; without it the chosen option's dot, when it has one. */
  readonly icon?: React.ReactNode
  readonly onValueChange?: (value: string) => void
  /** `data-slot`; the `data-testid` is `<slot>-input`. */
  readonly slot?: string
  /**
   * The input's own `data-testid`, for a screen whose e2e already names it;
   * given, the wrapper carries none (one element per id).
   */
  readonly testId?: string
}

/**
 * `OptionCombobox` bound to `AppField`: label, search field, list and error.
 *
 * `onBlur` goes on the input and not on the root, because `mode: 'onTouched'`
 * only marks the field touched from the focusable element; the `ref` goes there
 * too, so the invalid submit focuses it (`_doc-lib/react-hook-form.md`).
 *
 * The × that clears follows `required`: an optional field can go back to empty,
 * a required one cannot, so there is no separate flag to keep in sync.
 */
export function FieldCombobox({
  label,
  options,
  placeholder,
  empty,
  description,
  disabled,
  required,
  icon,
  onValueChange,
  slot = 'field-combobox',
  testId,
}: FieldComboboxProps): React.JSX.Element {
  const { field, isInvalid, errors, errorId, describedBy } = useFieldValidation<
    string | null
  >('FieldCombobox')
  const { ref: fieldRef } = field
  let wrapperTestId: string | undefined = `${slot}-input`
  if (testId) wrapperTestId = undefined

  let leading = <OptionComboboxDot />
  if (icon) leading = <OptionComboboxIcon>{icon}</OptionComboboxIcon>

  return (
    <Field
      data-slot={slot}
      data-testid={wrapperTestId}
      data-invalid={isInvalid}
    >
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && <FieldRequiredMark />}
      </FieldLabel>
      <OptionCombobox
        options={options}
        value={field.value}
        disabled={disabled}
        onValueChange={(value) => {
          field.onChange(value)
          onValueChange?.(value)
        }}
      >
        <OptionComboboxInput
          data-testid={testId ?? `${slot}-input`}
          ref={fieldRef}
          id={field.name}
          name={field.name}
          placeholder={placeholder}
          showClear={!required}
          onBlur={field.onBlur}
          aria-invalid={isInvalid}
          aria-required={required || undefined}
          aria-describedby={describedBy}
        >
          {leading}
        </OptionComboboxInput>
        <OptionComboboxList empty={empty} />
      </OptionCombobox>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError id={errorId} errors={errors} />}
    </Field>
  )
}
