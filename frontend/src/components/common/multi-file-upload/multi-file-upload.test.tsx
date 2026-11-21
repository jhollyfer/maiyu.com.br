// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import type * as React from 'react'
import { toast } from 'sonner'
import { afterEach, describe, expect, it, vi } from 'vitest'

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

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}))

afterEach(() => {
  vi.clearAllMocks()
})

type Uploaded = { readonly name: string }

type HarnessProps = {
  readonly onUpload: (
    file: File,
    onProgress: (percent: number) => void,
    signal: AbortSignal,
  ) => Promise<Uploaded>
  readonly onComplete?: (value: Uploaded) => void
  readonly onRemove?: (value: Uploaded) => void
  readonly accept?: string
}

function Harness({
  onUpload,
  onComplete,
  onRemove,
  accept,
}: HarnessProps): React.JSX.Element {
  return (
    <MultiFileUpload
      onUpload={onUpload}
      onComplete={onComplete}
      onRemove={onRemove}
      accept={accept}
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

function uploadMock(
  name: string,
): ReturnType<typeof vi.fn<HarnessProps['onUpload']>> {
  return vi.fn<HarnessProps['onUpload']>().mockResolvedValue({ name })
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

  describe('drag, drop and paste', () => {
    function zone(container: HTMLElement): HTMLElement {
      const node = container.querySelector('[data-slot="multi-file-upload"]')
      if (!(node instanceof HTMLElement)) throw new Error('zone missing')

      return node
    }

    /** The shape the browser hands a drop: a file drag, entries by `webkitGetAsEntry`. */
    function fileTransfer(
      entries: Array<unknown>,
      files: Array<File> = [],
      types: Array<string> = ['Files'],
    ): { types: Array<string>; files: Array<File>; items: Array<unknown> } {
      return {
        types,
        files,
        items: entries.map((entry) => ({
          kind: 'file',
          webkitGetAsEntry: (): unknown => entry,
        })),
      }
    }

    function fileEntry(name: string, type = 'application/pdf'): unknown {
      return {
        isFile: true,
        isDirectory: false,
        name,
        file: (resolve: (file: File) => void): void =>
          resolve(new File(['x'], name, { type })),
      }
    }

    function folderEntry(name: string, children: Array<unknown>): unknown {
      return {
        isFile: false,
        isDirectory: true,
        name,
        createReader: (): {
          readEntries: (resolve: (entries: Array<unknown>) => void) => void
        } => {
          let delivered = false

          return {
            readEntries: (resolve): void => {
              if (delivered) {
                resolve([])
                return
              }
              delivered = true
              resolve(children)
            },
          }
        },
      }
    }

    it('lights the zone for a file drag only, not for an element dragged inside it', () => {
      const { container } = render(<Harness onUpload={vi.fn()} />)

      fireEvent.dragOver(zone(container), {
        dataTransfer: fileTransfer([], [], ['text/plain']),
      })
      expect(zone(container).className).not.toContain('border-primary')

      fireEvent.dragOver(zone(container), { dataTransfer: fileTransfer([]) })
      expect(zone(container).className).toContain('border-primary')

      fireEvent.dragLeave(zone(container), { relatedTarget: document.body })
      expect(zone(container).className).not.toContain('border-primary')
    })

    it('a dropped file uploads', async () => {
      const onUpload = uploadMock('a.pdf')
      const { container } = render(<Harness onUpload={onUpload} />)

      fireEvent.drop(zone(container), {
        dataTransfer: fileTransfer([fileEntry('a.pdf')]),
      })

      await vi.waitFor(() => expect(onUpload).toHaveBeenCalledOnce())
      expect(onUpload.mock.calls[0]?.[0]).toBeInstanceOf(File)
    })

    it('a dropped folder is walked, and a dotfile inside it is left out', async () => {
      const onUpload = uploadMock('x')
      const { container } = render(<Harness onUpload={onUpload} />)

      fireEvent.drop(zone(container), {
        dataTransfer: fileTransfer([
          folderEntry('docs', [
            fileEntry('a.pdf'),
            fileEntry('.DS_Store'),
            folderEntry('sub', [fileEntry('b.pdf')]),
          ]),
        ]),
      })

      await vi.waitFor(() => expect(onUpload).toHaveBeenCalledTimes(2))
      expect(onUpload.mock.calls.map((call) => call[0]?.name).sort()).toEqual([
        'a.pdf',
        'b.pdf',
      ])
    })

    it('a drop that is not a file does nothing', async () => {
      const onUpload = uploadMock('x')
      const { container } = render(<Harness onUpload={onUpload} />)

      fireEvent.drop(zone(container), {
        dataTransfer: fileTransfer([fileEntry('a.pdf')], [], ['text/plain']),
      })

      await new Promise((resolve) => setTimeout(resolve, 20))
      expect(onUpload).not.toHaveBeenCalled()
    })

    it('a pasted file uploads, and the paste is taken from the browser', async () => {
      const onUpload = uploadMock('print.png')
      const { container } = render(<Harness onUpload={onUpload} />)
      const screenshot = new File(['x'], 'image.png', { type: 'image/png' })

      const notPrevented = fireEvent.paste(zone(container), {
        clipboardData: {
          items: [
            { kind: 'string', getAsFile: (): null => null },
            { kind: 'file', getAsFile: (): File => screenshot },
          ],
        },
      })

      expect(notPrevented).toBe(false)
      await vi.waitFor(() => expect(onUpload).toHaveBeenCalledOnce())
      expect(onUpload.mock.calls[0]?.[0]).toBe(screenshot)
    })

    it('a paste of plain text is left to the browser', () => {
      const onUpload = vi.fn()
      const { container } = render(<Harness onUpload={onUpload} />)

      const notPrevented = fireEvent.paste(zone(container), {
        clipboardData: {
          items: [{ kind: 'string', getAsFile: (): null => null }],
        },
      })

      expect(notPrevented).toBe(true)
      expect(onUpload).not.toHaveBeenCalled()
    })

    it('honours accept on a drop and on a paste, and says what it turned away', async () => {
      const onUpload = uploadMock('x')
      const { container } = render(
        <Harness onUpload={onUpload} accept="image/*" />,
      )

      fireEvent.drop(zone(container), {
        dataTransfer: fileTransfer([
          fileEntry('contrato.pdf'),
          fileEntry('foto.png', 'image/png'),
        ]),
      })

      await vi.waitFor(() => expect(onUpload).toHaveBeenCalledOnce())
      expect(onUpload.mock.calls[0]?.[0]?.name).toBe('foto.png')
      expect(toast.error).toHaveBeenCalledWith(
        m.kit_upload_rejected({ count: 1 }),
      )

      fireEvent.paste(zone(container), {
        clipboardData: {
          items: [
            {
              kind: 'file',
              getAsFile: (): File =>
                new File(['x'], 'a.pdf', { type: 'application/pdf' }),
            },
          ],
        },
      })
      expect(onUpload).toHaveBeenCalledOnce()
      expect(toast.error).toHaveBeenCalledTimes(2)
    })

    it('refuses a drop of more than the limit whole, instead of uploading part of it', async () => {
      const onUpload = uploadMock('x')
      const { container } = render(<Harness onUpload={onUpload} />)
      const many = Array.from({ length: 101 }, (_, index) =>
        fileEntry(`a-${index}.pdf`),
      )

      fireEvent.drop(zone(container), { dataTransfer: fileTransfer(many) })

      await vi.waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          m.kit_upload_too_many({ limit: 100 }),
        ),
      )
      expect(onUpload).not.toHaveBeenCalled()
    })

    it('the picker honours accept too', () => {
      const onUpload = vi.fn()
      const { container } = render(
        <Harness onUpload={onUpload} accept="image/*" />,
      )

      choose(container, pdf('a.pdf'))

      expect(onUpload).not.toHaveBeenCalled()
      expect(toast.error).toHaveBeenCalledOnce()
    })
  })
})
