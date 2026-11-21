import * as React from 'react'
import { toast } from 'sonner'

import { useRegisterUpload } from '#/components/common/uploading-context/uploading-context'
import { useFileDrop } from '#/hooks/use-file-drop'
import type { FileRejection } from '#/hooks/use-file-drop'
import { useUploadQueue } from '#/hooks/use-upload-queue'
import { cn } from '#/lib/cn'
import { m } from '#/paraglide/messages'
import type { Merge } from '@maiyu/shared'

import { MultiFileUploadProvider } from './multi-file-upload-context'

/**
 * Generic in what the upload returns: the component takes care of the queue, progress and
 * cancellation, and the caller decides what an uploaded file becomes. Here it is the
 * `Storage` from `POST /storages`, whose `id` the entity keeps in `imageIds`.
 */
type MultiFileUploadProps<TValue> = Merge<
  React.ComponentProps<'div'>,
  {
    readonly onUpload: (
      file: File,
      onProgress: (percent: number) => void,
      signal: AbortSignal,
    ) => Promise<TValue>
    readonly maxConcurrent?: number
    /** The picker's `accept`, applied to what is dropped or pasted too (`lib/accept-files.ts`). */
    readonly accept?: string
    readonly onComplete?: (value: TValue, file: File) => void
    /**
     * Called when removing from the list a file that **already uploaded**.
     *
     * This is where `DELETE /storages/:id` comes in: the upload happens at the moment of
     * choice, so removing it from the screen without telling anyone would leave the binary on
     * disk forever. When absent, removal is only visual.
     */
    readonly onRemove?: (value: TValue) => void
    /**
     * Goes on the button that opens the picker, which is the `MultiFileUploadLabel` target.
     * The `<input type="file">` is hidden, and a label pointing to a hidden
     * element carries no focus.
     */
    readonly controlId?: string
    readonly children: React.ReactNode
  }
>

/** What was turned away, said once; the person is not left wondering why a file did not appear. */
function notifyRejection(rejection: FileRejection): void {
  if (rejection.reason === 'too-many') {
    toast.error(m.kit_upload_too_many({ limit: rejection.limit }))
    return
  }

  toast.error(m.kit_upload_rejected({ count: rejection.files.length }))
}

/**
 * The field for **several** files: the area that accepts drag, paste and choose.
 *
 * The queue (`useUploadQueue`) uploads with a concurrency limit, each file shows its own
 * progress, and what already uploaded can be removed - notifying the other side, because
 * the upload happens at the moment of choice and not at submit. Drag, drop and paste
 * (`useFileDrop`) walk folders, honour `accept` and the limit, and light the zone only for a file.
 *
 * Compound because the frame and the queue are what does not change, and the rest is the screen's
 * choice: the label, the summary, the button text. The news gallery wants
 * "Escolher imagens" where the file library wants "Enviar arquivos". With
 * props, each such text becomes one more optional prop in here.
 */
export function MultiFileUpload<TValue>({
  onUpload,
  maxConcurrent = 3,
  accept,
  onComplete,
  onRemove,
  controlId,
  className,
  children,
  ...props
}: MultiFileUploadProps<TValue>): React.JSX.Element {
  const inputId = React.useId()
  const fallbackTriggerId = React.useId()
  const inputRef = React.useRef<HTMLInputElement>(null)

  const queue = useUploadQueue({
    onUpload,
    maxConcurrent,
    onComplete,
    onRemove,
  })
  const { dragging, dropZoneProps, receive } = useFileDrop({
    accept,
    onFiles: queue.addFiles,
    onReject: notifyRejection,
  })

  // Locks the form's save button while any file is in flight: without
  // it the payload goes out without the attachment `id`, and the record is born without an image.
  useRegisterUpload(queue.busy)

  // The queue the visible parts see: without the `File` and without the `value`, which
  // are internal. React Compiler memoizes the value, so the idle queue does not re-render the
  // whole list on every render of the surrounding screen.
  const context = {
    items: queue.items.map((item) => ({
      id: item.id,
      name: item.name,
      size: item.size,
      mime: item.file.type,
      progress: item.progress,
      status: item.status,
    })),
    completed: queue.items.filter((item) => item.status === 'complete').length,
    totalSize: queue.items.reduce((sum, item) => sum + item.size, 0),
    openPicker: () => inputRef.current?.click(),
    removeItem: queue.removeItem,
    retryItem: queue.retryItem,
    triggerId: controlId ?? fallbackTriggerId,
    inputId,
  }

  return (
    <div
      data-slot="multi-file-upload"
      className={cn(
        'overflow-hidden rounded-lg border bg-card transition-colors motion-reduce:transition-none',
        dragging && 'border-primary bg-accent/30',
        className,
      )}
      {...dropZoneProps}
      {...props}
    >
      <MultiFileUploadProvider value={context}>
        {children}
      </MultiFileUploadProvider>

      {/* Stays here and not in a part of its own: it is plumbing, not markup, and
          no screen has a reason to omit it or reposition it. */}
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(event) => {
          receive(Array.from(event.target.files ?? []))
          // Resetting the value is what allows choosing the same file again
          // after removing it: without it `change` does not fire.
          event.target.value = ''
        }}
      />
    </div>
  )
}
