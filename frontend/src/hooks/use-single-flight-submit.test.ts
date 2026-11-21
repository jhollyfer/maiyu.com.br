// @vitest-environment jsdom

import { renderHook } from '@testing-library/react'
import { fromPartial } from '@total-typescript/shoehorn'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { useSingleFlightSubmit } from './use-single-flight-submit'

function deferred() {
  let resolve: () => void = () => undefined
  const promise = new Promise<void>((done) => {
    resolve = done
  })

  return { promise, resolve }
}

describe('useSingleFlightSubmit', () => {
  it('blocks the second call of a double click while the first is in flight', async () => {
    const gate = deferred()
    const submit = vi.fn(() => gate.promise)
    const { result } = renderHook(() => useSingleFlightSubmit(submit))

    result.current()
    result.current()

    expect(submit).toHaveBeenCalledTimes(1)

    gate.resolve()
    await gate.promise
    await Promise.resolve()

    result.current()

    expect(submit).toHaveBeenCalledTimes(2)
  })

  it('still prevents the native submission of a blocked call', () => {
    const gate = deferred()
    const { result } = renderHook(() =>
      useSingleFlightSubmit(() => gate.promise),
    )
    const preventDefault = vi.fn()
    const event = fromPartial<React.BaseSyntheticEvent>({ preventDefault })

    result.current()
    result.current(event)

    expect(preventDefault).toHaveBeenCalledTimes(1)
  })
})
