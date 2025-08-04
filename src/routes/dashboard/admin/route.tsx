import {
  createFileRoute,
  Outlet,
  Link,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import { auth, db } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

export const Route = createFileRoute("/dashboard/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        toast.error("You must be logged in to access admin.");
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
      if (!user || !user.uid) return null;
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
      <div className="flex items-center justify-center min-h-screen text-white">
        <div className="text-lg font-medium">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white px-4 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold mb-8 text-center sm:text-left bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
        </div>

        {/* Warning for small screens */}
        {isSmallScreen && (
          <div className="bg-yellow-500 text-black p-4 rounded-lg text-center font-regular">
            For the best experience, please use a larger screen to access the
            admin page.
          </div>
        )}

        {/* Tabs */}
        <nav className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-2 flex gap-2 w-full sm:max-w-md">
          {tabs.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`t flex-1 text-center text-sm font-medium px-4 py-2 rounded-lg transition-all
                ${
                  isActive(to)
                    ? "bg-white/10 text-white shadow-inner backdrop-blur-md border border-white/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }
              `}>
              {label}
            </Link>
          ))}
        </nav>

        {/* Content */}
        <main className="rounded-xl p-4 shadow-inner min-h-[400px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}