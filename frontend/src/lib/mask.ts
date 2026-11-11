import type { Options } from 'use-mask-input'

/**
 * Os aliases que o kit aceita em `FieldMask` (`components/common/field/field-mask.tsx`).
 *
 * Lista fechada, e só de alias do motor: `use-mask-input@3.14` traz `cpf`, `cnpj`,
 * `phone-br`, `cep` e `brl-currency` prontos, inclusive o CNPJ alfanumérico
 * (`_doc-lib/use-mask-input.md#tutorial-basics/alias-mask`). Máscara estática escrita
 * à mão é desvio: o alias acerta os tamanhos variáveis e a régua de cursor que a
 * string fixa erra. Campo novo que precisa de outro formato entra aqui, no upstream.
 */
export const MASK_ALIASES = [
  'cpf',
  'cnpj',
  'phone-br',
  'cep',
  'brl-currency',
] as const

export type MaskAlias = (typeof MASK_ALIASES)[number]

/**
 * A máscara sem o molde à mostra.
 *
 * *Por quê:* o Inputmask mostra o molde inteiro ao focar e ao passar o mouse, e
 * preenche o que falta com `_`. Na tela de cadastro o aluno via
 * `33_.___.___-__`, que parece campo quebrado. Com `jitMasking` a pontuação só
 * entra quando o dígito seguinte chega (`33` → `333.1`), sem `_` nem traço
 * adiantado, e o `placeholder` do próprio `<input>` continua sendo o exemplo do
 * formato. As opções são as do motor (`_doc-lib/use-mask-input.md#api-reference`:
 * o tipo `Options` é o do Inputmask, https://robinherbots.github.io/Inputmask/).
 *
 * Constante de módulo, e não objeto por render: a biblioteca reaplica a
 * máscara quando a identidade das opções muda, e limparia o campo a cada tecla.
 *
 * Base: `academy/frontend/src/lib/mask.ts`.
 */
export const QUIET_MASK = {
  jitMasking: true,
  placeholder: '',
  showMaskOnHover: false,
  showMaskOnFocus: false,
} as const satisfies Options
