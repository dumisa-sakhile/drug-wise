import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { auth, db } from "../../config/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const Route = createFileRoute("/auth/")({
  component: Login,
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Login() {
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isValidEmail, setIsValidEmail] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLinkSent, setIsLinkSent] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate({ to: "/" });
        toast.info("You are already signed in!");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const validateEmail = (email: string): boolean => {
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setIsValidEmail(validateEmail(newEmail));
    setError(null);
  };

  const getEmailProviderUrl = (email: string): string => {
    const domain = email.split("@")[1]?.toLowerCase();
    switch (domain) {
      case "gmail.com":
        return "https://mail.google.com";
      case "outlook.com":
      case "hotmail.com":
        return "https://outlook.live.com";
      case "yahoo.com":
        return "https://mail.yahoo.com";
      default:
        return "mailto:";
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/auth/verify`,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);
      setEmail("");
      setIsValidEmail(false);
      setIsLinkSent(true);
      toast.success("Magic link sent! Check your email.");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document exists
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create new user document with all required fields
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email || "",
          gender: "",
          dob: Timestamp.fromDate(new Date("1970-01-01")),
          name: user.displayName || "Anonymous",
          surname: "",
          joinedAt: Timestamp.now(),
          isAdmin: false,
          lastLogin: Timestamp.now(),
        });
      } else {
        // Update lastLogin for existing user
        await setDoc(
          userDocRef,
          { lastLogin: Timestamp.now() },
          { merge: true }
        );
      }

      toast.success("Successfully signed in with Google!");
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <title>Drug Wise - Login</title>
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
            Welcome back to Drug Wise
          </motion.h2>

          {error && (
            <motion.div
              className="mb-4 text-red-500 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              aria-live="assertive">
              {error}
            </motion.div>
          )}

          {isLinkSent ? (
            <motion.div
              className="mb-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}>
              <motion.div
                className="mb-4 text-green-500 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                aria-live="polite">
                Magic link sent! Please check your email to sign in.
              </motion.div>
              <motion.a
                href={getEmailProviderUrl(
                  window.localStorage.getItem("emailForSignIn") || ""
                )}
                rel="noopener noreferrer"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg inline-block"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}>
                Open Email
              </motion.a>
            </motion.div>
          ) : (
            <>
              <motion.button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center bg-white text-black py-2 px-4 rounded-lg mb-4 hover:bg-[#e5e5e5] disabled:opacity-50"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                aria-label="Sign in with Google">
                <img
                  src="https://www.google.com/favicon.ico"
                  alt="Google Icon"
                  className="w-5 h-5 mr-2"
                />
                Log in with Google
              </motion.button>

              <motion.div
                className="flex items-center my-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}>
                <div className="flex-grow border-t border-white/10"></div>
                <span className="mx-4 text-white">or</span>
                <div className="flex-grow border-t border-white/10"></div>
              </motion.div>

              <motion.form
                onSubmit={handleMagicLink}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}>
                <div className="mb-4">
                  <label className="block text-sm mb-2" htmlFor="email">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={handleEmailChange}
                    className="w-full bg-[rgba(255,255,255,0.1)] text-white py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(255,255,255,0.1)]"
                    required
                    aria-invalid={!isValidEmail}
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading || !isValidEmail}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg mb-4 disabled:opacity-50"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, duration: 0.5 }}>
                  {isLoading ? "Sending..." : "Email magic link"}
                </motion.button>
              </motion.form>
            </>
          )}

          <motion.p
            className="text-sm text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}>
            Don’t have an account yet?{" "}
            <Link
              to="/auth/sign_up"
              className="text-base font-bold text-white hover:underline">
              Sign up here
            </Link>
          </motion.p>
        </motion.div>
      </motion.section>
    </>
  );
}
