import { createLazyFileRoute } from '@tanstack/react-router'
import type * as React from 'react'

import { Portfolio } from './-components/portfolio'

export const Route = createLazyFileRoute('/_public/portfolio/')({
  component: RouteComponent,
})

function RouteComponent(): React.JSX.Element {
  return <Portfolio />
}
