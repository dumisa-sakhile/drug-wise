import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import Header from "@/components/Header";

export const Route = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
      <TanStackRouterDevtools />
    </Layout>
  ),
});

type LayoutProps = {
  children?: React.ReactNode;
};

function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-inherit text-gray-200 bg-grid-pattern">
      <Header />
      <main className="pt-16 py-6 px-4 max-w-6xl mx-auto">
        {/* Outlet renders child routes here with proper spacing */}
        {children}
      </main>
    </div>
  );
}
