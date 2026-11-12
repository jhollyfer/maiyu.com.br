import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '#/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '#/components/ui/input-group'
import { useFieldValidation } from '#/integrations/react-hook-form/use-field-validation'

import { FieldRequiredMark } from './field-required-mark'

type FieldTextProps = {
  readonly label: string
  readonly placeholder?: string
  readonly disabled?: boolean
  readonly icon?: React.ReactNode
  readonly required?: boolean
  readonly description?: React.ReactNode
  readonly onChangeTransform?: (value: string) => string
  /** `FieldEmail` and `FieldUrl` are this field with another `type` and icon. */
  readonly type?: 'text' | 'email' | 'url'
  /** `data-slot`; o `data-testid` e `<slot>-input`. */
  readonly slot?: string
  /**
   * The input's own `data-testid`, for a screen whose e2e already names it;
   * given, the wrapper carries none (one element per id).
   */
  readonly testId?: string
  readonly autoComplete?: string
}

export function FieldText({
  label,
  placeholder,
  disabled,
  icon,
  required,
  description,
  onChangeTransform,
  type = 'text',
  slot = 'field-text',
  testId,
  autoComplete,
}: FieldTextProps): React.JSX.Element {
  const { field, isInvalid, errors, errorId, describedBy } = useFieldValidation<
    string | null
  >('FieldText')
  let wrapperTestId: string | undefined = `${slot}-input`
  if (testId) wrapperTestId = undefined
  const { ref: inputRef } = field
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
      <InputGroup>
        <InputGroupInput
          data-testid={testId ?? `${slot}-input`}
          ref={inputRef}
          disabled={disabled}
          id={field.name}
          name={field.name}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          // The validator turns an empty text into `null`; the input stays
          // controlled with an empty string.
          value={field.value ?? ''}
          onBlur={field.onBlur}
          onChange={(e) => {
            const raw = e.target.value
            if (onChangeTransform) {
              field.onChange(onChangeTransform(raw))
              return
            }
            field.onChange(raw)
          }}
          aria-invalid={isInvalid}
          aria-required={required || undefined}
          aria-describedby={describedBy}
        />
        {icon && <InputGroupAddon>{icon}</InputGroupAddon>}
      </InputGroup>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError id={errorId} errors={errors} />}
    </Field>
  )
}
