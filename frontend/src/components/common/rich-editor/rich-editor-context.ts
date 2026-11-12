import type { Editor } from '@tiptap/react'
import * as React from 'react'

/**
 * What the whole editor shares - and nothing else.
 *
 * The Tiptap instance is born in `RichEditor` and used by two sibling parts:
 * the toolbar reads the cursor state and fires commands, the content mounts the editable
 * DOM. Passing it by prop would force the screen to hold the `useEditor` only to
 * pass it back to the two.
 *
 * `null` until Tiptap mounts: TanStack Start renders on the server, and the
 * instance only exists after hydration. Whoever consumes it must handle that.
 */
export type RichEditorContextValue = {
  editor: Editor | null
}

const RichEditorContext = React.createContext<RichEditorContextValue | null>(
  null,
)

export const RichEditorProvider = RichEditorContext.Provider

/**
 * The editor, for whoever is inside `RichEditor`.
 *
 * The `consumer` goes into the message so the error says **which** part ended up outside the
 * provider - without it the `throw` reports "missing provider" and leaves the search to
 * whoever reads the stack.
 */
export function useRichEditorContext(consumer: string): RichEditorContextValue {
  const context = React.use(RichEditorContext)

  if (!context) {
    throw new Error(`\`${consumer}\` must be used inside \`RichEditor\``)
  }

  return context
}
