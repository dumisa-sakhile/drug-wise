import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { auth, db } from "../../config/firebase";
import { isSignInWithEmailLink, signInWithEmailLink, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { toast } from "sonner";
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
      navigate({ to: "/auth/profile" });
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
          navigate({ to: "/auth/profile" });
          toast.info("You are already signed in!");
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
    <motion.section
      className="w-full h-lvh flex items-center justify-center bg-inherit text-white"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}>
      <motion.div
        className="bg-[#222222] backdrop-blur-sm ring-1 ring-[rgba(255,255,255,0.1)] p-8 rounded-lg shadow-lg w-full max-w-md"
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
              onClick={() => navigate({ to: "/auth/profile" })}
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
  );
}