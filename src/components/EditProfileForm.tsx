import { useState, useEffect } from "react";
import { updateProfile, updateEmail } from "firebase/auth";
import type { User } from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { db } from "@/config/firebase";
import { motion } from "framer-motion";

interface UserData {
  uid: string;
  email: string;
  gender: string;
  dob: Timestamp | null;
  name: string;
  surname: string;
  joinedAt: Timestamp;
  isAdmin: boolean;
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

      if (!validateName(name))
        throw new Error("Name must be at least 2 characters long");
      if (!validateSurname(surname))
        throw new Error("Surname must be at least 2 characters long");
      if (!validateEmail(email)) throw new Error("Invalid email address");
      if (!validateGender(gender)) throw new Error("Invalid gender selection");
      if (!validateDob(dob)) throw new Error("Invalid date of birth");

      await updateProfile(user, { displayName: name });
      if (email !== user.email) {
        await updateEmail(user, email);
      }

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) throw new Error("User document not found");

      const existingData = userDoc.data() as UserData;

      await setDoc(userDocRef, {
        uid: existingData.uid,
        email,
        gender,
        dob: Timestamp.fromDate(new Date(dob)),
        name,
        surname,
        joinedAt: existingData.joinedAt,
        isAdmin: existingData.isAdmin,
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
      window.location.reload(); // Refresh the page after successful update
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
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}>
      <motion.div
        className="relative w-full max-w-md bg-[#1C1C1E] text-white rounded-2xl shadow-xl p-6 md:p-8 animate-slide-up"
        initial={{ y: 50, opacity: 0 }}
        animate={{
          y: 0,
          opacity: 1,
          transition: { type: "spring", stiffness: 100, damping: 15 },
        }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}>
        <motion.button
          onClick={hide}
          className="absolute top-4 right-4 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30 rounded-full"
          initial={{ opacity: 0, rotate: -90 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
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
        </motion.button>

        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}>
          <motion.h2
            className="text-2xl max-sm:text-xl font-semibold mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}>
            Edit Your Profile
          </motion.h2>
          <motion.p
            className="text-sm text-gray-400 mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}>
            Update your personal details below.
          </motion.p>
        </motion.div>

        {error && (
          <motion.div
            className="text-red-300 text-sm font-medium mb-5 p-3 rounded-md bg-[rgba(255,75,75,0.15)] backdrop-blur-sm border border-[rgba(255,75,75,0.25)] text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}>
            {error}
          </motion.div>
        )}

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.1 },
              },
            }}>
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}>
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
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}>
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
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}>
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
              readOnly
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.4 }}>
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
            </select>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.4 }}>
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
          </motion.div>

          <motion.div
            className="flex justify-end gap-3 pt-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.1 },
              },
            }}>
            <motion.button
              type="submit"
              disabled={profileMutation.isPending}
              className="bg-white text-black font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-all"
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1 },
              }}>
              {profileMutation.isPending ? "Updating..." : "Save"}
            </motion.button>
            <motion.button
              type="button"
              onClick={hide}
              className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-full transition"
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1 },
              }}>
              Cancel
            </motion.button>
          </motion.div>
        </motion.form>
      </motion.div>
    </motion.div>
  );
};

export default EditProfileForm;