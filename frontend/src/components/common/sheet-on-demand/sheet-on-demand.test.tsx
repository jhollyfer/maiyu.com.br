// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  SheetOnDemand,
  sheetPanel,
  type SheetOnDemandPanelProps,
} from '#/components/common/sheet-on-demand/sheet-on-demand'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'

function Panel({
  open,
  onOpenChange,
  returnFocusTo,
}: SheetOnDemandPanelProps): React.JSX.Element {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent finalFocus={returnFocusTo}>
        <SheetHeader>
          <SheetTitle>Painel</SheetTitle>
          <SheetDescription>Conteudo</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  )
}

const loadPanel = vi.fn(async () => ({ default: Panel }))
const panel = sheetPanel(loadPanel)

const setup = () => {
  loadPanel.mockClear()
  render(<SheetOnDemand icon={<i />} label="Abrir" panel={panel} />)
  return { loadPanel, user: userEvent.setup() }
}

describe('SheetOnDemand', () => {
  it('renders only the button until the gesture', () => {
    const { loadPanel } = setup()

    expect(screen.getByRole('button', { name: 'Abrir' })).toBeTruthy()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(loadPanel).not.toHaveBeenCalled()
  })

  it('warms the import on hover', async () => {
    const { loadPanel, user } = setup()

    await user.hover(screen.getByRole('button', { name: 'Abrir' }))

    expect(loadPanel).toHaveBeenCalled()
  })

  it('opens on click and gives focus back to the button on Escape', async () => {
    const { user } = setup()
    const button = screen.getByRole('button', { name: 'Abrir' })

    await user.click(button)
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
    expect(document.activeElement).toBe(button)
  })
})
