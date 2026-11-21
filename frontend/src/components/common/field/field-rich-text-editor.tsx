import * as React from 'react'
import type { RefCallBack } from 'react-hook-form'

import { RichEditor } from '#/components/common/rich-editor/rich-editor'
import { RichEditorContent } from '#/components/common/rich-editor/rich-editor-content'
import { useRichEditorContext } from '#/components/common/rich-editor/rich-editor-context'
import type { RichTextDocument } from '@maiyu/shared'

type FieldRichTextEditorProps = {
  readonly value: RichTextDocument | null | undefined
  readonly onValueChange: (content: RichTextDocument | null) => void
  readonly placeholder?: string
  readonly 'aria-invalid'?: boolean
  readonly 'aria-describedby'?: string
  readonly 'aria-labelledby'?: string
  readonly controlId: string
  readonly focusRef: RefCallBack
  readonly onBlur: () => void
  readonly children?: React.ReactNode
}

/**
 * The part of `FieldRichText` that imports Tiptap: it is the module the field loads with `lazy`, so
 * the editor stays out of the form's chunk and the field draws `RichEditorSkeleton` until it comes
 * (`_standards/frontend.md` §9.4). Default export because `lazy` asks for it.
 */
export default function FieldRichTextEditor({
  controlId,
  focusRef,
  onBlur,
  children,
  ...editor
}: FieldRichTextEditorProps): React.JSX.Element {
  return (
    <RichEditor {...editor}>
      {children}
      <RichEditorContent id={controlId} />
      <FieldRichTextBinding focusRef={focusRef} onBlur={onBlur} />
    </RichEditor>
  )
}

type FieldRichTextBindingProps = {
  readonly focusRef: RefCallBack
  readonly onBlur: () => void
}

/**
 * Hands the Tiptap instance to the form: `focus` for the invalid submit and
 * `blur` for `isTouched`. The `Controller` ref accepts any object with
 * `focus()` (`_doc-lib/react-hook-form.md#docs/usecontroller/controller`,
 * https://react-hook-form.com/docs/usecontroller/controller), and the editor
 * only exists after hydration, inside `RichEditor`.
 */
function FieldRichTextBinding({
  focusRef,
  onBlur,
}: FieldRichTextBindingProps): null {
  const { editor } = useRichEditorContext('FieldRichText')

  React.useEffect(() => {
    if (!editor) return
    focusRef({ focus: () => editor.commands.focus() })
    editor.on('blur', onBlur)
    return () => {
      editor.off('blur', onBlur)
    }
  }, [editor, focusRef, onBlur])

  return null
}
