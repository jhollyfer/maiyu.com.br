import * as React from 'react'

export type UploadStatus =
  'pending' | 'uploading' | 'complete' | 'error' | 'cancelled'

/**
 * A queue row, as the visible parts see it.
 *
 * Without the `File` and without what the upload returned: the list draws name, size,
 * progress and state, and nothing else. Keeping the generic `TValue` out of here is what keeps
 * the context non-generic - a `React.createContext` of a generic type would force
 * each part to receive the type parameter back by prop.
 */
export type MultiFileUploadItem = {
  id: string
  name: string
  size: number
  mime: string
  progress: number
  status: UploadStatus
}

/**
 * What the whole field shares - and nothing else.
 *
 * The queue is a real state machine: concurrency limit, per-file progress,
 * cancellation on unmount and removal that notifies the other side. The visible
 * parts only read its result and fire three actions. Passing this by prop
 * would give each piece seven props that none of them decides.
 *
 * The texts are **not** here: label, summary and the button's are markup, and
 * markup goes by slot.
 */
export type MultiFileUploadContextValue = {
  items: ReadonlyArray<MultiFileUploadItem>
  /** How many have uploaded, for the summary. */
  completed: number
  /** The sum of sizes, in bytes. */
  totalSize: number
  /** Opens the native picker, which stays hidden in `MultiFileUpload`. */
  openPicker: () => void
  /** Removes the row from the list, cancelling the in-flight upload if any. */
  removeItem: (id: string) => void
  /** Moves the row that failed back to the end of the queue. */
  retryItem: (id: string) => void
  /** The `FieldLabel` target: the visible button, never the hidden input. */
  triggerId: string
  /** The hidden input's `id`, for the button's `aria-controls`. */
  inputId: string
}

const MultiFileUploadContext =
  React.createContext<MultiFileUploadContextValue | null>(null)

export const MultiFileUploadProvider = MultiFileUploadContext.Provider

/**
 * The queue, for whoever is inside `MultiFileUpload`.
 *
 * The `consumer` goes into the message so the error says **which** part ended up outside the
 * provider - without it the `throw` reports "missing provider" and leaves the search to
 * whoever reads the stack.
 */
export function useMultiFileUploadContext(
  consumer: string,
): MultiFileUploadContextValue {
  const context = React.use(MultiFileUploadContext)

  if (!context) {
    throw new Error(`\`${consumer}\` must be used inside \`MultiFileUpload\``)
  }

  return context
}
