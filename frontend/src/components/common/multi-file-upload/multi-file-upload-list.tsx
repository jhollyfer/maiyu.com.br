import {
  ArrowClockwiseIcon,
  CheckCircleIcon,
  FileTextIcon,
  ImageIcon,
  VideoCameraIcon,
  WarningIcon,
  XIcon,
} from '@phosphor-icons/react'
import type * as React from 'react'

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '#/components/ui/attachment'
import { Progress } from '#/components/ui/progress'
import { Spinner } from '#/components/ui/spinner'
import { cn } from '#/lib/cn'
import { formatBytes } from '#/lib/i18n'
import { m } from '#/paraglide/messages'

import type { UploadStatus } from './multi-file-upload-context'
import { useMultiFileUploadContext } from './multi-file-upload-context'

const attachmentStateByStatus: Record<
  UploadStatus,
  'uploading' | 'done' | 'error'
> = {
  pending: 'uploading',
  uploading: 'uploading',
  complete: 'done',
  error: 'error',
  cancelled: 'error',
}

function getFileIcon(mime: string): React.JSX.Element {
  if (mime.startsWith('image/')) return <ImageIcon />
  if (mime.startsWith('video/')) return <VideoCameraIcon />
  return <FileTextIcon />
}

/**
 * The drawn queue.
 *
 * A single part, not one `MultiFileUploadItem` per row: the rows come from a
 * loop over internal state, not from a slot - same design as `TableGrid`.
 * An empty queue draws nothing, not even the frame.
 */
export function MultiFileUploadList(
  props: React.ComponentProps<'div'>,
): React.JSX.Element | null {
  const { items, removeItem, retryItem } = useMultiFileUploadContext(
    'MultiFileUploadList',
  )

  if (items.length === 0) return null

  return (
    <div data-slot="multi-file-upload-list" {...props}>
      {items.map((item, index) => {
        // `cancelled` also falls here, and shows the size like the completed one:
        // the row only leaves the list when it is removed.
        const inFlight =
          item.status === 'pending' || item.status === 'uploading'
        const failed = item.status === 'error'

        return (
          <Attachment
            key={item.id}
            state={attachmentStateByStatus[item.status]}
            className={cn(
              'w-full rounded-none border-0',
              index < items.length - 1 && 'border-b',
            )}
          >
            <AttachmentMedia>
              {inFlight && <Spinner aria-label={m.kit_loading()} />}
              {failed && <WarningIcon className="text-destructive" />}
              {item.status === 'complete' && getFileIcon(item.mime)}
            </AttachmentMedia>

            <AttachmentContent>
              <AttachmentTitle>{item.name}</AttachmentTitle>
              {inFlight && (
                <div className="mt-1 flex items-center gap-2">
                  <Progress value={item.progress} className="flex-1" />
                  <span className="text-muted-foreground text-caption tabular-nums">
                    {item.progress}%
                  </span>
                </div>
              )}
              {failed && (
                <AttachmentDescription>
                  {m.kit_upload_failed()}
                </AttachmentDescription>
              )}
              {!inFlight && !failed && (
                <AttachmentDescription>
                  {formatBytes(item.size)}
                </AttachmentDescription>
              )}
            </AttachmentContent>

            <AttachmentActions>
              {item.status === 'complete' && (
                <CheckCircleIcon className="size-4 text-success-foreground" />
              )}
              {failed && (
                <AttachmentAction
                  type="button"
                  aria-label={m.kit_upload_retry_item({ name: item.name })}
                  onClick={() => retryItem(item.id)}
                >
                  <ArrowClockwiseIcon />
                </AttachmentAction>
              )}
              <AttachmentAction
                type="button"
                aria-label={m.kit_upload_remove_item({ name: item.name })}
                onClick={() => removeItem(item.id)}
              >
                <XIcon />
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
        )
      })}
    </div>
  )
}
