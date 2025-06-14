import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import Header from "@/components/Header";
import { motion } from "framer-motion";

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
      {/* Footer */}
      <motion.footer
        className="max-w-6xl mx-auto py-6 px-6 text-center bg-inherit text-gray-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}>
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
        <div className="relative z-10">
          <p className="text-sm mb-2">
            &copy; {new Date().getFullYear()} DrugWise. All rights reserved.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/privacy" className="hover:text-white transition">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-white transition">
              Terms of Service
            </Link>
            <Link to="/pricing" className="hover:text-white transition">
              Pricing
            </Link>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
