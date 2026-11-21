// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MD_BREAKPOINT, useIsBelow } from './use-is-below'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useIsBelow', () => {
  it('is true below the breakpoint and false from it', () => {
    vi.stubGlobal('innerWidth', MD_BREAKPOINT - 1)
    const { result } = renderHook(() => useIsBelow(MD_BREAKPOINT))
    expect(result.current).toBe(true)

    vi.stubGlobal('innerWidth', MD_BREAKPOINT)
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current).toBe(false)
  })
})
