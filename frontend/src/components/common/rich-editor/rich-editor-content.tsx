import { EditorContent } from '@tiptap/react'
import type * as React from 'react'

import { useRichEditorContext } from './rich-editor-context'

type RichEditorContentProps = {
  /**
   * The target of the consumer's `FieldLabel`. It goes on the editable element, which is
   * what receives focus.
   */
  readonly id?: string
}

/** The editable area. */
export function RichEditorContent({
  id,
}: RichEditorContentProps): React.JSX.Element {
  const { editor } = useRichEditorContext('RichEditorContent')

  return (
    <EditorContent data-slot="rich-editor-content" editor={editor} id={id} />
  )
}
