import type * as React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { vineResolver } from '@hookform/resolvers/vine'
import { toast } from 'sonner'

import { FIELD, LABEL } from './form-style'
import { PillButton } from './pill-button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { errorId, invalidProps } from '#/lib/form-a11y'
import { cn } from '#/lib/utils'
import { ContactCreateValidator } from '#/lib/validator'
import type { ContactCreatePayload } from '#/lib/validator'
import { m } from '#/paraglide/messages'

/**
 * O formulário da página de contato.
 *
 * O padrão de formulário do academy inteiro: `Controller` e não `register`,
 * porque o `Input` do Base UI não repassa `ref`; `mode: 'onTouched'`, que só
 * acusa o campo depois que a pessoa sai dele; `invalidProps` e `FieldError`
 * com `id`, que ligam o erro ao campo para o leitor de tela; e `method="post"`,
 * que impede o navegador de pôr a mensagem na URL se o envio acontecer antes
 * da hidratação.
 *
 * **Não envia nada**, e é o comportamento do site no ar: não há backend, e a
 * confirmação na tela é o que o site antigo fazia. O contato de verdade segue
 * pelos cartões ao lado, por e-mail e WhatsApp. Quando houver endpoint, ele
 * entra em `submit` com a mutation e o `applyMutationError` do academy.
 */
export function ContactForm(): React.JSX.Element {
  const form = useForm<ContactCreatePayload>({
    resolver: vineResolver(ContactCreateValidator),
    mode: 'onTouched',
    defaultValues: { firstName: '', lastName: '', email: '', message: '' },
  })

  function submit(): void {
    // `id` fixo: dois envios seguidos trocam o aviso em vez de empilhar dois.
    toast.success(m.contactPage_successMessage(), { id: 'contact' })
    form.reset()
  }

  return (
    <form
      data-slot="contact-form"
      method="post"
      noValidate
      onSubmit={form.handleSubmit(submit)}
    >
      <FieldGroup className="gap-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Controller
            control={form.control}
            name="firstName"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="firstName" className={LABEL}>
                  {m.contactPage_firstName()}
                </FieldLabel>
                <Input
                  {...field}
                  id="firstName"
                  autoComplete="given-name"
                  className={FIELD}
                  placeholder={m.contactPage_firstNamePlaceholder()}
                  {...invalidProps(fieldState.invalid, 'firstName')}
                />
                {fieldState.error && (
                  <FieldError id={errorId('firstName')}>
                    {fieldState.error.message}
                  </FieldError>
                )}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="lastName"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="lastName" className={LABEL}>
                  {m.contactPage_lastName()}
                </FieldLabel>
                <Input
                  {...field}
                  id="lastName"
                  autoComplete="family-name"
                  className={FIELD}
                  placeholder={m.contactPage_lastNamePlaceholder()}
                  {...invalidProps(fieldState.invalid, 'lastName')}
                />
                {fieldState.error && (
                  <FieldError id={errorId('lastName')}>
                    {fieldState.error.message}
                  </FieldError>
                )}
              </Field>
            )}
          />
        </div>

        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="email" className={LABEL}>
                {m.contactPage_emailLabel()}
              </FieldLabel>
              <Input
                {...field}
                id="email"
                type="email"
                autoComplete="email"
                className={FIELD}
                placeholder={m.contactPage_emailPlaceholder()}
                {...invalidProps(fieldState.invalid, 'email')}
              />
              {fieldState.error && (
                <FieldError id={errorId('email')}>
                  {fieldState.error.message}
                </FieldError>
              )}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="message"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="message" className={LABEL}>
                {m.contactPage_messageLabel()}
              </FieldLabel>
              <Textarea
                {...field}
                id="message"
                rows={6}
                className={cn(FIELD, 'h-auto resize-none py-3')}
                placeholder={m.contactPage_messagePlaceholder()}
                {...invalidProps(fieldState.invalid, 'message')}
              />
              {fieldState.error && (
                <FieldError id={errorId('message')}>
                  {fieldState.error.message}
                </FieldError>
              )}
            </Field>
          )}
        />

        <div className="pt-4">
          <PillButton
            type="submit"
            className="px-7"
            disabled={form.formState.isSubmitting}
          >
            {m.contactPage_sendButton()}
          </PillButton>
        </div>
      </FieldGroup>
    </form>
  )
}
