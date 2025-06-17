import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { auth } from "../config/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import male from "/male.jpg?url";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Home, Info, DollarSign, Brain } from "lucide-react";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<null | {
    uid: string;
    displayName?: string;
    photoURL?: string;
  }>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(
        currentUser
          ? {
              uid: currentUser.uid,
              displayName: currentUser.displayName ?? undefined,
              photoURL: currentUser.photoURL ?? undefined,
            }
          : null
      );
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      toast.success("Logged out successfully");
      navigate({ to: "/auth" });
    } catch (error) {
      toast.error("Logout failed");
      console.error("Logout failed:", error);
    }
  };

  const getFallbackImage = () => {
    return user?.photoURL || male;
  };

  const handleSignOutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmLogout = () => {
    handleLogout();
    setShowConfirm(false);
  };

  const handleCancelLogout = () => {
    setShowConfirm(false);
  };

  const navLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/about", label: "About", icon: Info },
    { to: "/pricing", label: "Pricing", icon: DollarSign },
    { to: "/model", label: "Model", icon: Brain },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="w-full h-16 bg-[#141414] flex items-center px-4 sm:px-6 fixed top-0 left-0 z-50">
        <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
          <Link
            to="/"
            className="text-2xl font-bold text-white sm:text-xl md:text-2xl">
            DrugWise
          </Link>
          <nav className="hidden md:flex items-center justify-center">
            <div className="flex space-x-6 bg-[#313131] px-4 py-2 rounded-full">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`text-gray-200 hover:text-[#3b82f6] transition text-base ${location.pathname === to ? "text-[#3b82f6] font-bold" : ""}`}>
                  {label}
                </Link>
              ))}
            </div>
          </nav>
          <div className="flex items-center space-x-4">
            {!loading && !user && (
              <Link to="/auth">
                <button className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition text-sm sm:text-base">
                  Sign In
                </button>
              </Link>
            )}
            {!loading && user && (
              <>
                {/* Show profile image only on md: and above */}
                <Link to="/auth/profile" className="hidden md:block">
                  <img
                    src={getFallbackImage()}
                    alt={user.displayName || "Profile"}
                    className="w-10 h-10 rounded-lg border border-blue-600 object-cover hover:scale-105 transition-transform duration-200"
                  />
                </Link>
                <button
                  onClick={handleSignOutClick}
                  className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition text-sm sm:text-base">
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Bottom Navbar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-4 left-0 right-0 max-w-sm mx-auto  backdrop-blur-lg border border-[rgba(255,255,255,0.1)] rounded-full shadow-xl z-50">
        <div className="flex justify-around items-center py-3 px-6">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center text-gray-200 hover:text-[#3b82f6] transition text-xs ${location.pathname === to ? "text-[#3b82f6] font-bold" : ""}`}>
              <motion.div
                whileHover={{
                  scale: 1.15,
                  boxShadow: "0 0 10px rgba(59, 130, 246, 0.5)",
                }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}>
                <Icon className="w-5 h-5 mb-1" strokeWidth={1.75} />
              </motion.div>
              {label}
            </Link>
          ))}
          {!loading && user && (
            <Link to="/auth/profile" className="flex flex-col items-center">
              <motion.img
                src={getFallbackImage()}
                alt={user.displayName || "Profile"}
                className="w-7 h-7 rounded-lg border border-blue-600 object-cover"
                whileHover={{
                  scale: 1.15,
                  boxShadow: "0 0 10px rgba(59, 130, 246, 0.5)",
                }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
              />
              <span className="text-xs text-gray-200 mt-1">Profile</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showConfirm && (
        <motion.div
          className="fixed inset-0 bg-[#141414]/80 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}>
          <motion.div
            className="bg-[#131311] p-6 rounded-xl shadow-2xl max-w-sm w-full text-center ring-1 ring-white/10"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20,
              delay: 0.1,
            }}>
            <motion.h3
              className="text-xl font-semibold mb-3 text-white text-left"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}>
              Are you sure you want to sign out?
            </motion.h3>
            <motion.p
              className="text-gray-300 mb-6 text-sm text-left"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}>
              You will have to sign in again to access your account.
            </motion.p>
            <div className="flex justify-end gap-4">
              <motion.button
                onClick={handleCancelLogout}
                className="px-4 py-2 bg-red-600 text-[#141414] rounded hover:bg-red-700 transition text-sm"
                style={{ borderRadius: "10px" }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}>
                Cancel
              </motion.button>
              <motion.button
                onClick={handleConfirmLogout}
                className="px-4 py-2 bg-lime-600 text-[#141414] hover:bg-lime-700 transition text-sm"
                style={{ borderRadius: "10px" }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}>
                Continue
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default Header;