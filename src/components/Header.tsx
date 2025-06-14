import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { auth } from "../config/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import male from "/male.jpg?url";
import { motion } from "framer-motion";
import { toast } from "sonner";

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

  return (
    <header className="w-full h-16 bg-black flex items-center px-6 fixed top-0 left-0 z-50">
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
        <Link to="/" className="hidden md:block text-xl font-bold text-white">
          DrugWise
        </Link>
        <nav className="flex space-x-6 bg-[#131313] px-4 py-2 rounded-full ring-1 ring-white/20">
          <Link
            to="/"
            className={`text-gray-200 hover:text-white transition ${location.pathname === "/" ? "font-bold" : ""}`}>
            Home
          </Link>
          <Link
            to="/pricing"
            className={`text-gray-200 hover:text-white transition ${location.pathname === "/pricing" ? "font-bold" : ""}`}>
            Pricing
          </Link>
          <Link
            to="/model"
            className={`text-gray-200 hover:text-white transition ${location.pathname === "/model" ? "font-bold" : ""}`}>
            Model
          </Link>
        </nav>
        <div className="flex items-center space-x-4">
          {!loading && !user && (
            <Link to="/auth">
              <button className="px-4 py-2 bg-white text-black rounded-full hover:bg-gray-200 transition">
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
                className="px-4 py-2 bg-white text-black rounded-full hover:bg-gray-200 transition">
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>

      {showConfirm && (
        <motion.div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}>
          <motion.div
            className="bg-[#1C1C1E] p-6 rounded-lg shadow-xl max-w-sm w-full text-center"
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
              className="text-xl font-semibold mb-4 text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}>
              Confirm Sign Out
            </motion.h3>
            <motion.p
              className="text-gray-300 mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}>
              Are you sure you want to sign out?
            </motion.p>
            <div className="flex justify-center gap-4">
              <motion.button
                onClick={handleConfirmLogout}
                className="px-4 py-2 bg-red-700 text-white rounded-full hover:bg-red-900 transition"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}>
                Yes, Sign Out
              </motion.button>
              <motion.button
                onClick={handleCancelLogout}
                className="px-4 py-2 bg-[#131313] text-white rounded-full hover:bg-[#1C1C1E] hover:ring-1 hover:ring-white/10 transition"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}>
                Cancel
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </header>
  );
};

export default Header;
