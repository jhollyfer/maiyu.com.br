import { useMaskInput } from 'use-mask-input'

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '#/components/ui/field'
import { InputGroup, InputGroupInput } from '#/components/ui/input-group'
import { useFieldValidation } from '#/integrations/react-hook-form/use-field-validation'
import { QUIET_MASK } from '#/lib/mask'
import type { MaskAlias } from '#/lib/mask'

import { FieldRequiredMark } from './field-required-mark'

/**
 * O teclado de cada alias no celular. O CNPJ é alfanumérico desde julho/2026, então
 * pede o teclado de texto; os outros são só dígitos.
 */
const INPUT_MODE = {
  cpf: 'numeric',
  cnpj: 'text',
  'phone-br': 'tel',
  cep: 'numeric',
  'brl-currency': 'decimal',
} as const satisfies Record<
  MaskAlias,
  React.HTMLAttributes<HTMLInputElement>['inputMode']
>

type FieldMaskProps = {
  readonly label: string
  /** Um alias do kit (`lib/mask.ts`); máscara escrita à mão não entra. */
  readonly mask: MaskAlias
  /** O exemplo do formato: `000.000.000-00`. O `QUIET_MASK` não mostra o molde. */
  readonly placeholder?: string
  readonly description?: React.ReactNode
  readonly disabled?: boolean
  readonly required?: boolean
  readonly autoComplete?: string
}

/**
 * Campo mascarado sob `AppField` ([DECISÃO MÁSCARA a], `KIT.md` §2.1).
 *
 * `useMaskInput` recebe o `ref` do `Controller` em `register`: a página oficial diz
 * que o callback "receives the resolved DOM element (useful for third-party form
 * libraries)" (`_doc-lib/use-mask-input.md#api-reference`,
 * https://use-mask-input.eduardoborges.dev/api-reference). É esse `ref` que deixa o
 * `handleSubmit` focar o campo inválido. O formulário guarda o valor **cru**: o
 * `onChange` lê `unmaskedValue()` do próprio ref, nunca `event.target.value`, que
 * chega mascarado.
 *
 * O input não é controlado: o Inputmask escreve no DOM a cada tecla, e um `value`
 * do React brigaria com ele pelo cursor.
 *
 * shortcut: `reset()` do formulário não reescreve o texto já digitado, porque o
 * input não é controlado; trocar por `field.value` + `formatWithMask` quando um
 * formulário com máscara precisar de reset sem remontar.
 */
export function FieldMask({
  label,
  mask,
  placeholder,
  description,
  disabled,
  required,
  autoComplete,
}: FieldMaskProps): React.JSX.Element {
  const { field, isInvalid, errors, errorId, describedBy } = useFieldValidation<
    string | null
  >('FieldMask')
  const maskRef = useMaskInput({
    mask,
    register: field.ref,
    options: QUIET_MASK,
  })

  return (
    <Field data-slot="field-mask" data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && <FieldRequiredMark />}
      </FieldLabel>
      <InputGroup>
        <InputGroupInput
          ref={maskRef}
          disabled={disabled}
          id={field.name}
          name={field.name}
          inputMode={INPUT_MODE[mask]}
          placeholder={placeholder}
          autoComplete={autoComplete}
          defaultValue={field.value ?? ''}
          onBlur={field.onBlur}
          onChange={() => {
            field.onChange(maskRef.unmaskedValue())
          }}
          aria-invalid={isInvalid}
          aria-required={required || undefined}
          aria-describedby={describedBy}
        />
      </InputGroup>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError id={errorId} errors={errors} />}
    </Field>
  )
}
