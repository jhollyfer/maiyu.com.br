// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'

import { FieldCheckbox } from '#/components/common/field/field-checkbox'
import { FieldFiles } from '#/components/common/field/field-files'
import { FieldNumber } from '#/components/common/field/field-number'
import { FieldPassword } from '#/components/common/field/field-password'
import { FieldRichText } from '#/components/common/field/field-rich-text'
import { FieldSwitch } from '#/components/common/field/field-switch'
import { FieldText } from '#/components/common/field/field-text'
import { FieldTextarea } from '#/components/common/field/field-textarea'
import { AppField } from '#/integrations/react-hook-form/app-field'
import type { RichTextDocument } from '@maiyu/shared'

/**
 * Two forms on the same page with a field of the same `name` (checkout and newsletter e-mail):
 * the `id` came from the `name` alone, both controls got `id="email"` and each label pointed at
 * the first one, mixing the accessible name for the screen reader and for `getByLabelText`.
 */
type Values = {
  email: string
  message: string
  password: string
  quantity: number | null
  terms: boolean
  news: boolean
  body: RichTextDocument | null
  gallery: Array<string>
}

const LABELS = [
  'E-mail',
  'Mensagem',
  'Senha',
  'Quantidade',
  'Aceito os termos',
  'Receber novidades',
]

function Form({ title }: { readonly title: string }): React.JSX.Element {
  const form = useForm<Values>({
    defaultValues: {
      email: '',
      message: '',
      password: '',
      quantity: null,
      terms: false,
      news: false,
      body: null,
      gallery: [],
    },
  })

  return (
    <form aria-label={title}>
      <AppField name="email" control={form.control}>
        <FieldText label="E-mail" type="email" />
      </AppField>
      <AppField name="message" control={form.control}>
        <FieldTextarea label="Mensagem" />
      </AppField>
      <AppField name="password" control={form.control}>
        <FieldPassword label="Senha" autoComplete="new-password" />
      </AppField>
      <AppField name="quantity" control={form.control}>
        <FieldNumber label="Quantidade" locale="pt-BR" />
      </AppField>
      <AppField name="terms" control={form.control}>
        <FieldCheckbox label="Aceito os termos" />
      </AppField>
      <AppField name="news" control={form.control}>
        <FieldSwitch label="Receber novidades" />
      </AppField>
      <AppField name="body" control={form.control}>
        <FieldRichText label="Corpo" />
      </AppField>
      <AppField name="gallery" control={form.control}>
        <FieldFiles
          label="Galeria"
          triggerLabel="Escolher imagens"
          upload={async () => ({ id: 'storage-1' })}
        />
      </AppField>
    </form>
  )
}

function Page(): React.JSX.Element {
  return (
    <>
      <Form title="Checkout" />
      <Form title="Newsletter" />
    </>
  )
}

describe('useFieldValidation: control id', () => {
  it.each(LABELS)(
    '"%s" in two forms on the page gets two distinct ids',
    (label) => {
      render(<Page />)

      const [first, second] = screen.getAllByLabelText(label)
      expect(first).toBeDefined()
      expect(second).toBeDefined()
      expect(first).not.toBe(second)
      expect(first?.id).not.toBe(second?.id)
    },
  )

  it.each(LABELS)(
    'each "%s" label points at the control of its own form',
    (label) => {
      render(<Page />)

      for (const title of ['Checkout', 'Newsletter']) {
        const form = within(screen.getByRole('form', { name: title }))
        const control = form.getByLabelText(label)
        const labelElement = form.getByText(label).closest('label')

        expect(labelElement?.htmlFor).toBe(control.id)
        expect(document.querySelectorAll(`[id="${control.id}"]`)).toHaveLength(
          1,
        )
      }
    },
  )

  it('keeps the name in the id and the name attribute untouched', () => {
    render(<Page />)

    for (const control of screen.getAllByLabelText('E-mail')) {
      expect(control.id).toMatch(/-email$/)
      expect(control.getAttribute('name')).toBe('email')
    }
  })

  // The rich text editor (a `div`, labelled by `aria-labelledby`) and the upload trigger take the
  // id by suffix: neither is reached by `getByLabelText` on a sibling `label for`.
  it.each(['body', 'gallery'])(
    'the "%s" control gets one distinct id per form',
    async (name) => {
      render(<Page />)

      await waitFor(() => {
        expect(document.querySelectorAll(`[id$="-${name}"]`)).toHaveLength(2)
      })
      const ids = [...document.querySelectorAll(`[id$="-${name}"]`)].map(
        (element) => element.id,
      )
      expect(new Set(ids).size).toBe(2)
      expect(document.getElementById(name)).toBeNull()
    },
  )

  it('the rich text of each form is labelled by the label of its own form', () => {
    render(<Page />)

    for (const title of ['Checkout', 'Newsletter']) {
      const form = screen.getByRole('form', { name: title })
      const labelledBy = String(
        within(form).getByLabelText('Corpo').getAttribute('aria-labelledby'),
      )

      expect(form.contains(document.getElementById(labelledBy))).toBe(true)
    }
  })
})
