import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/messages')({
  component: Messages,
})

function Messages() {
  return <div>Hello "/dashboard/messages"!</div>
}
