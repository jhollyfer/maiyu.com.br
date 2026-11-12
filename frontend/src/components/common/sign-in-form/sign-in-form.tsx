import { useRouter } from '@tanstack/react-router'
import type * as React from 'react'

import { FieldPassword } from '#/components/common/field/field-password'
import { FieldText } from '#/components/common/field/field-text'
import { PlainForm } from '#/components/common/plain-form/plain-form'
import { SubmitButton } from '#/components/common/submit-button/submit-button'
import { Alert, AlertDescription } from '#/components/ui/alert'
import { FieldGroup } from '#/components/ui/field'
import { useMutationForm } from '#/hooks/use-mutation-form'
import { AppField } from '#/integrations/react-hook-form/app-field'
import { HTTPErrorCode, HTTPStatus } from '#/integrations/tanstack-query/http'
import { useSignIn } from '#/integrations/tanstack-query/mutations/account'
import { m } from '#/paraglide/messages'
import {
  AuthenticationSessionSignInValidator,
  type AuthenticationSessionSignInPayload,
} from '@maiyu/shared'

/**
 * Os campos que o formulário sabe marcar. Chave de `errors` fora desta lista não some: vira a mensagem
 * do formulário (`applyHTTPErrorToForm`).
 */
const FIELDS = ['login', 'password'] as const

/**
 * O formulário de entrada do kit: um campo para e-mail ou celular (`LoginIdentity`) e a senha,
 * validados pelo mesmo validator do backend. Credencial errada (`401 INVALID_CREDENTIALS`) e limite
 * de tentativas (`429`) mostram a mensagem do kit, na língua da tela, sem dizer qual dos dois campos
 * falhou; o resto cai na mensagem do formulário.
 *
 * Depois de entrar ele **não decide para onde ir**: invalida o router, e a guarda inversa do layout
 * `_authentication` (`SessionGuard.leaveIfSignedIn`) lê a conta e leva ao `?redirect=` validado ou a
 * `homeOf`. O destino mora num lugar só. O formulário vai dentro do `AuthShellContent` da tela.
 */
export function SignInForm(): React.JSX.Element {
  const router = useRouter()

  const { form, mutation, onSubmit } = useMutationForm<
    AuthenticationSessionSignInPayload,
    void,
    AuthenticationSessionSignInPayload
  >({
    validator: AuthenticationSessionSignInValidator,
    // Sem isto os campos nascem `undefined` e o input monta sem controle.
    defaults: { login: '', password: '' },
    fields: FIELDS,
    mutation: useSignIn,
    payload: (values) => values,
    onSuccess: () => router.invalidate(),
  })

  let message = form.formState.errors.root?.message
  if (mutation.error?.code === HTTPErrorCode.INVALID_CREDENTIALS)
    message = m.kit_sign_in_invalid_credentials()
  if (mutation.error?.status === HTTPStatus.TOO_MANY_REQUESTS)
    message = m.kit_sign_in_too_many_attempts()

  return (
    <PlainForm data-slot="sign-in-form" onSubmit={onSubmit}>
      <FieldGroup>
        <AppField control={form.control} name="login">
          <FieldText
            label={m.kit_sign_in_login()}
            autoComplete="username"
            slot="sign-in-login"
          />
        </AppField>
        <AppField control={form.control} name="password">
          <FieldPassword
            label={m.kit_sign_in_password()}
            autoComplete="current-password"
          />
        </AppField>
        {message && (
          <Alert variant="destructive" data-testid="sign-in-error">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        <SubmitButton isPending={mutation.isPending} className="w-full">
          {m.kit_sign_in_submit()}
        </SubmitButton>
      </FieldGroup>
    </PlainForm>
  )
}
