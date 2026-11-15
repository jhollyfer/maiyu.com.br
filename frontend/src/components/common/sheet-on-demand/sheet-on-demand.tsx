import { lazy, Suspense, useRef, useState } from 'react'

import { Button } from '#/components/ui/button'

export type SheetOnDemandPanelProps = {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  /** The button that opened the panel: focus goes back to it on close (`finalFocus`). */
  readonly returnFocusTo: React.RefObject<HTMLButtonElement | null>
}

type LoadPanel = () => Promise<{
  default: React.ComponentType<SheetOnDemandPanelProps>
}>

export type SheetPanel = {
  readonly Component: React.LazyExoticComponent<
    React.ComponentType<SheetOnDemandPanelProps>
  >
  readonly preload: () => void
}

/**
 * Wraps the literal `import()` of the panel module. Call it at module level, never in render: the
 * `lazy` component must keep its identity (`react-hooks/static-components`).
 */
export function sheetPanel(loadPanel: LoadPanel): SheetPanel {
  return { Component: lazy(loadPanel), preload: () => void loadPanel() }
}

type SheetOnDemandProps = {
  /** Icon inside the button. */
  readonly icon: React.ReactNode
  /** Accessible name of the button (it has no visible text). */
  readonly label: string
  /** The panel from `sheetPanel(() => import(...))`, made at module level. */
  readonly panel: SheetPanel
  readonly className?: string
}

/**
 * A button that opens a `Sheet` whose code is fetched on the first hover, focus or touch of the
 * button, or on the click if none came before, and never in the first load
 * (`_standards/frontend.md` §9.4, `lazy` + `Suspense` on the gesture, no fallback: the panel is
 * an overlay, nothing to hold the place of; `_doc-lib/base-ui.md#react/components/dialog`).
 * `open` stays on the button so the panel animates out before it unmounts, and focus goes back to
 * the button through `returnFocusTo`/`finalFocus`.
 */
export function SheetOnDemand({
  icon,
  label,
  panel,
  className,
}: SheetOnDemandProps): React.JSX.Element {
  const [requested, setRequested] = useState(false)
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  return (
    <>
      <Button
        ref={triggerRef}
        variant="outline"
        size="icon-lg"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={className}
        onPointerEnter={panel.preload}
        onFocus={panel.preload}
        onTouchStart={panel.preload}
        onClick={() => {
          setRequested(true)
          setOpen(true)
        }}
      >
        {icon}
      </Button>
      {requested && (
        <Suspense fallback={null}>
          <panel.Component
            open={open}
            onOpenChange={setOpen}
            returnFocusTo={triggerRef}
          />
        </Suspense>
      )}
    </>
  )
}
