import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/terms')({
  component: Terms,
})

function Terms() {
  return (
    <>
      <title>Drug Wise - Terms</title>
      <div className="w-full h-lvh flex flex-col items-center justify-center gap-4">
        <p>Terms coming soon</p>
      </div>
    </>
  );
}
