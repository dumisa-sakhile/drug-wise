import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { auth, db } from "../../config/firebase";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/verify")({
  component: VerifyMagicLink,
});

function VerifyMagicLink() {
  const [error, setError] = useState<string | null>(null);
  const [manualEmail, setManualEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const completeSignIn = async (email: string) => {
    try {
      await signInWithEmailLink(auth, email, window.location.href);
      window.localStorage.removeItem("emailForSignIn");

      const user = auth.currentUser;
      if (user) {
        const name =
          window.localStorage.getItem("nameForSignIn") || "Anonymous";
        const surname = window.localStorage.getItem("surnameForSignIn") || "";
        const gender = window.localStorage.getItem("genderForSignIn") || "";
        const dob = window.localStorage.getItem("dobForSignIn") || "1970-01-01";

        await setDoc(
          doc(db, "users", user.uid),
          {
            uid: user.uid,
            email: user.email || "",
            gender,
            dob: Timestamp.fromDate(new Date(dob)),
            name,
            surname,
            joinedAt: Timestamp.now(),
            role: "user",
          },
          { merge: true }
        );

        window.localStorage.removeItem("nameForSignIn");
        window.localStorage.removeItem("surnameForSignIn");
        window.localStorage.removeItem("genderForSignIn");
        window.localStorage.removeItem("dobForSignIn");
      }

      toast.success("Successfully signed in!");
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const verifyLink = async () => {
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
    <section className="w-full h-lvh flex items-center justify-center bg-inherit text-white">
      <div className="bg-[#222222] backdrop-blur-sm ring-1 ring-[rgba(255,255,255,0.1)] p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Verifying Your Sign-In</h2>
        {isLoading ? (
          <div>Verifying your sign-in link...</div>
        ) : error ? (
          <>
            <div className="text-red-500 text-sm mb-4">{error}</div>
            <div className="mb-4">
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
            </div>
            <button
              onClick={handleManualSignIn}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg disabled:opacity-50">
              {isLoading ? "Verifying..." : "Verify Email"}
            </button>
          </>
        ) : (
          <div>Sign-in successful! Redirecting...</div>
        )}
      </div>
    </section>
  );
}
