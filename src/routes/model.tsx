import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/model')({
  component: Model,
})

function Model() {
  return (
    <>
      <title>Drug Wise - Model</title>
      <div className="w-full h-lvh flex flex-col items-center justify-center gap-4">
        <p>Model coming soon</p>
      </div>
    </>
  );
}
