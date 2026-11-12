import type * as React from 'react'

import { Toaster } from '#/components/ui/sonner'

import { useTheme } from './theme-context'

/** The toaster in the chosen theme: `ui/sonner` has no hook of the app, so the theme comes in as a prop. */
export function ThemeProviderToaster(): React.JSX.Element {
  const { theme } = useTheme('ThemeProviderToaster')

  return <Toaster theme={theme} />
}
