import { createLazyFileRoute } from '@tanstack/react-router'
import type * as React from 'react'

import { Career } from './-components/career'

export const Route = createLazyFileRoute('/_public/career/')({
  component: RouteComponent,
})

function RouteComponent(): React.JSX.Element {
  return <Career />
}
