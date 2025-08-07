import { Link, useLocation } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Home, Info, CreditCard, BookOpen, LogIn } from "lucide-react"; // Importing new icons for the bottom nav

const Header: React.FC = () => {
  const location = useLocation();
  const [user, setUser] = useState<null | {
    uid: string;
    displayName?: string;
    photoURL?: string;
  }>(null);
  const [loading, setLoading] = useState(true);

  // This effect listens for authentication state changes and updates the user state.
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
    // Cleanup function to unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  // Define the navigation links with icons for the new bottom nav
  const navLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/about", label: "About", icon: Info },
    { to: "/pricing", label: "Pricing", icon: CreditCard },
    { to: "/terms", label: "Terms", icon: BookOpen },
    { to: "/auth", label: "Sign In", icon: LogIn },
  ];

  // Hide the header if the user is signed in or still loading
  if (loading || user) return null;

  return (
    <>
      {/* Desktop Header */}
      <header className="w-full h-16 absolute top-0 left-0 z-50">
        <div className="hidden md:flex bg-zinc-950 h-16 items-center px-6">
          <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
            <Link to="/" className="text-2xl font-bold text-white">
              DrugWise
            </Link>
            <nav className="flex items-center justify-center">
              <div className="flex space-x-6 bg-[#1a1a1a]/80 backdrop-blur-md border border-[#ffffff1a] px-4 py-2 rounded-full">
                {navLinks
                  .filter((link) => link.to !== "/auth")
                  .map(
                    (
                      { to, label } // Filter out 'Sign In' for desktop nav
                    ) => (
                      <Link
                        key={to}
                        to={to}
                        className={`text-gray-200 hover:scale-110 transition text-base ${
                          location.pathname === to
                            ? "text-[#3b82f6] font-bold"
                            : ""
                        }`}>
                        {label}
                      </Link>
                    )
                  )}
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

      {/* Mobile Bottom Navigation Bar */}
      {/* This nav is only visible on screens smaller than 'md' breakpoint */}
      <nav className="fixed bottom-4 left-4 right-4 z-40 md:hidden flex items-center justify-around bg-zinc-900/50 backdrop-blur-md shadow-lg p-2 rounded-xl border border-zinc-800">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            style={{ borderRadius: "9px" }}
            className={`flex flex-col items-center justify-center p-2 text-xs transition-all duration-200 ${
              location.pathname === link.to
                ? "text-lime-300 font-bold bg-lime-400/20"
                : "text-gray-400 hover:text-white"
            }`}>
            <link.icon
              size={20}
              className={
                location.pathname === link.to
                  ? "text-lime-300"
                  : "text-gray-400"
              }
            />
            <span className="mt-1">{link.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
};

export default Header;
