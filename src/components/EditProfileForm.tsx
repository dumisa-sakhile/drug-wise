import { useState, useEffect } from "react";
import { updateProfile, updateEmail } from "firebase/auth";
import type { User } from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { db } from "@/config/firebase";

// Interface for user data in Firestore
interface UserData {
  uid: string;
  email: string;
  gender: string;
  dob: Timestamp | null;
  name: string;
  surname: string;
  joinedAt: Timestamp;
  role: string;
  lastLogin?: Timestamp | null;
}

interface EditProfileFormProps {
  isShowing: boolean;
  hide: () => void;
  user: User | null;
}

const EditProfileForm: React.FC<EditProfileFormProps> = ({
  isShowing,
  hide,
  user,
}) => {
  const queryClient = useQueryClient();
  const { data: userData } = useQuery<UserData>({
    queryKey: ["userData", user?.uid],
    queryFn: async () => {
      if (!user) return {} as UserData;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      return userDoc.exists() ? (userDoc.data() as UserData) : ({} as UserData);
    },
    enabled: !!user,
  });

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Initialize form with user data
  useEffect(() => {
    if (userData?.name) setName(userData.name);
    else if (user?.displayName) setName(user.displayName);
    if (userData?.surname) setSurname(userData.surname);
    if (userData?.email || user?.email)
      setEmail(userData?.email || user?.email || "");
    if (userData?.gender) setGender(userData.gender);
    if (userData?.dob) {
      const date = userData.dob.toDate();
      setDob(date.toISOString().split("T")[0]); // YYYY-MM-DD
    }
  }, [user, userData]);

  // Validation functions
  const validateName = (value: string) => value.trim().length >= 2;
  const validateSurname = (value: string) => value.trim().length >= 2;
  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateGender = (gender: string) =>
    ["male", "female", "non-binary", ""].includes(gender);
  const validateDob = (dob: string) => {
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

  const profileMutation = useMutation({
    mutationFn: async ({
      name,
      surname,
      email,
      gender,
      dob,
    }: {
      name: string;
      surname: string;
      email: string;
      gender: string;
      dob: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Validate inputs
      if (!validateName(name))
        throw new Error("Name must be at least 2 characters long");
      if (!validateSurname(surname))
        throw new Error("Surname must be at least 2 characters long");
      if (!validateEmail(email)) throw new Error("Invalid email address");
      if (!validateGender(gender)) throw new Error("Invalid gender selection");
      if (!validateDob(dob)) throw new Error("Invalid date of birth");

      // Update Firebase Auth
      await updateProfile(user, { displayName: name });
      if (email !== user.email) {
        await updateEmail(user, email);
      }

      // Fetch existing user data to preserve non-editable fields
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) throw new Error("User document not found");

      const existingData = userDoc.data() as UserData;

      // Update Firestore with all required fields
      await setDoc(userDocRef, {
        uid: existingData.uid,
        email,
        gender,
        dob: Timestamp.fromDate(new Date(dob)),
        name,
        surname,
        joinedAt: existingData.joinedAt,
        role: existingData.role,
        lastLogin: existingData.lastLogin || null,
      });
    },
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["userData", user?.uid] });
      setName("");
      setSurname("");
      setEmail("");
      setGender("");
      setDob("");
      hide();
    },
    onError: (error: any) => {
      setError(error.message || "Failed to update profile");
      if (error?.code === "auth/requires-recent-login") {
        toast.error("Please log in again to update your profile");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    profileMutation.mutate({ name, surname, email, gender, dob });
  };

  if (!isShowing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-md bg-[#1C1C1E] text-white rounded-2xl shadow-xl p-6 md:p-8 animate-slide-up">
        {/* Close Button */}
        <button
          onClick={hide}
          className="absolute top-4 right-4 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30 rounded-full"
          aria-label="Close">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Heading */}
        <div className="text-center">
          <h2 className="text-2xl max-sm:text-xl font-semibold mb-2">
            Edit Your Profile
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            Update your personal details below.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="text-red-300 text-sm font-medium mb-5 p-3 rounded-md bg-[rgba(255,75,75,0.15)] backdrop-blur-sm border border-[rgba(255,75,75,0.25)] text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="text-sm text-gray-300 block mb-1">
                Name*
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg bg-[#2A2A2D] text-white px-4 py-3 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                required
              />
            </div>

            {/* Surname */}
            <div>
              <label
                htmlFor="surname"
                className="text-sm text-gray-300 block mb-1">
                Surname*
              </label>
              <input
                id="surname"
                type="text"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                placeholder="Your surname"
                className="w-full rounded-lg bg-[#2A2A2D] text-white px-4 py-3 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="text-sm text-gray-300 block mb-1">
              Email*
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="w-full rounded-lg bg-[#2A2A2D] text-white px-4 py-3 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
            />
          </div>

          {/* Gender */}
          <div>
            <label
              htmlFor="gender"
              className="text-sm text-gray-300 block mb-1">
              Gender*
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-lg bg-[#2A2A2D] text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
              required>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
            </select>
          </div>

          {/* Date of Birth */}
          <div>
            <label htmlFor="dob" className="text-sm text-gray-300 block mb-1">
              Date of Birth*
            </label>
            <input
              id="dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full rounded-lg bg-[#2A2A2D] text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="submit"
              disabled={profileMutation.isPending}
              className="bg-white text-black font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-all">
              {profileMutation.isPending ? "Updating..." : "Save"}
            </button>
            <button
              type="button"
              onClick={hide}
              className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-full transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileForm;
