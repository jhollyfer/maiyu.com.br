// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { m } from '#/paraglide/messages'

import { ExportCsvButton } from './export-csv-button'

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}))

const saved: Array<Blob> = []

beforeEach(() => {
  saved.length = 0
  // jsdom has no object URLs: the double records what would have been downloaded.
  Object.assign(URL, {
    createObjectURL: (blob: Blob): string => {
      saved.push(blob)
      return 'blob:test'
    },
    revokeObjectURL: vi.fn(),
  })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

const ROWS = [
  ['Nome', 'Quantia'],
  ['=HYPERLINK("http://evil.test")', 2],
  ['Ana', -3],
]

describe('ExportCsvButton', () => {
  it('downloads the rows as CSV with the formula neutralised and tells the count', async () => {
    const source = vi.fn().mockResolvedValue(ROWS)
    render(<ExportCsvButton source={source} filename="pedidos.csv" />)

    await userEvent.click(
      screen.getByRole('button', { name: m.kit_csv_export() }),
    )

    await waitFor(() => expect(saved).toHaveLength(1))
    const text = await saved[0]?.text()

    expect(text).toContain(`"'=HYPERLINK(""http://evil.test"")",2`)
    expect(text).toContain('Ana,-3')
    expect(toast.success).toHaveBeenCalledWith(m.kit_csv_exported({ count: 2 }))
  })

  it('runs one export at a time and shows the wait on the button', async () => {
    let finish: (rows: typeof ROWS) => void = () => {}
    const source = vi.fn().mockImplementation(
      () =>
        new Promise<typeof ROWS>((resolve) => {
          finish = resolve
        }),
    )
    render(<ExportCsvButton source={source} filename="pedidos.csv" />)

    const button = screen.getByRole('button', { name: m.kit_csv_export() })
    await userEvent.dblClick(button)

    expect(source).toHaveBeenCalledTimes(1)
    expect(button.getAttribute('aria-busy')).toBe('true')
    expect(button.hasAttribute('disabled')).toBe(true)

    finish(ROWS)
    await waitFor(() => expect(button.getAttribute('aria-busy')).toBe('false'))
  })

  it('a failure becomes the error notice and releases the button', async () => {
    const source = vi.fn().mockRejectedValue(new Error('boom'))
    render(<ExportCsvButton source={source} filename="pedidos.csv" />)

    const button = screen.getByRole('button', { name: m.kit_csv_export() })
    await userEvent.click(button)

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1))
    expect(saved).toHaveLength(0)
    await waitFor(() => expect(button.hasAttribute('disabled')).toBe(false))
  })

  it('takes its own label and has no axe violation', async () => {
    const { container } = render(
      <ExportCsvButton
        source={() => Promise.resolve(ROWS)}
        filename="pedidos.csv"
      >
        Baixar pedidos
      </ExportCsvButton>,
    )

    expect(
      screen.getByRole('button', { name: 'Baixar pedidos' }),
    ).not.toBeNull()
    expect((await axe.run(container)).violations).toEqual([])
  })
})
