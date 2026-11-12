import { Field, FieldError, FieldLabel } from '#/components/ui/field'
import { Textarea } from '#/components/ui/textarea'
import { useFieldValidation } from '#/integrations/react-hook-form/use-field-validation'

import { FieldRequiredMark } from './field-required-mark'

type FieldTextareaProps = {
  readonly label: string
  readonly placeholder?: string
  readonly disabled?: boolean
  readonly rows?: number
  readonly required?: boolean
  /**
   * The textarea's own `data-testid`, for a screen whose e2e already names
   * it; given, the wrapper carries none (one element per id).
   */
  readonly testId?: string
  readonly className?: string
}

export function FieldTextarea({
  label,
  placeholder,
  disabled,
  rows = 3,
  required,
  testId,
  className,
}: FieldTextareaProps): React.JSX.Element {
  const { field, isInvalid, errors, errorId, describedBy } = useFieldValidation<
    string | null
  >('FieldTextarea')
  const { ref: inputRef } = field
  let wrapperTestId: string | undefined = 'field-textarea'
  if (testId) wrapperTestId = undefined
  return (
    <Field
      data-slot="field-textarea"
      data-testid={wrapperTestId}
      data-invalid={isInvalid}
    >
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && <FieldRequiredMark />}
      </FieldLabel>
      <Textarea
        data-testid={testId ?? 'field-textarea'}
        ref={inputRef}
        className={className}
        disabled={disabled}
        id={field.name}
        name={field.name}
        placeholder={placeholder}
        value={field.value ?? ''}
        onBlur={field.onBlur}
        onChange={(e) => field.onChange(e.target.value)}
        aria-invalid={isInvalid}
        aria-required={required || undefined}
        aria-describedby={describedBy}
        rows={rows}
      />
      {isInvalid && <FieldError id={errorId} errors={errors} />}
    </Field>
  )
}
