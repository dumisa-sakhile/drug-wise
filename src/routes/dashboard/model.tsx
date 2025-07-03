import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/model')({
  component: Model,
})

function Model() {
  return <div>Hello "/dashboard/model"!</div>
}
