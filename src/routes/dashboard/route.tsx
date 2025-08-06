import {
  createFileRoute,
  Outlet,
  Link,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { auth, db } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import {
  MessagesSquare,
  Pill,
  Bot,
  User,
  LogOut,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import male from "/male.jpg?url";
import female from "/female.jpg?url";

interface UserData {
  uid: string;
  email: string;
  isAdmin: boolean;
  name?: string;
  photoURL?: string;
  gender?: string; // 'male' or 'female'
}

const fetchUserData = async (uid: string): Promise<UserData> => {
  const userDocRef = doc(db, "users", uid);
  const userDocSnap = await getDoc(userDocRef);
  if (userDocSnap.exists()) {
    return userDocSnap.data() as UserData;
  }
  return { uid, email: "", isAdmin: false };
};

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate({ to: "/auth" });
      } else {
        setFirebaseUser(user);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const { data: userData, isLoading: isLoadingUserData } = useQuery<UserData>({
    queryKey: ["layoutUserData", firebaseUser?.uid],
    queryFn: () => fetchUserData(firebaseUser!.uid),
    enabled: !!firebaseUser,
  });

  if (!firebaseUser || isLoadingUserData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}>
          <div className="relative w-20 h-20">
            <motion.div
              className="absolute inset-0 w-full h-full border-4 border-t-transparent border-lime-400 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-0 w-full h-full border-4 border-b-transparent border-green-500 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
          </div>
          <p className="mt-6 text-lg font-medium text-gray-400">
            Loading your dashboard...
          </p>
        </motion.div>
      </div>
    );
  }

  const navLinks = [
    { to: "/dashboard", label: "Profile", icon: User },
    { to: "/dashboard/messages", label: "Messages", icon: MessagesSquare },
    { to: "/dashboard/medication", label: "Medication", icon: Pill },
    { to: "/dashboard/model", label: "AI Chatbot", icon: Bot },
  ];

  const adminLinks = userData?.isAdmin
    ? [{ to: "/dashboard/admin", label: "Admin", icon: Shield }]
    : [];

  const allLinks = [...navLinks, ...adminLinks];

  const isActiveLink = (to: string) => {
    if (to === "/dashboard/admin") {
      return location.pathname.startsWith(to);
    }
    return location.pathname === to;
  };

  const getProfileImage = () => {
    if (firebaseUser?.photoURL) {
      return firebaseUser.photoURL;
    }
    if (userData?.photoURL) {
      return userData.photoURL;
    }
    return userData?.gender === "female" ? female : male;
  };

  return (
    <main className="w-full min-h-screen  text-zinc-50 outfit-regular">
      {/* Desktop Sidebar */}
      <aside
        style={{ borderRadius: "12px" }}
        className="hidden md:flex fixed top-4 left-4 w-[260px] h-[calc(100%-32px)] flex-col rounded-xl bg-zinc-900 shadow-2xl border border-zinc-800">
        <div className="px-6 pt-6 pb-4 flex items-center gap-4 border-b border-zinc-800">
          <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden object-cover border border-green-500 flex-shrink-0">
            <img
              src={getProfileImage()}
              alt="User"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col overflow-hidden">
            <p className="text-white font-bold text-sm truncate">
              {userData?.name || "User"}
            </p>
            <span className="text-xs text-gray-400 font-light truncate">
              {userData?.email}
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {allLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={{ borderRadius: "9px" }}
              className={`flex items-center gap-3 px-3 py-2 text-sm transition-all duration-200 font-medium ${
                isActiveLink(link.to)
                  ? "bg-lime-400/20 text-lime-300 font-bold"
                  : "text-gray-300 hover:bg-zinc-800 hover:text-white"
              }`}>
              <link.icon
                size={18}
                className={
                  isActiveLink(link.to) ? "text-lime-300" : "text-gray-400"
                }
              />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="font-light p-4 border-t border-zinc-800">
          <button
            onClick={() => {
              auth.signOut();
              toast.success("Logged out successfully!");
            }}
            style={{ borderRadius: "9px" }}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 text-sm font-regular text-black bg-red-600 hover:bg-red-700 transition-all duration-200">
            <LogOut size={18} />
            Sign Out
          </button>
          <p className="text-xs text-center mt-4 text-zinc-500">
            © {new Date().getFullYear()} DrugWise.
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="md:fixed md:top-0 md:left-[296px] w-full md:w-[calc(100%-296px)] h-screen md:h-screen overflow-y-auto pt- px-4 md:px-6 py-8 pb-20">
        <Outlet />
      </motion.section>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        style={{ borderRadius: "12px" }}
        className="fixed top-4 left-4 right-4 z-40 md:hidden flex items-center justify-around bg-zinc-900/80 backdrop-blur-md border border-zinc-800 shadow-lg p-2 rounded-xl">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            style={{ borderRadius: "9px" }}
            className={`flex flex-col items-center justify-center p-2 text-xs transition-all duration-200 ${
              isActiveLink(link.to)
                ? "text-lime-300 font-bold bg-lime-400/20"
                : "text-gray-400 hover:text-white"
            }`}>
            <link.icon
              size={20}
              className={
                isActiveLink(link.to) ? "text-lime-300" : "text-gray-400"
              }
            />
            <span className="mt-1">{link.label}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}

export default DashboardLayout;
