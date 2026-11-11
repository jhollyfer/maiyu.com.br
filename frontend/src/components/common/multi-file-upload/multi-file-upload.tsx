import * as React from 'react'

import { useRegisterUpload } from '#/components/common/uploading-context/uploading-context'
import { cn } from '#/lib/cn'
import type { Merge } from '@maiyu/shared'

import type { UploadStatus } from './multi-file-upload-context'
import { MultiFileUploadProvider } from './multi-file-upload-context'

type UploadItem<TValue> = {
  id: string
  file: File
  name: string
  size: number
  progress: number
  status: UploadStatus
  /** What the upload returned. It only exists after `complete`. */
  value?: TValue
}

/**
 * Generic in what the upload returns: the component takes care of the queue, progress and
 * cancellation, and the caller decides what an uploaded file becomes. Here it is the
 * `Storage` from `POST /storages`, whose `id` the entity keeps in `imageIds`.
 *
 * `onUpload` is required: there is no simulation branch for when it is missing, because a
 * progress bar that goes up to 100% and stores nothing would be a lie.
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

/**
 * The field for **several** files: the area that accepts drag, paste and choose.
 *
 * The queue uploads with a concurrency limit, each file shows its own
 * progress, and what already uploaded can be removed - notifying the other side, because
 * the upload happens at the moment of choice and not at submit.
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
  const cancelers = React.useRef<Map<string, () => void>>(new Map())
  const [items, setItems] = React.useState<Array<UploadItem<TValue>>>([])
  const [dragging, setDragging] = React.useState(false)

  /** The immutable update of a queue item, which all the others use. */
  function patchItem(id: string, patch: Partial<UploadItem<TValue>>): void {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        return { ...item, ...patch }
      }),
    )
  }

  function setProgress(id: string, percent: number): void {
    patchItem(id, { progress: Math.min(Math.round(percent), 100) })
  }

  function markComplete(id: string, file: File, value: TValue): void {
    cancelers.current.delete(id)
    patchItem(id, { progress: 100, status: 'complete', value })
    onComplete?.(value, file)
  }

  function markError(id: string): void {
    cancelers.current.delete(id)
    patchItem(id, { status: 'error' })
  }

  function start(item: UploadItem<TValue>): void {
    if (cancelers.current.has(item.id)) return
    patchItem(item.id, { status: 'uploading' })

    const controller = new AbortController()
    cancelers.current.set(item.id, () => controller.abort())

    void (async () => {
      try {
        const value = await onUpload(
          item.file,
          (percent) => setProgress(item.id, percent),
          controller.signal,
        )
        markComplete(item.id, item.file, value)
      } catch {
        if (!controller.signal.aborted) markError(item.id)
      }
    })()
  }

  // The queue starts items from an effect that must react to `items` only, not to the
  // identity of `start` (recreated on every render).
  const startItem = React.useEffectEvent(start)

  // Queue with a concurrency limit.
  React.useEffect(() => {
    const active = items.filter((item) => item.status === 'uploading').length
    const slots = maxConcurrent - active
    if (slots <= 0) return
    items
      .filter(
        (item) => item.status === 'pending' && !cancelers.current.has(item.id),
      )
      .slice(0, slots)
      .forEach((item) => startItem(item))
  }, [items, maxConcurrent])

  React.useEffect(() => {
    const map = cancelers.current
    return () => {
      map.forEach((cancel) => cancel())
      map.clear()
    }
  }, [])

  function addFiles(files: Array<File>): void {
    if (files.length === 0) return

    const next: Array<UploadItem<TValue>> = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'pending',
    }))
    setItems((prev) => [...prev, ...next])
  }

  function removeItem(id: string): void {
    cancelers.current.get(id)?.()
    cancelers.current.delete(id)

    // Read from the rendered queue, not inside the updater: an updater runs during render (and
    // twice under StrictMode), and `onRemove` updates the caller's form state.
    const item = items.find((candidate) => candidate.id === id)

    // Only what got as far as uploading has something to delete on the other side; what was
    // cancelled halfway never became a record.
    if (item?.value !== undefined) onRemove?.(item.value)

    setItems((prev) => prev.filter((candidate) => candidate.id !== id))
  }

  function retryItem(id: string): void {
    cancelers.current.delete(id)
    patchItem(id, { progress: 0, status: 'pending' })
  }

  const completed = items.filter((item) => item.status === 'complete').length
  const totalSize = items.reduce((sum, item) => sum + item.size, 0)

  const busy = items.some(
    (item) => item.status === 'pending' || item.status === 'uploading',
  )

  // Locks the form's save button while any file is in flight: without
  // it the payload goes out without the attachment `id`, and the record is born without an image.
  useRegisterUpload(busy)

  /**
   * Drag-and-drop and paste. `preventDefault` on `dragOver` is what stops the
   * browser from opening the file in a new tab, which is its default.
   */
  function onDrop(event: React.DragEvent): void {
    event.preventDefault()
    setDragging(false)
    addFiles(Array.from(event.dataTransfer.files))
  }

  function onPaste(event: React.ClipboardEvent): void {
    const files = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === 'file')
      .map((item) => item.getAsFile())
      .filter((file) => file !== null)

    if (files.length === 0) return

    event.preventDefault()
    addFiles(files)
  }

  // The queue the visible parts see: without the `File` and without the `value`, which
  // are internal. React Compiler memoizes the value, so the idle queue does not re-render the
  // whole list on every render of the surrounding screen.
  const context = {
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      size: item.size,
      mime: item.file.type,
      progress: item.progress,
      status: item.status,
    })),
    completed,
    totalSize,
    openPicker: () => inputRef.current?.click(),
    removeItem,
    retryItem,
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
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(event) => {
        // Moving to a child is still being inside: without this check the highlight
        // flickers on every element the cursor crosses. `instanceof` instead of
        // `as Node`: `relatedTarget` is `EventTarget | null`, and the predicate proves
        // the narrowing instead of asserting it.
        const target = event.relatedTarget
        if (target instanceof Node && event.currentTarget.contains(target)) {
          return
        }
        setDragging(false)
      }}
      onDrop={onDrop}
      onPaste={onPaste}
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
          addFiles(Array.from(event.target.files ?? []))
          // Resetting the value is what allows choosing the same file again
          // after removing it: without it `change` does not fire.
          event.target.value = ''
        }}
      />
    </div>
  )
}
