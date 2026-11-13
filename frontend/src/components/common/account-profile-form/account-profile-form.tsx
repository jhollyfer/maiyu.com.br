import { useRouter } from '@tanstack/react-router'
import type * as React from 'react'
import { toast } from 'sonner'

import { FieldPassword } from '#/components/common/field/field-password'
import { FieldText } from '#/components/common/field/field-text'
import { PlainForm } from '#/components/common/plain-form/plain-form'
import { SubmitButton } from '#/components/common/submit-button/submit-button'
import { Alert, AlertDescription } from '#/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { FieldDescription, FieldGroup } from '#/components/ui/field'
import { useMutationForm } from '#/hooks/use-mutation-form'
import { AppField } from '#/integrations/react-hook-form/app-field'
import { useAccountProfileUpdateMutation } from '#/integrations/tanstack-query/mutations/account'
import { m } from '#/paraglide/messages'
import type {
  AccountProfileShowResponse,
  AccountProfileUpdatePayload,
  AccountProfileUpdateResponse,
} from '@maiyu/shared'

import { AccountProfilePayload } from './account-profile-payload'
import type { AccountProfileFormValues } from './account-profile-payload'

/** Os campos que o formulário sabe marcar; o resto do `errors` vira a mensagem do formulário. */
const FIELDS = [
  'name',
  'phone',
  'password',
  'passwordConfirmation',
  'currentPassword',
] as const

type AccountProfileFormProps = Readonly<{
  /** A conta da sessão: o `context.account` do `_private`. */
  account: AccountProfileShowResponse
}>

/**
 * O perfil da própria conta (`PUT /account/profile`, DECISIONS.md #413): nome, celular e senha, tudo
 * confirmado com a senha atual. O e-mail aparece mas não se edita aqui (a troca de e-mail é um
 * pedido confirmado por código, bloco `mail`, e a foto é do projeto, que tem o upload dele).
 *
 * `values` e não `defaultValues`: quando a conta muda, o formulário volta ao que o servidor tem e a
 * senha digitada sai do campo. Depois de salvar ele invalida o router, e a guarda do `_private` lê a
 * conta de novo: trocar senha ou celular derruba as sessões (a leitura devolve 401 e a guarda leva à
 * entrada, com um aviso), trocar só o nome atualiza o menu.
 */
export function AccountProfileForm({
  account,
}: AccountProfileFormProps): React.JSX.Element {
  const router = useRouter()

  const { form, mutation, onSubmit } = useMutationForm<
    AccountProfileFormValues,
    AccountProfileUpdateResponse,
    AccountProfileUpdatePayload
  >({
    validator: AccountProfilePayload.Validator,
    values: {
      name: account.name,
      phone: account.phone ?? '',
      password: '',
      passwordConfirmation: '',
      currentPassword: '',
    },
    fields: FIELDS,
    mutation: useAccountProfileUpdateMutation,
    success: m.kit_profile_saved(),
    payload: (values) => AccountProfilePayload.of(values),
    async onSuccess(_profile, sent) {
      // Senha ou celular novos derrubam as sessões (o corpo só leva o celular quando preenchido).
      const phoneChanged =
        sent.phone !== undefined && sent.phone !== account.phone
      if (sent.password !== undefined || phoneChanged)
        toast.info(m.kit_profile_sign_in_again())

      await router.invalidate()
    },
  })

  const message = form.formState.errors.root?.message

  return (
    <PlainForm
      data-slot="account-profile-form"
      onSubmit={onSubmit}
      className="mx-auto w-full max-w-xl"
    >
      <Card>
        <CardContent>
          <FieldGroup>
            <AppField control={form.control} name="name">
              <FieldText
                label={m.kit_profile_name()}
                autoComplete="name"
                slot="profile-name"
                required
              />
            </AppField>
            <AppField control={form.control} name="phone">
              <FieldText
                label={m.kit_profile_phone()}
                autoComplete="tel"
                slot="profile-phone"
              />
            </AppField>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{m.kit_profile_password_section()}</CardTitle>
          <CardDescription>{m.kit_profile_new_password_hint()}</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <AppField control={form.control} name="password">
              <FieldPassword
                label={m.kit_profile_new_password()}
                autoComplete="new-password"
              />
            </AppField>
            <AppField control={form.control} name="passwordConfirmation">
              <FieldPassword
                label={m.kit_profile_password_confirmation()}
                autoComplete="new-password"
              />
            </AppField>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <FieldGroup>
            <AppField control={form.control} name="currentPassword">
              <FieldPassword
                label={m.kit_profile_current_password()}
                autoComplete="current-password"
                required
              />
            </AppField>
            <FieldDescription>
              {m.kit_profile_current_password_hint()}
            </FieldDescription>
            {message && (
              <Alert variant="destructive">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            <SubmitButton isPending={mutation.isPending}>
              {m.kit_save()}
            </SubmitButton>
          </FieldGroup>
        </CardContent>
      </Card>
    </PlainForm>
  )
}
