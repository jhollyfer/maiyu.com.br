import { createLazyFileRoute } from '@tanstack/react-router'
import type * as React from 'react'

import { Home } from './-components/home/home'

export const Route = createLazyFileRoute('/_public/')({
  component: RouteComponent,
})

function RouteComponent(): React.JSX.Element {
  return <Home />
}
