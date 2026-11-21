// @vitest-environment jsdom

import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  focusAfterRemoval,
  neighbourRowActions,
  TABLE_FOCUS_FALLBACK,
} from './focus-after-removal'

function Rows() {
  return (
    <table>
      <tbody>
        <tr>
          <td>
            <button id="a-actions" data-row-actions="">
              a
            </button>
          </td>
        </tr>
        <tr>
          <td>
            <button id="b-actions" data-row-actions="">
              b
            </button>
          </td>
        </tr>
        <tr>
          <td>
            <button id="c-actions" data-row-actions="">
              c
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('neighbourRowActions', () => {
  it('is the trigger of the row below', () => {
    render(<Rows />)

    expect(neighbourRowActions(document.getElementById('a-actions'))?.id).toBe(
      'b-actions',
    )
  })

  it('is the trigger of the row above on the last row', () => {
    render(<Rows />)

    expect(neighbourRowActions(document.getElementById('c-actions'))?.id).toBe(
      'b-actions',
    )
  })

  it('is null without a neighbour, or without an origin', () => {
    render(
      <table>
        <tbody>
          <tr>
            <td>
              <button id="only" data-row-actions="">
                x
              </button>
            </td>
          </tr>
        </tbody>
      </table>,
    )

    expect(neighbourRowActions(document.getElementById('only'))).toBeNull()
    expect(neighbourRowActions(null)).toBeNull()
  })
})

describe('focusAfterRemoval', () => {
  it('focuses the target when it is still in the document', () => {
    render(
      <div>
        <button id="target">x</button>
        <div data-slot="table" role="region" aria-label="lista" tabIndex={0} />
      </div>,
    )

    focusAfterRemoval(document.getElementById('target'))
    vi.advanceTimersToNextFrame()

    expect(document.activeElement?.id).toBe('target')
  })

  it('falls back to the list when the target left with the removed row', () => {
    render(
      <div
        id="list"
        data-slot="table"
        role="region"
        aria-label="lista"
        tabIndex={0}
      />,
    )
    const gone = document.createElement('button')

    focusAfterRemoval(gone, TABLE_FOCUS_FALLBACK)
    vi.advanceTimersToNextFrame()

    expect(document.activeElement?.id).toBe('list')
  })

  it('keeps trying while the next screen has not mounted yet', () => {
    focusAfterRemoval(null, '#late')
    vi.advanceTimersToNextFrame()
    expect(document.activeElement).toBe(document.body)

    render(<div id="late" tabIndex={-1} />)
    vi.advanceTimersToNextFrame()

    expect(document.activeElement?.id).toBe('late')
  })
})
