import * as React from 'react'

import { MultiFileUpload } from '#/components/common/multi-file-upload/multi-file-upload'
import {
  MultiFileUploadContent,
  MultiFileUploadHeader,
  MultiFileUploadLabel,
  MultiFileUploadSummary,
  MultiFileUploadTrigger,
} from '#/components/common/multi-file-upload/multi-file-upload-header'
import { MultiFileUploadList } from '#/components/common/multi-file-upload/multi-file-upload-list'
import { Field, FieldDescription, FieldError } from '#/components/ui/field'
import { useFieldValidation } from '#/integrations/react-hook-form/use-field-validation'
import type { StorageMimetype } from '@maiyu/shared'

import { FieldRequiredMark } from './field-required-mark'

type FieldFilesProps = {
  readonly label: string
  /** Without it, the button says "Escolher arquivos". */
  readonly triggerLabel?: string
  readonly description?: React.ReactNode
  readonly required?: boolean
  readonly accept?: ReadonlyArray<StorageMimetype>
  readonly maxConcurrent?: number
  /** I/O by prop (`KIT.md` §1, rule 7): the multipart upload of the project. */
  readonly upload: (
    file: File,
    onProgress: (percent: number) => void,
    signal: AbortSignal,
  ) => Promise<{ readonly id: string }>
  /** Deletes a file removed from the list after it uploaded; without it the backend prune sweeps it. */
  readonly discard?: (storageId: string) => Promise<unknown>
}

/**
 * `MultiFileUpload` bound to `AppField`: the form keeps the storage `id`s in
 * upload order.
 *
 * `field.ref` goes on the trigger, the only focusable element, so an invalid
 * submit focuses it
 * (`_doc-lib/react-hook-form.md#docs/usecontroller/controller`,
 * https://react-hook-form.com/docs/usecontroller/controller).
 */
export function FieldFiles({
  label,
  triggerLabel,
  description,
  required,
  accept,
  maxConcurrent,
  upload,
  discard,
}: FieldFilesProps): React.JSX.Element {
  const { field, isInvalid, errors, errorId, describedBy } =
    useFieldValidation<Array<string> | null>('FieldFiles')
  const { ref: fieldRef } = field

  // Uploads finish out of render, each closing over the value of the render
  // that started it: two in flight would both append to the same stale array
  // and the first id would be lost. The ref always holds the last committed list.
  const latest = React.useRef(field.value ?? [])
  React.useEffect(() => {
    latest.current = field.value ?? []
  })

  function commit(next: Array<string>): void {
    latest.current = next
    field.onChange(next)
    field.onBlur()
  }

  return (
    <Field data-slot="field-files" data-invalid={isInvalid}>
      <MultiFileUpload<{ readonly id: string }>
        controlId={field.name}
        accept={accept?.join(',')}
        maxConcurrent={maxConcurrent}
        onUpload={upload}
        onComplete={(storage) => commit([...latest.current, storage.id])}
        onRemove={(storage) => {
          commit(latest.current.filter((id) => id !== storage.id))
          // Silent: cleanup the person did not ask for; failing leaves the orphan for the prune.
          discard?.(storage.id).catch(() => undefined)
        }}
      >
        <MultiFileUploadHeader>
          <MultiFileUploadContent>
            <MultiFileUploadLabel>
              {label}
              {required && <FieldRequiredMark />}
            </MultiFileUploadLabel>
            <MultiFileUploadSummary />
          </MultiFileUploadContent>
          <MultiFileUploadTrigger
            ref={fieldRef}
            aria-invalid={isInvalid}
            aria-required={required || undefined}
            aria-describedby={describedBy}
          >
            {triggerLabel}
          </MultiFileUploadTrigger>
        </MultiFileUploadHeader>
        <MultiFileUploadList />
      </MultiFileUpload>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError id={errorId} errors={errors} />}
    </Field>
  )
}
