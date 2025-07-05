import { Link, useLocation } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import male from "/male.jpg?url";
import { motion } from "framer-motion";
import { Home, Info, DollarSign, FileText } from "lucide-react";

const Header: React.FC = () => {
  const location = useLocation();
  const [user, setUser] = useState<null | {
    uid: string;
    displayName?: string;
    photoURL?: string;
  }>(null);
  const [loading, setLoading] = useState(true);

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

  const navLinksLeft = [
    { to: "/", label: "Home", icon: Home },
    { to: "/about", label: "About", icon: Info },
  ];

  const navLinksRight = [
    { to: "/pricing", label: "Pricing", icon: DollarSign },
    { to: "/terms", label: "Terms", icon: FileText },
  ];

  // Hide header/nav if user is signed in or still loading
  if (loading || user) return null;

  return (
    <>
      {/* Header */}
      <header className="w-full h-16 fixed top-0 left-0 z-50">
        {/* Mobile Header */}
        <div className="md:hidden max-w-md mx-auto rounded-full mt-4 flex items-center justify-between px-4 py-2">
          <Link to="/" className="text-xl font-bold text-white">
            DrugWise
          </Link>
          <div className="flex items-center space-x-2">
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
              <Link to="/auth">
                <button className="px-4 py-2 bg-lime-500 text-black rounded-lg hover:bg-lime-700 transition text-base">
                  Sign In
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navbar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-4 left-0 right-0 max-w-[330px] mx-auto bg-gradient-to-r from-[#1a1a1a]/90 to-[#2a2a2a]/90 backdrop-blur-lg border border-[#ffffff1a] rounded-2xl z-50 py-2 px-4">
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
                    }}>
                    <Icon className="w-6 h-6 mb-1" strokeWidth={2} />
                  </motion.div>
                </motion.div>
                {label}
              </Link>
            ))}
          </div>

          {/* Center Sign In Button with Male Image */}
          <Link to="/auth" className="flex flex-col items-center relative">
            <motion.div
              className="bg-[#3b82f6]/20 rounded-full p-2 border-2 border-[#3b82f6]"
              whileHover={{
                scale: 1.25,
                boxShadow: "0 0 15px rgba(59, 130, 246, 0.6)",
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}>
              <img
                src={male}
                alt="Sign In"
                className="w-8 h-8 rounded-full object-cover"
              />
            </motion.div>
            <span className="text-xs text-gray-200 mt-1">Sign In</span>
          </Link>

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
                    }}>
                    <Icon className="w-6 h-6 mb-1" strokeWidth={2} />
                  </motion.div>
                </motion.div>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;
