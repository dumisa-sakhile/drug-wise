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
      toast.success("Logout successful");
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
          <Link to="/" className="text-lg sm:text-xl font-bold text-white">
            DrugWise
          </Link>
          <nav className="hidden md:flex items-center justify-center">
            <div className="flex space-x-4 sm:space-x-6 bg-[#313131] px-3 sm:px-4 py-2 rounded-full">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`text-gray-200 hover:text-[#3b82f6] transition text-sm sm:text-base ${location.pathname === to ? "text-[#3b82f6] font-bold" : ""}`}>
                  {label}
                </Link>
              ))}
            </div>
          </nav>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {!loading && !user && (
              <Link to="/auth">
                <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-[#141414] rounded-full hover:bg-gray-200 transition text-sm sm:text-base">
                  Sign In
                </button>
              </Link>
            )}
            {!loading && user && (
              <>
                <Link to="/auth/profile">
                  <img
                    src={getFallbackImage()}
                    alt={user.displayName || "Profile"}
                    className="w-8 h-8 rounded-full border border-gray-700 object-cover hover:scale-105 transition-transform"
                  />
                </Link>
                <button
                  onClick={handleSignOutClick}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-[#141414] rounded-full hover:bg-gray-200 transition text-sm sm:text-base">
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Bottom Navbar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-10 left-0 right-0 max-w-xs mx-auto bg-[rgba(49,49,49,0.8)] backdrop-blur-md border border-[rgba(255,255,255,0.1)] rounded-full shadow-lg z-50">
        <div className="flex justify-around items-center py-2.5 px-4">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center text-gray-200 hover:text-[#3b82f6] transition text-xs ${location.pathname === to ? "text-[#3b82f6] font-bold" : ""}`}>
              <motion.div
                whileHover={{
                  scale: 1.1,
                  boxShadow: "0 0 8px rgba(59, 130, 246, 0.5)",
                }}
                whileTap={{ scale: 0.95 }}>
                <Icon className="w-6 h-6 mb-1" strokeWidth={1.5} />
              </motion.div>
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showConfirm && (
        <motion.div
          className="fixed inset-0 bg-[#141414]/70 flex items-center justify-center z-60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}>
          <motion.div
            className="bg-[#111] p-2 sm:p-6 rounded-lg shadow-xl max-w-[90%] sm:max-w-sm w-full text-center"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 120,
              damping: 15,
              delay: 0.1,
            }}>
            <motion.h3
              className="text-lg sm:text-xl font-semibold mb-4 text-white text-left"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}>
              Are you sure you want to sign out?
            </motion.h3>
            <motion.p
              className="text-gray-300 mb-4 sm:mb-6 text-xs text-left"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}>
              You will have to sign in again to access your account.
            </motion.p>
            <div className="flex justify-end gap-2 sm:gap-4">
              <motion.button
                onClick={handleCancelLogout}
                className="px-4 py-2 bg-red-600 text-[#141414] rounded hover:bg-red-700 transition text-sm sm:text-base"
                style={{ borderRadius: "10px" }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}>
                Cancel
              </motion.button>
              <motion.button
                onClick={handleConfirmLogout}
                className="px-4 py-2 bg-lime-600 text-[#141414] hover:bg-lime-700 transition text-sm sm:text-base"
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
