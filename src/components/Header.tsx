import { Link, useLocation } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react"; // Importing icons

const Header: React.FC = () => {
  const location = useLocation();
  const [user, setUser] = useState<null | {
    uid: string;
    displayName?: string;
    photoURL?: string;
  }>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
    { to: "/pricing", label: "Pricing" },
    { to: "/terms", label: "Terms" },
  ];

  // Hide header/nav if user is signed in or still loading
  if (loading || user) return null;

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
      },
    },
    closed: {
      x: "-100%",
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
      },
    },
  };

  const backdropVariants = {
    visible: { opacity: 1 },
    hidden: { opacity: 0 },
  };

  const handleLinkClick = () => {
    setIsSidebarOpen(false);
  };

  return (
    <>
      {/* Header */}
      <header className="w-full h-16 absolute top-0 left-0 z-50">
        {/* Mobile Header (Top) with Hamburger Menu */}
        <div className="md:hidden max-w-md mx-auto rounded-full mt-4 flex items-center justify-between px-4 py-2">
          <Link to="/" className="text-xl font-bold text-white">
            DrugWise
          </Link>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-white bg-white/10 rounded-full">
              <Menu size={24} />
            </button>
          </div>
        </div>
        {/* Desktop Header (Unchanged) */}
        <div className="hidden md:flex bg-[#141414] h-16 items-center px-6">
          <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
            <Link to="/" className="text-2xl font-bold text-white">
              DrugWise
            </Link>
            <nav className="flex items-center justify-center">
              <div className="flex space-x-6 bg-[#1a1a1a]/80 backdrop-blur-md border border-[#ffffff1a] px-4 py-2 rounded-full">
                {navLinks.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`text-gray-200 hover:scale-110 transition text-base ${
                      location.pathname === to ? "text-[#3b82f6] font-bold" : ""
                    }`}>
                    {label}
                  </Link>
                ))}
              </div>
            </nav>
            <div className="flex items-center space-x-4">
              <Link to="/auth">
                <button className="px-4 py-2 bg-white text-black rounded-lg hover:bg-slate-200 transition text-base">
                  Sign In
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Side Menu (Mobile Only) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="md:hidden fixed inset-0 bg-black/50 z-[99] cursor-pointer"
              onClick={() => setIsSidebarOpen(false)}
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            />
            {/* Sidebar */}
            <motion.div
              className="md:hidden fixed top-0 left-0 h-full w-64 bg-[#141414] border-r border-gray-700 z-[100] flex flex-col p-6"
              variants={sidebarVariants}
              initial="closed"
              animate="open"
              exit="closed">
              <div className="flex justify-between items-center mb-10">
                <Link
                  to="/"
                  onClick={handleLinkClick}
                  className="text-xl font-bold text-white">
                  DrugWise
                </Link>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 text-white bg-white/10 rounded-full">
                  <X size={24} />
                </button>
              </div>
              <nav className="flex flex-col space-y-4">
                {navLinks.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={handleLinkClick}
                    className={`text-lg p-3 rounded-lg transition-colors duration-200 ${
                      location.pathname === to
                        ? "text-[#3b82f6] font-bold"
                        : "text-gray-300 hover:text-white"
                    }`}>
                    <span>{label}</span>
                  </Link>
                ))}
                {/* Sign In button as a separate menu item */}
                <Link to="/auth" onClick={handleLinkClick}>
                  <motion.button
                    className="w-full px-3 py-1.5 mt-4 bg-white text-black rounded-lg text-lg font-medium shadow-md hover:bg-slate-200 transition"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}>
                    Sign In
                  </motion.button>
                </Link>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
