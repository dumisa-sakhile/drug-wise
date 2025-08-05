import {
  createFileRoute,
  Outlet,
  Link,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "@/config/firebase";
import type { User } from "firebase/auth";

export const Route = createFileRoute("/dashboard/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        toast.error("You must be logged in to access the admin panel.");
        navigate({ to: "/auth" });
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const { data: userData, isLoading } = useQuery({
    queryKey: ["adminUserData", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      const docSnap = await getDoc(doc(db, "users", user.uid));
      return docSnap.exists() ? docSnap.data() : null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!isLoading && userData && !userData.isAdmin) {
      toast.error("Access denied: Admins only.");
      navigate({ to: "/dashboard" });
    }
  }, [userData, isLoading, navigate]);

  const tabs = useMemo(
    () => [
      { to: "/dashboard/admin", label: "Users" },
      { to: "/dashboard/admin/messages", label: "Messages" },
      { to: "/dashboard/admin/medication", label: "Medication" },
    ],
    []
  );

  const isActive = useCallback(
    (path: string) =>
      location.pathname === path ||
      (path === "/dashboard/admin" &&
        location.pathname === "/dashboard/admin/"),
    [location.pathname]
  );

  if (isLoading || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen  text-white">
        <div className="flex flex-col items-center">
          {/* Green loader with a more defined style */}
          <div className="relative">
            <motion.div
              className="w-16 h-16 border-4 border-green-500 rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-0 w-16 h-16 border-4 border-t-transparent border-b-transparent border-l-transparent border-r-green-500 rounded-full animate-spin-slow"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-0 w-16 h-16 border-4 border-b-transparent border-l-transparent border-r-transparent border-t-green-500 rounded-full animate-spin"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            />
          </div>

          <motion.p
            className="mt-6 text-lg font-medium text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}>
            Loading admin panel...
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isSmallScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="bg-zinc-900 border border-zinc-700 text-white rounded-xl shadow-2xl p-8 max-w-sm mx-4 text-center">
              <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
                Larger Screen Required
              </h2>
              <p className="text-zinc-300 mb-6">
                The admin dashboard is optimized for a larger screen experience.
                Please switch to a desktop or tablet for full access.
              </p>
              <div className="flex justify-center gap-4">
                <Link
                  to="/dashboard"
                  className="bg-lime-500 text-black font-semibold py-2 px-4 rounded-lg hover:bg-lime-400 transition-colors">
                  Go to Dashboard
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen  text-white p-6 md:p-10 roboto-regular">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-10 text-center md:text-left">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
          </header>
          {/* Tabs */}
          <nav className="mb-10">
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-2 flex flex-col sm:flex-row gap-2 w-full sm:max-w-xl mx-auto md:mx-0">
              {tabs.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex-1 text-center text-sm font-medium px-4 py-2 rounded-lg transition-all
                    ${
                      isActive(to)
                        ? "bg-white/10 text-white shadow-inner backdrop-blur-md border border-white/20"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }
                  `}>
                  {label}
                </Link>
              ))}
            </div>
          </nav>
          {/* Content */}
          <main className=" min-h-[400px]">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
