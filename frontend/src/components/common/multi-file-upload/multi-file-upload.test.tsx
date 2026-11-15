// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { MultiFileUpload } from '#/components/common/multi-file-upload/multi-file-upload'
import {
  MultiFileUploadContent,
  MultiFileUploadHeader,
  MultiFileUploadLabel,
  MultiFileUploadSummary,
  MultiFileUploadTrigger,
} from '#/components/common/multi-file-upload/multi-file-upload-header'
import { MultiFileUploadList } from '#/components/common/multi-file-upload/multi-file-upload-list'
import { m } from '#/paraglide/messages'

type Uploaded = { readonly name: string }

type HarnessProps = {
  readonly onUpload: (
    file: File,
    onProgress: (percent: number) => void,
    signal: AbortSignal,
  ) => Promise<Uploaded>
  readonly onComplete?: (value: Uploaded) => void
  readonly onRemove?: (value: Uploaded) => void
}

function Harness({
  onUpload,
  onComplete,
  onRemove,
}: HarnessProps): React.JSX.Element {
  return (
    <MultiFileUpload
      onUpload={onUpload}
      onComplete={onComplete}
      onRemove={onRemove}
    >
      <MultiFileUploadHeader>
        <MultiFileUploadContent>
          <MultiFileUploadLabel>Anexos</MultiFileUploadLabel>
          <MultiFileUploadSummary />
        </MultiFileUploadContent>
        <MultiFileUploadTrigger />
      </MultiFileUploadHeader>
      <MultiFileUploadList />
    </MultiFileUpload>
  )
}

function choose(container: HTMLElement, ...files: Array<File>): void {
  const input = container.querySelector('input[type="file"]')
  if (!(input instanceof HTMLInputElement)) throw new Error('input missing')

  fireEvent.change(input, { target: { files } })
}

function pdf(name: string): File {
  return new File(['x'], name, { type: 'application/pdf' })
}

describe('MultiFileUpload', () => {
  it('when empty, it shows the label, the summary and no list', () => {
    render(<Harness onUpload={vi.fn()} />)

    expect(screen.getByText('Anexos')).toBeTruthy()
    expect(
      screen.getByText(
        m.kit_upload_summary({ completed: 0, total: 0, size: '0 B' }),
        {
          exact: false,
        },
      ),
    ).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Remover/ })).toBeNull()
  })

  it('when a file is chosen and the upload resolves, it completes and notifies', async () => {
    const onUpload = vi.fn().mockResolvedValue({ name: 'a.pdf' })
    const onComplete = vi.fn()
    const { container } = render(
      <Harness onUpload={onUpload} onComplete={onComplete} />,
    )

    choose(container, pdf('a.pdf'))

    await vi.waitFor(() =>
      expect(onComplete).toHaveBeenCalledWith(
        { name: 'a.pdf' },
        expect.any(File),
      ),
    )
    expect(
      screen.getByRole('button', {
        name: m.kit_upload_remove_item({ name: 'a.pdf' }),
      }),
    ).toBeTruthy()
  })

  it('when the upload fails, the item shows the failure and can be retried', async () => {
    const onUpload = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({ name: 'a.pdf' })
    const onComplete = vi.fn()
    const { container } = render(
      <Harness onUpload={onUpload} onComplete={onComplete} />,
    )

    choose(container, pdf('a.pdf'))
    expect(await screen.findByText(m.kit_upload_failed())).toBeTruthy()

    fireEvent.click(
      screen.getByRole('button', {
        name: m.kit_upload_retry_item({ name: 'a.pdf' }),
      }),
    )

    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledOnce())
    expect(onUpload).toHaveBeenCalledTimes(2)
  })

  it('when a finished item is removed, the owner is told and the item leaves the list', async () => {
    const onRemove = vi.fn()
    const { container } = render(
      <Harness
        onUpload={vi.fn().mockResolvedValue({ name: 'a.pdf' })}
        onRemove={onRemove}
      />,
    )
    choose(container, pdf('a.pdf'))

    fireEvent.click(
      await screen.findByRole('button', {
        name: m.kit_upload_remove_item({ name: 'a.pdf' }),
      }),
    )

    expect(onRemove).toHaveBeenCalledWith({ name: 'a.pdf' })
    expect(
      screen.queryByRole('button', {
        name: m.kit_upload_remove_item({ name: 'a.pdf' }),
      }),
    ).toBeNull()
  })

  it('when an item is removed while uploading, the request is aborted and the owner is not told', async () => {
    const aborted = vi.fn()
    const onRemove = vi.fn()
    const onUpload = vi.fn(
      (
        _file: File,
        _progress: (percent: number) => void,
        signal: AbortSignal,
      ) =>
        new Promise<Uploaded>((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            aborted()
            reject(new Error('aborted'))
          })
        }),
    )
    const { container } = render(
      <Harness onUpload={onUpload} onRemove={onRemove} />,
    )
    choose(container, pdf('a.pdf'))

    fireEvent.click(
      await screen.findByRole('button', {
        name: m.kit_upload_remove_item({ name: 'a.pdf' }),
      }),
    )

    expect(aborted).toHaveBeenCalledOnce()
    expect(onRemove).not.toHaveBeenCalled()
  })

  it('when more files than the limit are chosen, only the limit uploads at once', async () => {
    const releases: Array<() => void> = []
    const onUpload = vi.fn(
      () =>
        new Promise<Uploaded>((resolve) => {
          releases.push(() => resolve({ name: 'x' }))
        }),
    )
    const { container } = render(
      <MultiFileUpload onUpload={onUpload} maxConcurrent={1}>
        <MultiFileUploadList />
      </MultiFileUpload>,
    )

    choose(container, pdf('a.pdf'), pdf('b.pdf'))
    await vi.waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1))

    releases[0]?.()

    await vi.waitFor(() => expect(onUpload).toHaveBeenCalledTimes(2))
  })

  it('when the trigger is pressed, it opens the file picker', () => {
    const { container } = render(<Harness onUpload={vi.fn()} />)
    const input = container.querySelector('input[type="file"]')
    if (!(input instanceof HTMLInputElement)) throw new Error('input missing')
    const click = vi.spyOn(input, 'click')

    fireEvent.click(screen.getByRole('button', { name: 'Anexos' }))

    expect(click).toHaveBeenCalledOnce()
  })
})
