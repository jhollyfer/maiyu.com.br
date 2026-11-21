// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'

import { scrollFrameOf } from '#/lib/scroll-frame'

function mount(overflowY: string): {
  scroller: HTMLElement
  list: HTMLElement
} {
  const scroller = document.createElement('div')
  scroller.style.overflowY = overflowY
  const wrapper = document.createElement('div')
  const list = document.createElement('ul')
  wrapper.append(list)
  scroller.append(wrapper)
  document.body.append(scroller)

  return { scroller, list }
}

describe('scrollFrameOf', () => {
  it('finds the nearest ancestor that scrolls', () => {
    const { scroller, list } = mount('auto')

    expect(scrollFrameOf(list)?.scroller).toBe(scroller)
  })

  it('reports where the list starts inside the scroller', () => {
    const { scroller, list } = mount('scroll')
    scroller.scrollTop = 30

    // jsdom has no layout: both rects are at 0, so the offset is the scroll position.
    expect(scrollFrameOf(list)?.margin).toBe(30)
  })

  it('when nothing scrolls it, answers null and leaves the list to the page', () => {
    const { list } = mount('visible')

    expect(scrollFrameOf(list)).toBeNull()
  })
})
