import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { auth } from "../config/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import male from "/male.jpg?url";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Home, Info, DollarSign, Brain, User } from "lucide-react";

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

  const navLinksLeft = [
    { to: "/", label: "Home", icon: Home },
    { to: "/about", label: "About", icon: Info },
  ];

  const navLinksRight = [
    { to: "/pricing", label: "Pricing", icon: DollarSign },
    { to: "/model", label: "Model", icon: Brain },
  ];

  return (
    <>
      {/* Header */}
      <header className="w-full h-16 fixed top-0 left-0 z-50">
        {/* Mobile Header */}
        <div className="md:hidden max-w-md mx-auto bg-gradient-to-r from-[#1a1a1a]/90 to-[#2a2a2a]/90 backdrop-blur-lg mt-4 flex items-center justify-between px-4 py-2">
          <Link to="/" className="text-xl font-bold text-white">
            DrugWise
          </Link>
          <div className="flex items-center space-x-2">
            {!loading && !user && (
              <Link to="/auth">
                <motion.button
                  className="px-3 py-1.5 bg-lime-500 text-black rounded-lg text-sm font-medium shadow-md hover:bg-lime-600 transition"
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 0 10px rgba(132, 204, 22, 0.4)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}>
                  Sign In
                </motion.button>
              </Link>
            )}
            {!loading && user && (
              <motion.button
                onClick={handleSignOutClick}
                className="px-3 py-1.5 bg-red-500 text-black rounded-lg text-sm font-medium shadow-md hover:bg-red-600 transition"
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 10px rgba(239, 68, 68, 0.4)",
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}>
                Sign Out
              </motion.button>
            )}
          </div>
        </div>
        {/* Desktop Header */}
        <div className="hidden md:flex bg-[#141414] h-16 items-center px-6">
          <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
            <Link to="/" className="text-2xl font-bold text-white">
              DrugWise
            </Link>
            <nav className="flex items-center justify-center">
              <div className="flex space-x-6 bg-[#1a1a1a]/80 backdrop-blur-md border border-[#ffffff1a] px-4 py-2 rounded-full">
                {[...navLinksLeft, ...navLinksRight].map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`text-gray-200 hover:scale-110 transition text-base ${location.pathname === to ? "text-[#3b82f6] font-bold" : ""}`}>
                    {label}
                  </Link>
                ))}
              </div>
            </nav>
            <div className="flex items-center space-x-4">
              {!loading && !user && (
                <Link to="/auth">
                  <button className="px-4 py-2 bg-lime-500 text-black rounded-lg hover:bg-lime-700 transition text-base">
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
                      className="w-10 h-10 rounded-lg border border-blue-600 object-cover hover:scale-105 transition-transform duration-200"
                    />
                  </Link>
                  <button
                    onClick={handleSignOutClick}
                    className="px-4 py-2 bg-red-500 text-black rounded-lg hover:bg-red-700 transition text-base">
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navbar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-4 left-0 right-0 max-w-md mx-auto bg-gradient-to-r from-[#1a1a1a]/90 to-[#2a2a2a]/90 backdrop-blur-lg border border-[#ffffff1a] rounded-2xl z-50 py-2 px-4">
        <div className="flex justify-between items-center">
          {/* Left Side Links */}
          <div className="flex space-x-4">
            {navLinksLeft.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center text-gray-200 hover:text-[#3b82f6] transition text-xs ${location.pathname === to ? "text-[#3b82f6] font-bold" : ""}`}>
                <motion.div
                  whileHover={{
                    scale: 1.15,
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}>
                  <motion.div
                    whileHover={{
                      scale: 1.15,
                      filter: "drop-shadow(0 0 10px rgba(59, 130, 246, 0.6))",
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    style={{
                      filter:
                        location.pathname === to
                          ? "drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))"
                          : "none",
                    }}
                  >
                    <Icon
                      className="w-6 h-6 mb-1"
                      strokeWidth={2}
                    />
                  </motion.div>
                </motion.div>
                {label}
              </Link>
            ))}
          </div>

          {/* Center Profile Button */}
          {!loading && user && (
            <Link
              to="/auth/profile"
              className="flex flex-col items-center relative">
              <motion.div
                className="bg-[#3b82f6]/20 rounded-full p-2 border-2 border-[#3b82f6]"
                whileHover={{
                  scale: 1.25,
                  boxShadow: "0 0 15px rgba(59, 130, 246, 0.6)",
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.25, ease: "easeOut" }}>
                <img
                  src={getFallbackImage()}
                  alt={user.displayName || "Profile"}
                  className="w-8 h-8 rounded-full object-cover"
                />
              </motion.div>
              <span className="text-xs text-gray-200 mt-1">Profile</span>
            </Link>
          )}
          {!loading && !user && (
            <Link to="/auth" className="flex flex-col items-center relative">
              <motion.div
                className="bg-[#3b82f6]/20 rounded-full p-2 border-2 border-[#3b82f6]"
                whileHover={{
                  scale: 1.25,
                  boxShadow: "0 0 15px rgba(59, 130, 246, 0.6)",
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.25, ease: "easeOut" }}>
                <User className="w-6 h-6 text-[#3b82f6]" strokeWidth={2} />
              </motion.div>
              <span className="text-xs text-gray-200 mt-1">Sign In</span>
            </Link>
          )}

          {/* Right Side Links */}
          <div className="flex space-x-4">
            {navLinksRight.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center text-gray-200 hover:text-[#3b82f6] transition text-xs ${location.pathname === to ? "text-[#3b82f6] font-bold" : ""}`}>
                <motion.div
                  whileHover={{
                    scale: 1.15,
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}>
                  <motion.div
                    whileHover={{
                      scale: 1.15,
                      filter: "drop-shadow(0 0 10px rgba(59, 130, 246, 0.6))",
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    style={{
                      filter:
                        location.pathname === to
                          ? "drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))"
                          : "none",
                    }}
                  >
                    <Icon
                      className="w-6 h-6 mb-1"
                      strokeWidth={2}
                    />
                  </motion.div>
                </motion.div>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showConfirm && (
        <motion.div
          className="fixed inset-0 bg-[#141414]/5 backdrop-blur-md flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}>
          <motion.div
            className="bg-[#1a1a1a]/80 backdrop-blur-md border border-[#ffffff1a] p-6 rounded-xl shadow-2xl max-w-sm w-full text-center"
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
