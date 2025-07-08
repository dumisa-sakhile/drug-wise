import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { auth, db } from "../../config/firebase";
import {
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { toast } from "react-hot-toast"; // Using react-hot-toast for notifications
import { motion } from "framer-motion";

export const Route = createFileRoute("/auth/verify")({
  component: VerifyMagicLink,
});

function VerifyMagicLink() {
  const [error, setError] = useState<string | null>(null);
  const [manualEmail, setManualEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();

  const completeSignIn = async (email: string) => {
    try {
      await signInWithEmailLink(auth, email, window.location.href);
      window.localStorage.removeItem("emailForSignIn");

      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        const name =
          window.localStorage.getItem("nameForSignIn") || "Anonymous";
        const surname = window.localStorage.getItem("surnameForSignIn") || "";
        const gender = window.localStorage.getItem("genderForSignIn") || "";
        const dob = window.localStorage.getItem("dobForSignIn") || "1970-01-01";

        if (!userDoc.exists()) {
          // Create new user document if it doesn't exist
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email || "",
            gender: gender || "",
            dob: Timestamp.fromDate(new Date(dob)),
            name: name,
            surname: surname,
            joinedAt: Timestamp.now(),
            isAdmin: false,
            lastLogin: Timestamp.now(),
          });
        } else {
          // Update existing document, only setting new fields if they exist, and merge with existing data
          const updateData: any = {
            lastLogin: Timestamp.now(),
          };
          if (name !== "Anonymous") updateData.name = name;
          if (surname) updateData.surname = surname;
          if (gender) updateData.gender = gender;
          if (dob !== "1970-01-01")
            updateData.dob = Timestamp.fromDate(new Date(dob));

          await setDoc(userDocRef, updateData, { merge: true });
        }

        window.localStorage.removeItem("nameForSignIn");
        window.localStorage.removeItem("surnameForSignIn");
        window.localStorage.removeItem("genderForSignIn");
        window.localStorage.removeItem("dobForSignIn");
      }

      toast.success("Successfully signed in!");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const verifyLink = async () => {
      if (auth.currentUser) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      if (!isSignInWithEmailLink(auth, window.location.href)) {
        const errMsg = "Invalid or expired magic link.";
        setError(errMsg);
        toast.error(errMsg);
        setIsLoading(false);
        return;
      }

      let email = window.localStorage.getItem("emailForSignIn");
      if (!email) {
        setIsLoading(false);
        return;
      }

      await completeSignIn(email);
    };
    verifyLink();
  }, [navigate]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate({ to: "/dashboard" });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleManualSignIn = async () => {
    if (!manualEmail) {
      const errMsg = "Please enter your email.";
      setError(errMsg);
      toast.error(errMsg);
      return;
    }
    setIsLoading(true);
    setError(null);

    await completeSignIn(manualEmail);
  };

  return (
    <>
      <title>Drug Wise - Verify Link</title>
      {/* Background Gradients/Effects added here */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 z-0 overflow-hidden">
        {" "}
        {/* Added overflow-hidden */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      <motion.section
        className="relative z-10 w-full min-h-screen flex items-center justify-center text-white  overflow-hidden" // Changed min-h-[40rem] to min-h-screen, added px-4 and overflow-hidden
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}>
        <motion.div
          className="bg-[#222222] backdrop-blur-sm ring-1 ring-[rgba(255,255,255,0.1)] p-8 rounded-lg shadow-lg w-full max-w-md" // This was already w-full max-w-md, no change needed here.
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}>
          <motion.h2
            className="text-2xl font-bold mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}>
            Verifying Your Sign-In
          </motion.h2>
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}>
              Verifying your sign-in link...
            </motion.div>
          ) : isAuthenticated ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}>
              <div className="mb-4">You are already authenticated!</div>
              <button
                onClick={() => navigate({ to: "/dashboard" })}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg">
                Go to Profile
              </button>
            </motion.div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}>
              <motion.div
                className="text-red-500 text-sm mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}>
                {error}
              </motion.div>
              <motion.div
                className="mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}>
                <label className="block text-sm mb-2" htmlFor="email">
                  Enter your email to continue
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="w-full bg-[rgba(255,255,255,0.1)] text-white py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(255,255,255,0.1)]"
                />
              </motion.div>
              <motion.button
                onClick={handleManualSignIn}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}>
                {isLoading ? "Verifying..." : "Verify Email"}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}>
              Sign-in successful! Redirecting...
            </motion.div>
          )}
        </motion.div>
      </motion.section>
    </>
  );
}
