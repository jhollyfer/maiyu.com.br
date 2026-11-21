import * as React from 'react'

export type UploadStatus =
  'pending' | 'uploading' | 'complete' | 'error' | 'cancelled'

export type UploadItem<TValue> = {
  id: string
  file: File
  name: string
  size: number
  progress: number
  status: UploadStatus
  /** What the upload returned. It only exists after `complete`. */
  value?: TValue
}

export type UploadQueueOptions<TValue> = {
  readonly onUpload: (
    file: File,
    onProgress: (percent: number) => void,
    signal: AbortSignal,
  ) => Promise<TValue>
  /** How many files upload at once; the rest wait their turn. */
  readonly maxConcurrent: number
  readonly onComplete?: (value: TValue, file: File) => void
  /** Called when removing a file that **already uploaded**: the owner deletes the binary. */
  readonly onRemove?: (value: TValue) => void
}

/**
 * The queue of an upload field: a concurrency limit, per-file progress, cancellation on removal and
 * on unmount, and a removal that tells the owner when something had already uploaded.
 *
 * It is a state machine and not markup, so it lives here and `MultiFileUpload` only draws it. It is
 * generic in what the upload returns (`TValue`): the queue does not know what an uploaded file
 * becomes, the caller does.
 *
 * `onUpload` is required: there is no simulation branch for when it is missing, because a progress
 * bar that goes up to 100% and stores nothing would be a lie.
 */
export function useUploadQueue<TValue>({
  onUpload,
  maxConcurrent,
  onComplete,
  onRemove,
}: UploadQueueOptions<TValue>): {
  readonly items: ReadonlyArray<UploadItem<TValue>>
  readonly busy: boolean
  readonly addFiles: (files: ReadonlyArray<File>) => void
  readonly removeItem: (id: string) => void
  readonly retryItem: (id: string) => void
} {
  const cancelers = React.useRef<Map<string, () => void>>(new Map())
  const [items, setItems] = React.useState<Array<UploadItem<TValue>>>([])

  /** The immutable update of a queue item, which all the others use. */
  function patchItem(id: string, patch: Partial<UploadItem<TValue>>): void {
    setItems((previous) =>
      previous.map((item) => {
        if (item.id !== id) return item
        return { ...item, ...patch }
      }),
    )
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
          (percent) =>
            patchItem(item.id, {
              progress: Math.min(Math.round(percent), 100),
            }),
          controller.signal,
        )
        cancelers.current.delete(item.id)
        patchItem(item.id, { progress: 100, status: 'complete', value })
        onComplete?.(value, item.file)
      } catch {
        if (controller.signal.aborted) return
        cancelers.current.delete(item.id)
        patchItem(item.id, { status: 'error' })
      }
    })()
  }

  // The queue starts items from an effect that must react to `items` only, not to the identity of
  // `start` (recreated on every render).
  const startItem = React.useEffectEvent(start)

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

  function addFiles(files: ReadonlyArray<File>): void {
    if (files.length === 0) return

    const next: Array<UploadItem<TValue>> = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'pending',
    }))
    setItems((previous) => [...previous, ...next])
  }

  function removeItem(id: string): void {
    cancelers.current.get(id)?.()
    cancelers.current.delete(id)

    // Read from the rendered queue, not inside the updater: an updater runs during render (and twice
    // under StrictMode), and `onRemove` updates the caller's form state.
    const item = items.find((candidate) => candidate.id === id)

    // Only what got as far as uploading has something to delete on the other side; what was
    // cancelled halfway never became a record.
    if (item?.value !== undefined) onRemove?.(item.value)

    setItems((previous) => previous.filter((candidate) => candidate.id !== id))
  }

  function retryItem(id: string): void {
    cancelers.current.delete(id)
    patchItem(id, { progress: 0, status: 'pending' })
  }

  const busy = items.some(
    (item) => item.status === 'pending' || item.status === 'uploading',
  )

  return { items, busy, addFiles, removeItem, retryItem }
}
