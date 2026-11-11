import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '#/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { useFieldValidation } from '#/integrations/react-hook-form/use-field-validation'

import { FieldRequiredMark } from './field-required-mark'

/**
 * One option, declared once: Base UI reads the list from the Root `items`
 * to print the label (not the raw value) in `SelectValue`.
 */
export type FieldSelectItem = {
  readonly value: string
  readonly label: React.ReactNode
}

type FieldSelectProps = {
  /** The caller `data-slot` and `data-testid`: each select keeps its own. */
  readonly slot: string
  readonly label: string
  readonly description?: React.ReactNode
  readonly placeholder: string
  readonly disabled?: boolean
  readonly required?: boolean
  readonly items: ReadonlyArray<FieldSelectItem>
  /** Marks the field as touched on pick (validates right away, `mode: onTouched`). */
  readonly touchOnChange?: boolean
  readonly onValueChange?: (value: string) => void
  /**
   * The trigger's own `data-testid`, for a screen whose e2e already names
   * it; given, the wrapper carries none (one element per id).
   */
  readonly testId?: string
  /** Icon at the start of the trigger. */
  readonly icon?: React.ReactNode
  readonly triggerClassName?: string
  /** How the form keeps the choice: the item's `text` or as a `number`. */
  readonly valueType?: 'text' | 'number'
}

/**
 * The select bound to `AppField`: label, `Select` with the list
 * and the error. It was the same body in each `table-config/` select, changing only the
 * options list.
 */
export function FieldSelect({
  slot,
  label,
  description,
  placeholder,
  disabled,
  required,
  items,
  touchOnChange,
  onValueChange,
  testId,
  icon,
  triggerClassName,
  valueType = 'text',
}: FieldSelectProps): React.JSX.Element {
  const { field, isInvalid, errors } = useFieldValidation<string | number>(slot)
  // The `Select` works with text; a number field keeps the number the
  // contract takes.
  const selected = String(field.value)
  let wrapperTestId: string | undefined = slot
  if (testId) wrapperTestId = undefined

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
      {description && <FieldDescription>{description}</FieldDescription>}
      <Select
        items={items}
        disabled={disabled}
        value={selected}
        onValueChange={(value) => {
          // Base UI reports `null` when the value matches no item; the
          // field keeps its last pick instead of storing an empty choice.
          if (value === null) return
          if (valueType === 'number') field.onChange(Number(value))
          else field.onChange(value)
          if (touchOnChange) field.onBlur()
          onValueChange?.(value)
        }}
      >
        <SelectTrigger
          data-testid={testId}
          aria-required={required || undefined}
          id={field.name}
          className={triggerClassName}
        >
          {icon}
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  )
}
