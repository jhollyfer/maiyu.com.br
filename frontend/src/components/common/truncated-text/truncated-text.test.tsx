// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '#/components/ui/tooltip'

import { TruncatedText } from './truncated-text'

const LONG = 'Rua das Palmeiras, 1280, bloco B, apartamento 302, Centro'

type Callback = () => void
let callbacks: Array<Callback> = []
let cut = false

function scrollHeight(): number {
  if (cut) return 40
  return 20
}

class FakeResizeObserver {
  private readonly callback: Callback

  constructor(callback: Callback) {
    this.callback = callback
  }

  // Floating UI observes its own elements too: only the text's observer is the one under test.
  observe(target: Element): void {
    if (target.getAttribute('data-slot') === 'truncated-text') {
      callbacks.push(this.callback)
    }
  }

  disconnect(): void {}
}

beforeEach(() => {
  callbacks = []
  cut = false
  vi.stubGlobal('ResizeObserver', FakeResizeObserver)
  // jsdom does no layout: the "cut" is whatever the test says the browser measured.
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(
    () => scrollHeight(),
  )
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(
    () => 20,
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function measure(): void {
  act(() => {
    for (const callback of callbacks) callback()
  })
}

function Screen({ lines }: Readonly<{ lines?: 1 | 2 | 3 | 4 }>) {
  return (
    <TooltipProvider>
      <TruncatedText value={LONG} lines={lines} />
    </TooltipProvider>
  )
}

describe('TruncatedText', () => {
  it('cuts with CSS and keeps the whole string in the DOM', () => {
    const { container } = render(<Screen lines={2} />)
    const text = container.querySelector('[data-slot="truncated-text"]')

    expect(text?.className).toContain('line-clamp-2')
    expect(text?.textContent).toBe(LONG)
  })

  it('a text that fits is a plain span with no tab stop and no button', () => {
    render(<Screen />)
    measure()

    expect(screen.queryByRole('button')).toBeNull()
  })

  it('a text the browser cut is reachable by keyboard and shows the whole text on focus', async () => {
    const user = userEvent.setup()
    render(<Screen />)
    cut = true
    measure()

    await user.tab()
    const button = screen.getByRole('button', { name: LONG })

    expect(document.activeElement).toBe(button)
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect((await screen.findAllByText(LONG)).length).toBeGreaterThan(1)
  })

  it('pressing the button expands the text in place and again collapses it', async () => {
    const user = userEvent.setup()
    const { container } = render(<Screen />)
    cut = true
    measure()

    const button = screen.getByRole('button', { name: LONG })
    await user.click(button)

    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(
      container.querySelector('[data-slot="truncated-text"]')?.className,
    ).toContain('line-clamp-none')

    // Expanded, the text no longer overflows, and the button stays to collapse it.
    cut = false
    measure()
    await user.click(screen.getByRole('button', { name: LONG }))

    // Collapsed, the box is cut again and the observer reports it.
    cut = true
    measure()

    expect(
      screen.getByRole('button', { name: LONG }).getAttribute('aria-expanded'),
    ).toBe('false')
    expect(
      container.querySelector('[data-slot="truncated-text"]')?.className,
    ).not.toContain('line-clamp-none')
  })

  it('has no axe violation cut or not', async () => {
    const { container } = render(<Screen />)
    expect((await axe.run(container)).violations).toEqual([])

    cut = true
    measure()
    expect((await axe.run(container)).violations).toEqual([])
  })
})
