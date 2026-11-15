import type * as React from 'react'

import { useIsUploading } from '#/components/common/uploading-context/uploading-context'
import { Button } from '#/components/ui/button'
import { Spinner } from '#/components/ui/spinner'
import { m } from '#/paraglide/messages'
import type { Merge } from '@maiyu/shared'

type SubmitButtonProps = Merge<
  React.ComponentProps<typeof Button>,
  {
    /** Is the mutation in flight? Shows the spinner and locks the button. */
    readonly isPending?: boolean
    readonly children: React.ReactNode
  }
>

/**
 * The save button of every panel form.
 *
 * It exists for a single reason: it locks itself while an **upload** is in
 * progress. The attachment is sent when the file is chosen, and the form only learns
 * the `id` after the file exists - saving in the middle sends a payload without the
 * attachment, and the record is born without an image, with no error to give it away.
 *
 * A component and not two lines on each screen because there is one form per
 * resource - news, event, podcast, video, album, testimonial, user -, and
 * two lines repeated seven times are seven chances to forget on an eighth.
 */
export function SubmitButton({
  isPending,
  disabled,
  children,
  ...props
}: SubmitButtonProps): React.JSX.Element {
  const isUploading = useIsUploading()

  return (
    <Button
      type="submit"
      disabled={disabled || isPending || isUploading}
      {...props}
    >
      {isPending && <Spinner aria-label={m.kit_loading()} className="size-4" />}
      {children}
    </Button>
  )
}
