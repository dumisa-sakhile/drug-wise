import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { auth, db } from "../config/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const Route = createFileRoute("/auth/sign_up")({
  component: SignUp,
});

function SignUp() {
  const [name, setName] = useState<string>("");
  const [surname, setSurname] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [dob, setDob] = useState<string>(""); // Format: YYYY-MM-DD
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isValidName, setIsValidName] = useState<boolean>(false);
  const [isValidSurname, setIsValidSurname] = useState<boolean>(false);
  const [isValidEmail, setIsValidEmail] = useState<boolean>(false);
  const [isValidGender, setIsValidGender] = useState<boolean>(false);
  const [isValidDob, setIsValidDob] = useState<boolean>(false);
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

  const validateName = (value: string): boolean => value.trim().length >= 2;
  const validateSurname = (value: string): boolean => value.trim().length >= 2;
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  const validateGender = (gender: string): boolean =>
    ["male", "female"].includes(gender);
  const validateDob = (dob: string): boolean => {
    if (!dob) return false;
    const date = new Date(dob);
    const today = new Date();
    return (
      date instanceof Date &&
      !isNaN(date.getTime()) &&
      date <= today &&
      date >= new Date("1900-01-01")
    );
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    setIsValidName(validateName(newName));
    setError(null);
  };

  const handleSurnameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSurname = e.target.value;
    setSurname(newSurname);
    setIsValidSurname(validateSurname(newSurname));
    setError(null);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setIsValidEmail(validateEmail(newEmail));
    setError(null);
  };

  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGender = e.target.value;
    setGender(newGender);
    setIsValidGender(validateGender(newGender));
    setError(null);
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDob = e.target.value;
    setDob(newDob);
    setIsValidDob(validateDob(newDob));
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

  const handleSignUp = async (e: React.FormEvent) => {
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
      window.localStorage.setItem("nameForSignIn", name);
      window.localStorage.setItem("surnameForSignIn", surname);
      window.localStorage.setItem("genderForSignIn", gender);
      window.localStorage.setItem("dobForSignIn", dob);
      setName("");
      setSurname("");
      setEmail("");
      setGender("");
      setDob("");
      setIsValidName(false);
      setIsValidSurname(false);
      setIsValidEmail(false);
      setIsValidGender(false);
      setIsValidDob(false);
      setIsLinkSent(true);
      toast.success("Sign-up link sent! Check your email for confirmation.");
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

      // Store user data in Firestore
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email: user.email || "",
          gender: gender || "",
          dob: dob
            ? Timestamp.fromDate(new Date(dob))
            : Timestamp.fromDate(new Date("1970-01-01")),
          name: name || user.displayName || "Anonymous",
          surname: surname || "",
          joinedAt: Timestamp.now(),
          isAdmin: false,
        },
        { merge: true }
      );

      toast.success("Successfully signed up with Google!");
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
      <title>Drug Wise - Sign Up</title>
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
            Create an account on Drug Wise
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
                Sign-up link sent! Please check your email to complete
                registration.
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
                aria-label="Sign up with Google">
                <img
                  src="https://www.google.com/favicon.ico"
                  alt="Google Icon"
                  className="w-5 h-5 mr-2"
                />
                Sign up with Google
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
                onSubmit={handleSignUp}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}>
                <motion.div
                  className="mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}>
                  <label className="block text-sm mb-2" htmlFor="name">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={handleNameChange}
                    className="w-full bg-[rgba(255,255,255,0.1)] text-white py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(255,255,255,0.1)]"
                    required
                    aria-invalid={!isValidName}
                  />
                </motion.div>

                <motion.div
                  className="mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}>
                  <label className="block text-sm mb-2" htmlFor="surname">
                    Surname
                  </label>
                  <input
                    type="text"
                    id="surname"
                    placeholder="Enter your surname"
                    value={surname}
                    onChange={handleSurnameChange}
                    className="w-full bg-[rgba(255,255,255,0.1)] text-white py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(255,255,255,0.1)]"
                    required
                    aria-invalid={!isValidSurname}
                  />
                </motion.div>

                <motion.div
                  className="mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.5 }}>
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
                </motion.div>

                <motion.div
                  className="mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0, duration: 0.5 }}>
                  <label className="block text-sm mb-2" htmlFor="gender">
                    Gender
                  </label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={handleGenderChange}
                    className="w-full bg-[#2A2A2D] text-white py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(255,255,255,0.1)]"
                    required
                    aria-invalid={!isValidGender}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </motion.div>

                <motion.div
                  className="mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1, duration: 0.5 }}>
                  <label className="block text-sm mb-2" htmlFor="dob">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="dob"
                    value={dob}
                    onChange={handleDobChange}
                    className="w-full bg-[rgba(255,255,255,0.1)] text-white py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(255,255,255,0.1)]"
                    required
                    aria-invalid={!isValidDob}
                  />
                </motion.div>

                <motion.button
                  type="submit"
                  disabled={
                    isLoading ||
                    !isValidName ||
                    !isValidSurname ||
                    !isValidEmail ||
                    !isValidGender ||
                    !isValidDob
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg mb-4 disabled:opacity-50"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2, duration: 0.5 }}>
                  {isLoading ? "Sending..." : "Sign Up"}
                </motion.button>
              </motion.form>
            </>
          )}

          <motion.p
            className="text-sm text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.5 }}>
            Already have an account?{" "}
            <Link
              to="/auth"
              className="text-base font-bold text-blue-500 hover:underline">
              Log in here
            </Link>
          </motion.p>
        </motion.div>
      </motion.section>
    </>
  );
}
