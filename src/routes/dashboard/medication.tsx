import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/medication')({
  component: Medication,
})

function Medication() {
  return <div>Hello "/dashboard/medication"!</div>
}
