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
  Menu,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

// const ScrollAnimatedSection = ({ children }: { children: React.ReactNode }) => {
//   const ref = useRef(null);
//   const isInView = useInView(ref, {
//     once: false,
//     margin: "-500px 0px -500px 0px",
//     amount: 0.3,
//   });

//   return (
//     <motion.div
//       ref={ref}
//       initial={{ opacity: 0, y: 30 }}
//       animate={{ opacity: isInView ? 1 : 0.2, y: isInView ? 0 : 30 }}
//       transition={{
//         duration: 0.8,
//         ease: [0.4, 0, 0.2, 1],
//         delay: isInView ? 0.2 : 0,
//       }}>
//       {children}
//     </motion.div>
//   );
// };

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center  text-white">
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
    <main className="w-full min-h-screen  text-white roboto-regular">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed top-4 left-4 w-[260px] h-[calc(100%-32px)] flex-col rounded-3xl backdrop-blur-md bg-zinc-900/70 shadow-2xl border border-zinc-800">
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
          {[...navLinks, ...adminLinks].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 font-medium
                ${
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
            className="w-full flex items-center justify-center gap-3 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-all duration-200">
            <LogOut size={18} />
            Sign Out
          </button>
          <p className="text-xs text-center mt-4 text-zinc-500">
            © {new Date().getFullYear()} DrugWise.
          </p>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 z-40 w-full /80 backdrop-blur-lg border-b border-zinc-800 p-4 flex items-center justify-between shadow-sm">
        <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
          DrugWise
        </h1>
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-2 rounded-lg bg-zinc-800 text-gray-200 hover:text-white">
          <Menu size={24} />
        </button>
      </header>

      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsMobileSidebarOpen(false)}>
            <motion.aside
              className="absolute top-0 left-0 bottom-0 w-full max-w-[80%] bg-zinc-900 flex flex-col py-4 shadow-xl border-r border-zinc-800"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 flex items-center gap-4 border-b border-zinc-800">
                <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden object-cover border border-green-500">
                  <img
                    src={getProfileImage()}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <p className="text-white font-bold text-sm truncate">
                    {userData?.name || "User"}
                  </p>
                  <span className="text-xs text-gray-400 font-light truncate">
                    {userData?.email}
                  </span>
                </div>
              </div>

              <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {[...navLinks, ...adminLinks].map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 font-medium
                      ${
                        isActiveLink(link.to)
                          ? "bg-lime-400/20 text-lime-300 font-bold"
                          : "text-gray-300 hover:bg-zinc-800 hover:text-white"
                      }`}>
                    <link.icon
                      size={18}
                      className={
                        isActiveLink(link.to)
                          ? "text-lime-300"
                          : "text-gray-400"
                      }
                    />
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="p-4 border-t border-zinc-800">
                <button
                  onClick={() => {
                    auth.signOut();
                    toast.success("Logged out successfully!");
                    setIsMobileSidebarOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-all duration-200">
                  <LogOut size={18} />
                  Sign Out
                </button>
                <p className="text-xs text-center mt-4 text-zinc-500">
                  © {new Date().getFullYear()} DrugWise.
                </p>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="md:fixed md:top-0 md:left-[296px] w-full md:w-[calc(100%-296px)] h-screen md:h-screen overflow-y-auto px-4 md:px-6 py-8 md:pt-10">
        {/* <ScrollAnimatedSection> */}
          <Outlet />
        {/* </ScrollAnimatedSection> */}
      </motion.section>
    </main>
  );
}

export default DashboardLayout;
