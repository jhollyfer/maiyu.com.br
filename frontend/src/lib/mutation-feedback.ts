import type { QueryKey } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { MutationProps } from '#/integrations/tanstack-query/http'
import { notifyError } from '#/lib/form-errors'

export type WriteFeedbackOptions<TData, TPayload> = Readonly<{
  /** The key families the write makes stale, refetched before `isPending` goes false. */
  invalidate: ReadonlyArray<QueryKey>
  /** The success notice. A function when it cites the result ("3 arquivados"). */
  success: string | ((data: TData) => string)
  /** The sentence under the success title, when the notice needs one. */
  description?: string
  /** The id of the error notice, so consecutive attempts replace it instead of stacking. */
  errorId: string
  /**
   * Resends what failed. It becomes the "Tentar de novo" action, and only when the error is
   * retry-safe (`isRetrySafe`): the criterion of `applyMutationError` holds here too.
   */
  retry?: (payload: TPayload) => void
  /** What the screen does after the notice: close, navigate, move focus. */
  onDone?: (data: TData) => Promise<void> | void
}>

/**
 * The end of a write that is **not a form** (archive, restore, remove, send): invalidate, notify
 * success, and carry the API error to the one place that words it (`notifyError`).
 *
 * It returns the options the resource's mutation hook accepts (`MutationProps`), so the screen
 * writes `useArchiveUser(writeFeedback({ ... }))` and no `onSuccess` of its own. The `client` comes
 * from the callback context (`_doc-lib/tanstack-query.md#guides/mutations`: the fourth argument
 * is `{ client, meta, mutationKey }`), so there is no `useQueryClient()` in the caller.
 *
 * The invalidation is awaited (`#guides/invalidations-from-mutations`): `isPending` stays true
 * until the list is really new, and the confirm button does not release over stale data.
 *
 * A form uses `useMutationForm`, which carries the error to the fields before it falls back here.
 */
export function writeFeedback<TData, TPayload>({
  invalidate,
  success,
  description,
  errorId,
  retry,
  onDone,
}: WriteFeedbackOptions<TData, TPayload>): MutationProps<TData, TPayload> {
  return {
    async onSuccess(data, _payload, _onMutateResult, { client }) {
      await Promise.all(
        invalidate.map((queryKey) => client.invalidateQueries({ queryKey })),
      )

      let title: string
      if (typeof success === 'string') title = success
      else title = success(data)

      toast.success(title, { description })

      await onDone?.(data)
    },
    onError(error, payload) {
      let resend: (() => void) | undefined
      if (retry) resend = () => retry(payload)

      notifyError(error, { id: errorId, retry: resend })
    },
  }
}
