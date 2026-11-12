// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { useForm } from 'react-hook-form'
import type { Resolver, ResolverResult } from 'react-hook-form'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppField } from '#/integrations/react-hook-form/app-field'

import { FieldFiles } from './field-files'

type Values = { imageIds: Array<string> }

const resolver: Resolver<Values> = async (
  values,
): Promise<ResolverResult<Values>> => {
  if (values.imageIds.length > 0) return { values, errors: {} }
  return {
    values: {},
    errors: { imageIds: { type: 'required', message: 'Envie uma imagem' } },
  }
}

type Upload = (
  file: File,
  onProgress: (percent: number) => void,
  signal: AbortSignal,
) => Promise<{ readonly id: string }>

function Form({
  upload,
  discard,
  onValid,
}: {
  readonly upload: Upload
  readonly discard?: (id: string) => Promise<unknown>
  readonly onValid: (values: Values) => void
}): React.JSX.Element {
  const form = useForm<Values>({
    defaultValues: { imageIds: [] },
    resolver,
    shouldFocusError: true,
  })

  return (
    <form
      onSubmit={(event) => {
        void form.handleSubmit(onValid)(event)
      }}
    >
      <AppField name="imageIds" control={form.control}>
        <FieldFiles
          label="Galeria"
          triggerLabel="Escolher imagens"
          upload={upload}
          discard={discard}
        />
      </AppField>
      <button type="submit">Salvar</button>
    </form>
  )
}

function pick(container: HTMLElement, names: ReadonlyArray<string>): void {
  const input = container.querySelector('input[type="file"]')
  if (!(input instanceof HTMLInputElement)) throw new Error('no file input')
  fireEvent.change(input, {
    target: {
      files: names.map((name) => new File(['x'], name, { type: 'image/png' })),
    },
  })
}

afterEach(cleanup)

describe('FieldFiles', () => {
  it('an invalid submit focuses the trigger: the Controller ref reaches it', async () => {
    render(<Form upload={vi.fn()} onValid={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    const trigger = screen.getByRole('button', { name: /Galeria/ })
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger)
    })
    expect(trigger.getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByText('Envie uma imagem')).toBeTruthy()
  })

  it('keeps every id when uploads finish together, none lost to a stale value', async () => {
    const onValid = vi.fn<(values: Values) => void>()
    const upload: Upload = async (file) => ({ id: `id-${file.name}` })
    const { container } = render(<Form upload={upload} onValid={onValid} />)

    pick(container, ['a.png', 'b.png', 'c.png'])
    await screen.findByText(/3 de 3 enviados/)
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(onValid).toHaveBeenCalledTimes(1)
    })
    expect([...(onValid.mock.lastCall?.[0].imageIds ?? [])].sort()).toEqual([
      'id-a.png',
      'id-b.png',
      'id-c.png',
    ])
  })

  it('removing an uploaded file drops its id and asks to discard it', async () => {
    const onValid = vi.fn<(values: Values) => void>()
    const discard = vi.fn(async () => undefined)
    const upload: Upload = async (file) => ({ id: `id-${file.name}` })
    const { container } = render(
      <Form upload={upload} discard={discard} onValid={onValid} />,
    )

    pick(container, ['a.png', 'b.png'])
    await screen.findByText(/2 de 2 enviados/)
    fireEvent.click(screen.getByRole('button', { name: 'Remover a.png' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(onValid).toHaveBeenCalledTimes(1)
    })
    expect(onValid.mock.lastCall?.[0].imageIds).toEqual(['id-b.png'])
    expect(discard).toHaveBeenCalledWith('id-a.png')
  })
})
