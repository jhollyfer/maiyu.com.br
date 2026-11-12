// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { toast } from 'sonner'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ImageField } from '#/components/common/image-field/image-field'
import {
  ImageFieldActions,
  ImageFieldContent,
  ImageFieldDescription,
  ImageFieldRemove,
  ImageFieldUpload,
} from '#/components/common/image-field/image-field-actions'
import { ImageFieldPreview } from '#/components/common/image-field/image-field-preview'
import { m } from '#/paraglide/messages'

// O I/O entra por prop: o teste passa o envio e a limpeza do órfão no lugar da mutation.
const upload = vi.fn()
const discard = vi.fn(async () => undefined)

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function saved(previewUrl: string | null | undefined): string | null {
  if (previewUrl) return 'saved'

  return null
}

function Harness({
  onValueChange,
  previewUrl,
}: Readonly<{
  onValueChange: (id: string | null) => void
  previewUrl?: string | null
}>) {
  const [value, setValue] = React.useState<string | null>(saved(previewUrl))
  return (
    <ImageField
      value={value}
      previewUrl={previewUrl}
      upload={upload}
      discard={discard}
      onValueChange={(id) => {
        setValue(id)
        onValueChange(id)
      }}
    >
      <ImageFieldPreview alt="Avatar">JR</ImageFieldPreview>
      <ImageFieldContent>
        <ImageFieldActions>
          <ImageFieldUpload>Enviar avatar</ImageFieldUpload>
          <ImageFieldRemove />
        </ImageFieldActions>
        <ImageFieldDescription />
      </ImageFieldContent>
    </ImageField>
  )
}

function fileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]')
  if (!input) throw new Error('o seletor nativo não foi renderizado')

  return input
}

const PHOTO = new File(['x'], 'foto.png', { type: 'image/png' })

describe('ImageField', () => {
  it('when there is no image, shows the initials, the description and no Remover', () => {
    render(<Harness onValueChange={() => undefined} />)

    expect(screen.getByText('JR')).toBeTruthy()
    expect(screen.getByText(m.kit_image_formats())).toBeTruthy()
    expect(screen.queryByRole('button', { name: m.kit_remove() })).toBeNull()
  })

  it('when a file is chosen, uploads it and hands the attachment id to the parent', async () => {
    upload.mockResolvedValue({ id: 'storage-1', url: 'https://x/foto.png' })
    const onValueChange = vi.fn()
    const { container } = render(<Harness onValueChange={onValueChange} />)

    await userEvent.upload(fileInput(container), PHOTO)

    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith('storage-1'))
    expect(
      await screen.findByRole('button', { name: m.kit_remove() }),
    ).toBeTruthy()
  })

  it('when the type is not accepted, refuses before any request', async () => {
    const onValueChange = vi.fn()
    const { container } = render(<Harness onValueChange={onValueChange} />)
    const pdf = new File(['x'], 'ficha.pdf', { type: 'application/pdf' })

    await userEvent.upload(fileInput(container), pdf, { applyAccept: false })

    expect(toast.error).toHaveBeenCalledWith(
      m.kit_file_type_not_accepted({ name: 'ficha.pdf' }),
      { id: 'storage-create-error' },
    )
    expect(upload).not.toHaveBeenCalled()
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('when Remover is clicked, clears the value and deletes only the file the field uploaded', async () => {
    upload.mockResolvedValue({ id: 'storage-1', url: 'https://x/foto.png' })
    const onValueChange = vi.fn()
    const { container } = render(<Harness onValueChange={onValueChange} />)

    await userEvent.upload(fileInput(container), PHOTO)
    await userEvent.click(
      await screen.findByRole('button', { name: m.kit_remove() }),
    )

    expect(onValueChange).toHaveBeenLastCalledWith(null)
    await waitFor(() => expect(discard).toHaveBeenCalledTimes(1))
    expect(discard).toHaveBeenCalledWith('storage-1')
  })

  it('when the attachment is already saved, drops it from the screen without deleting it on the server', async () => {
    render(
      <Harness
        onValueChange={() => undefined}
        previewUrl="https://x/salvo.png"
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: m.kit_remove() }))

    expect(discard).not.toHaveBeenCalled()
  })

  it('when a part is outside ImageField, says which one is without a provider', () => {
    expect(() => render(<ImageFieldRemove />)).toThrow('ImageFieldRemove')
  })
})
