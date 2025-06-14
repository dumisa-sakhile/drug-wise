import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { auth } from "../config/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import male from "/male.jpg?url";

const Header: React.FC = () => {
  const navigate = useNavigate();
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      navigate({ to: "/auth" });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getFallbackImage = () => {
    return user?.photoURL || male;
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
                onClick={handleLogout}
                className="px-4 py-2 bg-white text-black rounded-full hover:bg-gray-200 transition">
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
