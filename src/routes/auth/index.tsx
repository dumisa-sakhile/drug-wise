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

export const Route = createFileRoute("/auth/")({
  component: RouteComponent,
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RouteComponent() {
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
      <section className="w-full h-lvh flex items-center justify-center bg-inherit text-white">
        <div className="bg-[#222222] backdrop-blur-sm ring-1 ring-[rgba(255,255,255,0.1)] p-8 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6">Welcome back to Drug Wise</h2>

          {error && (
            <div className="mb-4 text-red-500 text-sm" aria-live="assertive">
              {error}
            </div>
          )}

          {isLinkSent ? (
            <div className="mb-4 text-center">
              <div className="mb-4 text-green-500 text-sm" aria-live="polite">
                Magic link sent! Please check your email to sign in.
              </div>
              <a
                href={getEmailProviderUrl(
                  window.localStorage.getItem("emailForSignIn") || ""
                )}
                rel="noopener noreferrer"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg inline-block">
                Open Email
              </a>
            </div>
          ) : (
            <>
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center bg-white text-black py-2 px-4 rounded-lg mb-4 hover:bg-[#e5e5e5] disabled:opacity-50"
                aria-label="Sign in with Google">
                <img
                  src="https://www.google.com/favicon.ico"
                  alt="Google Icon"
                  className="w-5 h-5 mr-2"
                />
                Log in with Google
              </button>

              <div className="flex items-center my-4">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="mx-4 text-white">or</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <form onSubmit={handleMagicLink}>
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

                <button
                  type="submit"
                  disabled={isLoading || !isValidEmail}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg mb-4 disabled:opacity-50">
                  {isLoading ? "Sending..." : "Email magic link"}
                </button>
              </form>
            </>
          )}

          <p className="text-sm text-center">
            Don’t have an account yet?{" "}
            <Link
              to="/auth/sign_up"
              className="text-base font-bold text-white hover:underline">
              Sign up here
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
