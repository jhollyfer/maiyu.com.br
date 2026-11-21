import type * as React from 'react'

import { useSingleFlight } from '#/components/common/confirm-dialog/use-open-on-request'

/**
 * A form's submit that runs one at a time.
 *
 * The double click starts both submits before the render that turns `isPending` on, because
 * `handleSubmit` validates asynchronously first: a guard on the rendered value let the second
 * request through. The gate of `useSingleFlight` is a ref, closed synchronously on the first
 * call and released when the submit settles, and a blocked call still stops the native
 * submission of the `<form>`.
 *
 * (`_doc-lib/tanstack-query.md#guides/mutations`: a mutation has no retry by default, since
 * repeating a write may duplicate the record; this is the same care one step earlier.)
 */
export function useSingleFlightSubmit(
  submit: (event?: React.BaseSyntheticEvent) => Promise<void>,
): (event?: React.BaseSyntheticEvent) => void {
  const singleFlight = useSingleFlight()

  return function guarded(event) {
    event?.preventDefault()

    singleFlight((release) => {
      void submit(event).finally(release)
    })
  }
}
