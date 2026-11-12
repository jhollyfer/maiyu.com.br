import * as React from 'react'
import type { RefCallBack } from 'react-hook-form'

import { RichEditor } from '#/components/common/rich-editor/rich-editor'
import { RichEditorContent } from '#/components/common/rich-editor/rich-editor-content'
import { useRichEditorContext } from '#/components/common/rich-editor/rich-editor-context'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '#/components/ui/field'
import { useFieldValidation } from '#/integrations/react-hook-form/use-field-validation'
import type { RichTextDocument } from '@maiyu/shared'

import { FieldRequiredMark } from './field-required-mark'

type FieldRichTextProps = {
  readonly label: string
  readonly description?: React.ReactNode
  readonly placeholder?: string
  readonly required?: boolean
  /** The toolbar (`RichEditorToolbar` and its buttons); absent, the editor has none. */
  readonly children?: React.ReactNode
}

/**
 * `RichEditor` bound to `AppField`: the form keeps the editor JSON, or `null`
 * when the text was erased.
 */
export function FieldRichText({
  label,
  description,
  placeholder,
  required,
  children,
}: FieldRichTextProps): React.JSX.Element {
  const { field, isInvalid, errors, errorId, describedBy } =
    useFieldValidation<RichTextDocument | null>('FieldRichText')
  const labelId = `${field.name}-label`

  return (
    <Field data-slot="field-rich-text" data-invalid={isInvalid}>
      {/* `aria-labelledby` and not `htmlFor`: the editable element is a `div`,
          which a `label for` does not reach. */}
      <FieldLabel id={labelId}>
        {label}
        {required && <FieldRequiredMark />}
      </FieldLabel>
      <RichEditor
        value={field.value}
        onValueChange={field.onChange}
        placeholder={placeholder}
        aria-invalid={isInvalid}
        aria-describedby={describedBy}
        aria-labelledby={labelId}
      >
        {children}
        <RichEditorContent id={field.name} />
        <FieldRichTextBinding focusRef={field.ref} onBlur={field.onBlur} />
      </RichEditor>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError id={errorId} errors={errors} />}
    </Field>
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
