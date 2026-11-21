import * as React from 'react'

import { RichEditorSkeleton } from '#/components/common/rich-editor/rich-editor-skeleton'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '#/components/ui/field'
import { useFieldValidation } from '#/integrations/react-hook-form/use-field-validation'
import type { RichTextDocument } from '@maiyu/shared'

import { FieldRequiredMark } from './field-required-mark'

// The Tiptap side loads on demand: the form's chunk keeps only the label, the description and the
// error, and the skeleton holds the editor's place (`_standards/frontend.md` §9.4,
// _doc-lib/tanstack-router.md#guide/code-splitting). A literal `import()`, at module level.
const FieldRichTextEditor = React.lazy(() => import('./field-rich-text-editor'))

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
  const { field, controlId, isInvalid, errors, errorId, describedBy } =
    useFieldValidation<RichTextDocument | null>('FieldRichText')
  const labelId = `${controlId}-label`

  return (
    <Field data-slot="field-rich-text" data-invalid={isInvalid}>
      {/* `aria-labelledby` and not `htmlFor`: the editable element is a `div`,
          which a `label for` does not reach. */}
      <FieldLabel id={labelId}>
        {label}
        {required && <FieldRequiredMark />}
      </FieldLabel>
      <React.Suspense fallback={<RichEditorSkeleton />}>
        <FieldRichTextEditor
          value={field.value}
          onValueChange={field.onChange}
          placeholder={placeholder}
          aria-invalid={isInvalid}
          aria-describedby={describedBy}
          aria-labelledby={labelId}
          controlId={controlId}
          focusRef={field.ref}
          onBlur={field.onBlur}
        >
          {children}
        </FieldRichTextEditor>
      </React.Suspense>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError id={errorId} errors={errors} />}
    </Field>
  )
}
