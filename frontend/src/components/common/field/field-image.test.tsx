// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import type { Resolver, ResolverResult } from 'react-hook-form'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppField } from '#/integrations/react-hook-form/app-field'

import { FieldImage } from './field-image'

type Values = { avatarId: string | null }

const resolver: Resolver<Values> = async (
  values,
): Promise<ResolverResult<Values>> => {
  if (values.avatarId) return { values, errors: {} }
  return {
    values: {},
    errors: { avatarId: { type: 'required', message: 'Envie uma foto' } },
  }
}

function Form({
  upload,
  onValid,
}: {
  readonly upload: (
    file: File,
    signal: AbortSignal,
  ) => Promise<{ readonly id: string; readonly url: string }>
  readonly onValid: (values: Values) => void
}): React.JSX.Element {
  const form = useForm<Values>({
    defaultValues: { avatarId: null },
    resolver,
    shouldFocusError: true,
  })

  return (
    <form
      onSubmit={(event) => {
        void form.handleSubmit(onValid)(event)
      }}
    >
      <AppField name="avatarId" control={form.control}>
        <FieldImage
          label="Foto"
          uploadLabel="Enviar foto"
          preview={{ alt: 'Foto atual', fallback: 'JR' }}
          upload={upload}
        />
      </AppField>
      <button type="submit">Salvar</button>
    </form>
  )
}

function fileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector('input[type="file"]')
  if (!(input instanceof HTMLInputElement)) throw new Error('no file input')
  return input
}

afterEach(cleanup)

describe('FieldImage', () => {
  it('an invalid submit focuses the upload button: the Controller ref reaches it', async () => {
    const onValid = vi.fn()
    render(<Form upload={vi.fn()} onValid={onValid} />)

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    const trigger = screen.getByRole('button', { name: 'Foto' })
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger)
    })
    expect(trigger.getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByText('Envie uma foto')).toBeTruthy()
    expect(onValid).not.toHaveBeenCalled()
  })

  it('keeps the storage id the upload returned', async () => {
    const onValid = vi.fn()
    const upload = vi.fn(async () => ({ id: 'storage-1', url: 'blob:x' }))
    const { container } = render(<Form upload={upload} onValid={onValid} />)

    await userEvent.upload(
      fileInput(container),
      new File(['x'], 'a.png', { type: 'image/png' }),
    )
    await waitFor(() => {
      expect(upload).toHaveBeenCalledTimes(1)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(onValid).toHaveBeenCalledWith(
        { avatarId: 'storage-1' },
        expect.anything(),
      )
    })
  })
})
