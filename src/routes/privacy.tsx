import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/privacy')({
  component: Privacy,
})

function Privacy() {
  return (
    <>
      <title>Drug Wise - Privacy</title>
      <div className="w-full h-lvh flex flex-col items-center justify-center gap-4">
        <p>Privacy coming soon</p>
      </div>
    </>
  );
}
