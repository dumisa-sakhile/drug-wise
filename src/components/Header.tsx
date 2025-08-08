import { Link, useLocation } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { auth } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Home, Info, CreditCard, BookOpen, LogIn } from "lucide-react";

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
    { to: "/", label: "Home", icon: Home },
    { to: "/about", label: "About", icon: Info },
    { to: "/auth", label: "Sign In", icon: LogIn }, // Sign In is now in the middle
    { to: "/pricing", label: "Pricing", icon: CreditCard },
    { to: "/terms", label: "Terms", icon: BookOpen },
  ];

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
                  .map(({ to, label }) => (
                    <Link
                      key={to}
                      to={to}
                      className={`text-gray-200 hover:scale-110 transition text-base ${
                        location.pathname === to
                          ? "text-white font-bold"
                          : ""
                      }`}>
                      {label}
                    </Link>
                  ))}
              </div>
            </nav>
            <div className="flex items-center space-x-4">
              <Link to="/auth">
                <button className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition text-base">
                  Sign In
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-4 left-4 right-4 z-40 md:hidden flex items-end justify-between bg-zinc-900/50 backdrop-blur-md shadow-lg p-2 rounded-2xl">
        {navLinks.map((link) => {
          const isSignIn = link.to === "/auth";
          const isActive = location.pathname === link.to;

          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex flex-col items-center justify-center text-xs transition-all duration-200 ${
                isSignIn
                  ? "relative -top-4 w-16 h-16 rounded-full bg-lime-400 text-black shadow-lg shadow-lime-500/50 transition-transform hover:scale-105"
                  : "p-2 hover:bg-zinc-800 rounded-lg"
              }`}>
              <div
                className={`flex flex-col items-center justify-center ${
                  isSignIn ? "" : "p-1"
                }`}>
                <link.icon
                  size={isSignIn ? 28 : 20}
                  className={`${
                    isActive && !isSignIn
                      ? "text-lime-400"
                      : isSignIn
                        ? "text-zinc-900"
                        : "text-gray-400"
                  } ${isSignIn ? "filter drop-shadow-lg" : ""}`}
                />
                {!isSignIn && (
                  <span
                    className={`mt-1 font-medium ${
                      isActive ? "text-lime-400" : "text-gray-400"
                    }`}>
                    {link.label}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </>
  );
};

export default Header;
