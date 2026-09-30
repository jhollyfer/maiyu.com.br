import type * as React from 'react'
import { createLazyFileRoute } from '@tanstack/react-router'

import { Home } from './-components/home'

export const Route = createLazyFileRoute('/_public/')({
  component: RouteComponent,
})

function RouteComponent(): React.JSX.Element {
  return <Home />
}
