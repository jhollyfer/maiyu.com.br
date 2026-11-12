import { PlusIcon } from '@phosphor-icons/react'
import type * as React from 'react'

import { Button } from '#/components/ui/button'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '#/components/ui/field'
import { cn } from '#/lib/cn'
import { formatBytes } from '#/lib/i18n'
import { m } from '#/paraglide/messages'
import type { Merge } from '@maiyu/shared'

import { useMultiFileUploadContext } from './multi-file-upload-context'

/** The top strip: label, summary and the button that opens the picker. */
export function MultiFileUploadHeader({
  className,
  ...props
}: React.ComponentProps<typeof Field>): React.JSX.Element {
  return (
    <Field
      data-slot="multi-file-upload-header"
      orientation="horizontal"
      className={cn('justify-between border-b px-4 py-3', className)}
      {...props}
    />
  )
}

/** The left column, with the label above the summary. */
export function MultiFileUploadContent({
  className,
  ...props
}: React.ComponentProps<typeof FieldContent>): React.JSX.Element {
  return (
    <FieldContent
      data-slot="multi-file-upload-content"
      className={cn('min-w-0', className)}
      {...props}
    />
  )
}

/**
 * The field label.
 *
 * `htmlFor` points to the visible button and not to the hidden input: a label
 * pointing to a hidden element carries no focus.
 */
export function MultiFileUploadLabel({
  children = m.kit_upload_attachments(),
  ...props
}: React.ComponentProps<typeof FieldLabel>): React.JSX.Element {
  const { triggerId } = useMultiFileUploadContext('MultiFileUploadLabel')

  return (
    <FieldLabel
      data-slot="multi-file-upload-label"
      htmlFor={triggerId}
      {...props}
    >
      {children}
    </FieldLabel>
  )
}

/** How many uploaded, how much they weigh and how to attach. */
export function MultiFileUploadSummary(
  props: React.ComponentProps<typeof FieldDescription>,
): React.JSX.Element {
  const { items, completed, totalSize } = useMultiFileUploadContext(
    'MultiFileUploadSummary',
  )

  return (
    <FieldDescription data-slot="multi-file-upload-summary" {...props}>
      {m.kit_upload_summary({
        completed,
        total: items.length,
        size: formatBytes(totalSize),
      })}
    </FieldDescription>
  )
}

type MultiFileUploadTriggerProps = Merge<
  React.ComponentProps<typeof Button>,
  { children?: React.ReactNode }
>

/**
 * The button that opens the file picker. Without children it writes "Escolher
 * arquivos".
 */
export function MultiFileUploadTrigger({
  children = m.kit_upload_choose_files(),
  ...rest
}: MultiFileUploadTriggerProps): React.JSX.Element {
  const { openPicker, triggerId, inputId } = useMultiFileUploadContext(
    'MultiFileUploadTrigger',
  )

  return (
    <Button
      data-slot="multi-file-upload-trigger"
      id={triggerId}
      variant="outline"
      size="sm"
      type="button"
      aria-controls={inputId}
      onClick={openPicker}
      {...rest}
    >
      <PlusIcon />
      {children}
    </Button>
  )
}
