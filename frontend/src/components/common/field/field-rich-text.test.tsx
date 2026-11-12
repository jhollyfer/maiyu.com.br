// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import type { Resolver, ResolverResult } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'

import { AppField } from '#/integrations/react-hook-form/app-field'
import { RichText } from '@maiyu/shared'
import type { RichTextDocument } from '@maiyu/shared'

import { FieldRichText } from './field-rich-text'

// `unknown` and not `RichTextDocument | null`: the document has its own `type` key, and
// RHF types the error of an object field as the error of each child, so a field-level
// `{ type, message }` would not type-check.
type Values = { body: unknown }

const resolver: Resolver<Values> = async (
  values,
): Promise<ResolverResult<Values>> => {
  if (values.body) return { values, errors: {} }
  return {
    values: {},
    errors: { body: { type: 'required', message: 'Escreva o texto' } },
  }
}

function Form({
  body,
  onValid,
}: {
  readonly body: RichTextDocument | null
  readonly onValid: (values: Values) => void
}): React.JSX.Element {
  const form = useForm<Values>({
    defaultValues: { body },
    resolver,
    shouldFocusError: true,
  })

  return (
    <form
      onSubmit={(event) => {
        void form.handleSubmit(onValid)(event)
      }}
    >
      <AppField name="body" control={form.control}>
        <FieldRichText label="Corpo" />
      </AppField>
      <button type="submit">Salvar</button>
    </form>
  )
}

describe('FieldRichText', () => {
  it('an invalid submit focuses the editor: the Controller ref reaches Tiptap', async () => {
    const onValid = vi.fn()
    const { container } = render(<Form body={null} onValid={onValid} />)
    await waitFor(() => {
      expect(container.querySelector('[contenteditable="true"]')).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await screen.findByText('Escreva o texto')
    const editable = container.querySelector('[contenteditable="true"]')
    await waitFor(() => {
      expect(editable?.contains(document.activeElement)).toBe(true)
    })
    expect(
      container
        .querySelector('[data-slot="rich-editor"]')
        ?.getAttribute('aria-invalid'),
    ).toBe('true')
    expect(onValid).not.toHaveBeenCalled()
  })

  it('sends the document the form opened with, untouched', async () => {
    const onValid = vi.fn()
    const body = RichText.fromText('texto salvo')
    render(<Form body={body} onValid={onValid} />)
    await screen.findByText('texto salvo')

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(onValid).toHaveBeenCalledWith({ body }, expect.anything())
    })
  })

  it('labels the editable element by the field label', async () => {
    const { container } = render(<Form body={null} onValid={vi.fn()} />)
    await waitFor(() => {
      expect(container.querySelector('[contenteditable="true"]')).toBeTruthy()
    })

    const editable = container.querySelector('[contenteditable="true"]')
    const labelId = editable?.getAttribute('aria-labelledby')
    expect(labelId && document.getElementById(labelId)?.textContent).toBe(
      'Corpo',
    )
  })
})
