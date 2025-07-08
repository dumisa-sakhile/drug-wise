import { Link, useLocation } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { motion } from "framer-motion";
// Removed unused lucide-react icons: Home, Info, DollarSign, FileText

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

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
    { to: "/pricing", label: "Pricing" },
    { to: "/terms", label: "Terms" },
  ];

  // Hide header/nav if user is signed in or still loading
  if (loading || user) return null;

  return (
    <>
      {/* Header */}
      <header className="w-full h-16 absolute top-0 left-0 z-50">
        {/* Mobile Header (Top) - NOW CLEAN & TRANSPARENT */}
        <div className="md:hidden max-w-md mx-auto rounded-full mt-4 flex items-center justify-between px-4 py-2">
          <Link to="/" className="text-xl font-bold text-white">
            DrugWise
          </Link>
          <div className="flex items-center space-x-2">
            <Link to="/auth">
              <motion.button
                className="px-3 py-1.5 bg-white text-black rounded-lg text-sm font-medium shadow-md hover:bg-slate-200 transition"
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 10px rgba(132, 204, 22, 0.4)",
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                Sign In
              </motion.button>
            </Link>
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
                    }`}
                  >
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

      {/* Bottom Navbar (Mobile Only) - REDESIGNED TO LOOK LIKE DESKTOP LINKS */}
      <nav className="md:hidden fixed bottom-4 left-0 right-0 max-w-md mx-auto bg-[#1a1a1a]/90 backdrop-blur-sm border border-white/5 rounded-full z-50 py-3 px-4 shadow-xl"> {/* Changed py-2.5 to py-3 for increased height */}
        <div className="flex justify-around items-center h-full space-x-4">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center justify-center text-base font-medium transition-colors duration-200 relative group
                ${location.pathname === to ? "text-[#3b82f6] font-bold" : "text-gray-200 hover:text-white"}`} 
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Header;
