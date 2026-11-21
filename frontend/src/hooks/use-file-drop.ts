import * as React from 'react'

import { splitByAccept } from '#/lib/accept-files'
import { isFileDrag, readDroppedFiles } from '#/lib/dropped-files'

/** A drop of more than this many files is refused whole: the tree is not walked past it. */
export const MAX_DROPPED_FILES = 100

export type FileRejection =
  | { readonly reason: 'type'; readonly files: ReadonlyArray<File> }
  | { readonly reason: 'too-many'; readonly limit: number }

type FileDropOptions = {
  /** The `accept` of the picker, applied to what is dropped or pasted too. */
  readonly accept?: string
  readonly onFiles: (files: Array<File>) => void
  /** Told what was turned away, so the person is not left wondering why a file did not appear. */
  readonly onReject: (rejection: FileRejection) => void
}

/** The events the drop zone listens to; spread on the zone. */
type DropZoneProps = Pick<
  React.ComponentProps<'div'>,
  'onDragEnter' | 'onDragOver' | 'onDragLeave' | 'onDrop' | 'onPaste'
>

/**
 * Drag, drop and paste of files onto a zone, in one place.
 *
 * Only a drag that carries a file lights the zone up (`isFileDrag`), so reordering a list inside it
 * does not. A drop walks folders (`readDroppedFiles`: pages of 100, dotfiles out, a cap that stops
 * the scan) and a paste takes the files of the clipboard (a screenshot is a file there). Both, and
 * the picker through `receive`, go through the same `accept` and the same limit, because a drop
 * and a paste do not pass through the `accept` attribute of the `<input>`.
 *
 * `preventDefault` on `dragover` and `drop` is what stops the browser from opening the file in a new
 * tab, which is its default.
 */
export function useFileDrop({ accept, onFiles, onReject }: FileDropOptions): {
  readonly dragging: boolean
  readonly dropZoneProps: DropZoneProps
  readonly receive: (files: ReadonlyArray<File>) => void
} {
  const [dragging, setDragging] = React.useState(false)

  function receive(files: ReadonlyArray<File>): void {
    if (files.length === 0) return

    if (files.length > MAX_DROPPED_FILES) {
      onReject({ reason: 'too-many', limit: MAX_DROPPED_FILES })
      return
    }

    const { accepted, rejected } = splitByAccept(files, accept)
    if (rejected.length > 0) onReject({ reason: 'type', files: rejected })
    if (accepted.length > 0) onFiles(accepted)
  }

  const dropZoneProps: DropZoneProps = {
    onDragEnter: (event) => {
      if (!isFileDrag(event.dataTransfer)) return
      event.preventDefault()
      setDragging(true)
    },
    onDragOver: (event) => {
      if (!isFileDrag(event.dataTransfer)) return
      event.preventDefault()
      setDragging(true)
    },
    onDragLeave: (event) => {
      // Moving to a child is still being inside: without this check the highlight flickers on every
      // element the cursor crosses. `instanceof` instead of `as Node`: `relatedTarget` is
      // `EventTarget | null`, and the predicate proves the narrowing instead of asserting it.
      const target = event.relatedTarget
      if (target instanceof Node && event.currentTarget.contains(target)) return
      setDragging(false)
    },
    onDrop: (event) => {
      if (!isFileDrag(event.dataTransfer)) return
      event.preventDefault()
      setDragging(false)

      // The entries are read before the first `await` inside `readDroppedFiles`, the only moment
      // the browser still has them.
      void readDroppedFiles(event.dataTransfer, MAX_DROPPED_FILES).then(receive)
    },
    onPaste: (event) => {
      const files = Array.from(event.clipboardData.items)
        .filter((item) => item.kind === 'file')
        .map((item) => item.getAsFile())
        .filter((file) => file !== null)

      if (files.length === 0) return

      event.preventDefault()
      receive(files)
    },
  }

  return { dragging, dropZoneProps, receive }
}
