import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_public/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_public/"!</div>
}
