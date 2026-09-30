import type * as React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { vineResolver } from '@hookform/resolvers/vine'
import { toast } from 'sonner'

import { FIELD, LABEL } from './form-style'
import { PillButton } from '#/components/common/pill-button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { errorId, invalidProps } from '#/lib/form-a11y'
import type { Merge } from '#/lib/interfaces'
import { JOB_POSITION_LABELS } from '#/lib/labels'
import { cn } from '#/lib/utils'
import {
  CareerApplicationCreateValidator,
  JOB_POSITIONS,
} from '#/lib/validator'
import type {
  CareerApplicationCreatePayload,
  JobPosition,
} from '#/lib/validator'
import { m } from '#/paraglide/messages'

/**
 * O que o formulário guarda enquanto a pessoa preenche, e que difere do que o
 * validator devolve: a vaga começa sem escolha (`null`, que é o que faz o
 * `Select` mostrar o texto de convite) e o link começa como texto vazio.
 *
 * Dois tipos, como na matrícula do academy: `useForm<Valores, unknown,
 * Payload>`. Um tipo só obrigaria a vaga a nascer com uma escolha feita.
 */
type CareerFormValues = Merge<
  Omit<CareerApplicationCreatePayload, 'position' | 'linkedin'>,
  { position: JobPosition | null; linkedin: string }
>

/**
 * O formulário de candidatura da página de carreiras.
 *
 * O mesmo padrão e a mesma decisão de `contact-form.tsx`: não há backend, e a
 * candidatura confirma na tela, como no site no ar.
 */
export function CareerForm(): React.JSX.Element {
  const form = useForm<
    CareerFormValues,
    unknown,
    CareerApplicationCreatePayload
  >({
    resolver: vineResolver(CareerApplicationCreateValidator),
    mode: 'onTouched',
    defaultValues: { name: '', email: '', position: null, linkedin: '' },
  })

  function submit(): void {
    toast.success(m.career_successMessage(), { id: 'career' })
    form.reset()
  }

  return (
    <form
      data-slot="career-form"
      method="post"
      noValidate
      onSubmit={form.handleSubmit(submit)}
    >
      <FieldGroup className="gap-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="name" className={LABEL}>
                  {m.career_nameLabel()}
                </FieldLabel>
                <Input
                  {...field}
                  id="name"
                  autoComplete="name"
                  className={FIELD}
                  placeholder={m.career_namePlaceholder()}
                  {...invalidProps(fieldState.invalid, 'name')}
                />
                {fieldState.error && (
                  <FieldError id={errorId('name')}>
                    {fieldState.error.message}
                  </FieldError>
                )}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="email" className={LABEL}>
                  {m.career_emailLabel()}
                </FieldLabel>
                <Input
                  {...field}
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={FIELD}
                  placeholder={m.career_emailPlaceholder()}
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
        </div>

        <Controller
          control={form.control}
          name="position"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="position" className={LABEL}>
                {m.career_positionLabel()}
              </FieldLabel>
              {/*
                `items` com os rótulos: sem ele o gatilho mostraria o
                identificador da vaga (`frontend`) em vez do nome dela.
              */}
              <Select
                items={JOB_POSITIONS.map((position) => ({
                  value: position,
                  label: JOB_POSITION_LABELS[position](),
                }))}
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger
                  id="position"
                  onBlur={field.onBlur}
                  className={cn(FIELD, 'w-full')}
                  {...invalidProps(fieldState.invalid, 'position')}
                >
                  <SelectValue placeholder={m.career_positionPlaceholder()} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {JOB_POSITIONS.map((position) => (
                    <SelectItem key={position} value={position}>
                      {JOB_POSITION_LABELS[position]()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.error && (
                <FieldError id={errorId('position')}>
                  {fieldState.error.message}
                </FieldError>
              )}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="linkedin"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="linkedin" className={LABEL}>
                {m.career_linkedinLabel()}
              </FieldLabel>
              <Input
                {...field}
                id="linkedin"
                type="url"
                autoComplete="url"
                className={FIELD}
                placeholder={m.career_linkedinPlaceholder()}
                {...invalidProps(fieldState.invalid, 'linkedin')}
              />
              {fieldState.error && (
                <FieldError id={errorId('linkedin')}>
                  {fieldState.error.message}
                </FieldError>
              )}
            </Field>
          )}
        />

        <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-small text-foreground/70">
            {m.career_privacyNote()}
          </p>
          <PillButton
            type="submit"
            className="shrink-0 px-7"
            disabled={form.formState.isSubmitting}
          >
            {m.career_submitButton()}
          </PillButton>
        </div>
      </FieldGroup>
    </form>
  )
}
