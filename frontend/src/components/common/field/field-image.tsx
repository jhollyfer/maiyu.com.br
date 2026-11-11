import { ImageField } from '#/components/common/image-field/image-field'
import {
  ImageFieldActions,
  ImageFieldContent,
  ImageFieldDescription,
  ImageFieldRemove,
  ImageFieldUpload,
} from '#/components/common/image-field/image-field-actions'
import { ImageFieldPreview } from '#/components/common/image-field/image-field-preview'
import { Field, FieldError, FieldLabel } from '#/components/ui/field'
import { useFieldValidation } from '#/integrations/react-hook-form/use-field-validation'
import type { StorageMimetype } from '@maiyu/shared'

import { FieldRequiredMark } from './field-required-mark'

type FieldImageProps = {
  readonly label: string
  /** The text of the button that opens the picker: "Enviar avatar", "Foto do depoimento". */
  readonly uploadLabel: string
  /** Without it, the line lists the `ImageField` default formats. */
  readonly description?: React.ReactNode
  readonly required?: boolean
  /** The square preview; without it the field shows only the buttons (an audio file). */
  readonly preview?: {
    readonly alt: string
    readonly fallback: React.ReactNode
  }
  readonly previewUrl?: string | null
  readonly accept?: ReadonlyArray<StorageMimetype>
  /** I/O by prop (`KIT.md` §1, rule 7): usually `storageCreate.mutateAsync`. */
  readonly upload: (
    file: File,
    signal: AbortSignal,
  ) => Promise<{ readonly id: string; readonly url: string }>
  readonly discard?: (storageId: string) => Promise<unknown>
}

/**
 * `ImageField` bound to `AppField`: the form keeps the storage `id` (or `null`).
 *
 * `field.ref` goes on the upload button, the only focusable element, so a
 * submit with the field invalid focuses it
 * (`_doc-lib/react-hook-form.md#docs/usecontroller/controller`,
 * https://react-hook-form.com/docs/usecontroller/controller).
 */
export function FieldImage({
  label,
  uploadLabel,
  description,
  required,
  preview,
  previewUrl,
  accept,
  upload,
  discard,
}: FieldImageProps): React.JSX.Element {
  const { field, isInvalid, errors, errorId, describedBy } = useFieldValidation<
    string | null
  >('FieldImage')
  const { ref: fieldRef } = field

  return (
    <Field data-slot="field-image" data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && <FieldRequiredMark />}
      </FieldLabel>
      <ImageField
        id={field.name}
        value={field.value ?? null}
        onValueChange={(storageId) => {
          field.onChange(storageId)
          // Picking a file is the whole interaction: without the touch,
          // `mode: 'onTouched'` never validates a field that has no blur of its own.
          field.onBlur()
        }}
        previewUrl={previewUrl}
        accept={accept}
        upload={upload}
        discard={discard}
      >
        {preview && (
          <ImageFieldPreview alt={preview.alt}>
            {preview.fallback}
          </ImageFieldPreview>
        )}
        <ImageFieldContent>
          <ImageFieldActions>
            <ImageFieldUpload
              ref={fieldRef}
              aria-invalid={isInvalid}
              aria-required={required || undefined}
              aria-describedby={describedBy}
            >
              {uploadLabel}
            </ImageFieldUpload>
            <ImageFieldRemove />
          </ImageFieldActions>
          <ImageFieldDescription>{description}</ImageFieldDescription>
        </ImageFieldContent>
      </ImageField>
      {isInvalid && <FieldError id={errorId} errors={errors} />}
    </Field>
  )
}
