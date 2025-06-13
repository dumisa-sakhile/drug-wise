import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/pricing')({
  component: Pricing,
})

function Pricing() {
  return (
    <>
      <title>Drug Wise - Pricing</title>
      <div className="w-full h-lvh flex flex-col items-center justify-center gap-4">
        <p>Pricing coming soon</p>
      </div>
    </>
  );
}
