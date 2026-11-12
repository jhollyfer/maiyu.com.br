import {
  AccountProfileUpdateValidator,
  z,
  type AccountProfileUpdatePayload,
} from '@maiyu/shared'

/** O que a pessoa digita: todo campo é texto, e o que ficou em branco é "não mexer". */
export type AccountProfileFormValues = {
  name: string
  phone: string
  password: string
  passwordConfirmation: string
  currentPassword: string
}

/**
 * O formulário de perfil sobre o validator do backend (`AccountProfileUpdateValidator`), que tem
 * todo campo opcional e trata `''` como ausente. A tela guarda texto em todos os campos (um input
 * sem valor vira não controlado), então este par traduz os dois lados: `of` monta o corpo e deixa
 * de fora o que está em branco, e `Validator` roda a regra única do `shared/` sobre esse corpo e
 * devolve cada erro no campo de mesmo nome, sem uma segunda cópia da regra de senha ou de celular.
 */
export class AccountProfilePayload {
  /**
   * O nome e a senha atual vão sempre: o validator exige a senha atual para qualquer mudança e o
   * nome em branco é o erro "obrigatório". Celular e senha nova só quando preenchidos; a senha nova
   * leva a confirmação junto, que o validator compara.
   */
  static of(values: AccountProfileFormValues): AccountProfileUpdatePayload {
    const payload: AccountProfileUpdatePayload = {
      name: values.name,
      currentPassword: values.currentPassword,
    }

    if (values.phone !== '') payload.phone = values.phone
    if (values.password !== '') {
      payload.password = values.password
      payload.passwordConfirmation = values.passwordConfirmation
    }

    return payload
  }

  /** Para o `zodResolver` do `useMutationForm`: entrada e saída são o texto dos campos. */
  static readonly Validator = z
    .object({
      name: z.string(),
      phone: z.string(),
      password: z.string(),
      passwordConfirmation: z.string(),
      currentPassword: z.string(),
    })
    .superRefine((values, context) => {
      const parsed = AccountProfileUpdateValidator.safeParse(
        AccountProfilePayload.of(values),
      )
      if (parsed.success) return

      for (const issue of parsed.error.issues) {
        context.addIssue({
          code: 'custom',
          path: issue.path,
          message: issue.message,
        })
      }
    })
}
