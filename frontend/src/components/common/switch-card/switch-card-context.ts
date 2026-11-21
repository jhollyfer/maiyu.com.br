import * as React from 'react'

/** The ids that tie the switch to the words of its card. */
export type SwitchCardContextValue = {
  readonly titleId: string
  readonly descriptionId: string
  /** Called by the description part while it is mounted, so the switch is described only then. */
  readonly registerDescription: (id: string) => () => void
}

const SwitchCardContext = React.createContext<SwitchCardContextValue | null>(
  null,
)

export const SwitchCardProvider = SwitchCardContext.Provider

export function useSwitchCardContext(consumer: string): SwitchCardContextValue {
  const context = React.use(SwitchCardContext)

  if (!context) {
    throw new Error(`\`${consumer}\` must be used inside \`SwitchCard\``)
  }

  return context
}
