import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { auth, db } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import EditProfileForm from "@/components/EditProfileForm";
import defaultAvatar from "/male.jpg?url";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, Edit, ArrowRight } from "lucide-react"; // Importing Lucide React icons
import { toast } from "sonner";

interface UserData {
  uid: string;
  email: string;
  gender: string;
  dob: Timestamp | null;
  name: string;
  surname: string;
  joinedAt: Timestamp;
  isAdmin: boolean;
  lastLogin: Timestamp | null;
}

export const Route = createFileRoute("/auth/profile")({
  component: Profile,
});

function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = Route.useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate({ to: "/auth" });
        toast.error("You must be logged in to view your profile.");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const { data: userData } = useQuery<UserData>({
    queryKey: ["userData", user?.uid],
    queryFn: async () => {
      if (!user) return {} as UserData;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      return userDoc.exists() ? (userDoc.data() as UserData) : ({} as UserData);
    },
    enabled: !!user,
  });

  const isProfileIncomplete =
    userData &&
    (!userData.gender || userData.name === "Anonymous" || !userData.surname);

  if (!user) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center flex-col gap-6 bg-inherit backdrop-blur-sm">
        <p className="text-white text-xl font-light">
          Please log in to view your profile
        </p>
        
      </div>
    );
  }

  return (
    <>
      <title>Drug Wise - Profile</title>

      <motion.div
        className="w-full min-h-screen flex flex-col gap-6 py-4 px-6 mx-auto max-w-6xl text-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}>
        <motion.h1
          className="text-3xl sm:text-4xl font-bold tracking-tight text-white"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}>
          Profile
        </motion.h1>

        <motion.section
          className="flex flex-col md:flex-row items-center justify-between gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}>
          <motion.aside
            className="flex items-center gap-6 flex-col md:flex-row"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}>
            <motion.div
              className="relative"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}>
              <img
                src={user?.photoURL || defaultAvatar}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-2 border-[rgba(255,255,255,0.2)] shadow-lg"
              />
              {userData?.isAdmin && (
                <motion.span
                  className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-semibold text-white bg-blue-600 px-2 py-1 rounded-full shadow-md border border-white/20"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}>
                  <CheckCircle size={12} /> Admin
                </motion.span>
              )}
              {isProfileIncomplete && (
                <motion.span
                  className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-semibold text-white bg-red-600 px-2 py-1 rounded-full shadow-md border border-white/20"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}>
                  <AlertCircle size={12} /> Incomplete
                </motion.span>
              )}
            </motion.div>
            <motion.div
              className="flex flex-col items-center md:items-start gap-2"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}>
              <motion.h3
                className="text-md sm:text-lg font-light text-white"
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
                {userData?.name || user?.displayName || "Anonymous"}
              </motion.h3>
              <motion.p
                className="text-sm text-gray-400"
                variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
                {userData?.email || user?.email || "-"}
              </motion.p>
              {isProfileIncomplete && (
                <motion.p
                  className="text-sm text-red-500"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1 },
                  }}>
                  Please edit your profile to complete your information.
                </motion.p>
              )}
              {userData?.isAdmin && (
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 },
                  }}>
                  <Link to="/auth/admin">
                    <button className="px-4 py-2 bg-blue-600 backdrop-blur-md text-white text-sm font-semibold rounded-full hover:bg-blue-700 transition-all shadow-md flex items-center gap-2">
                      Go to Admin Portal <ArrowRight size={16} />
                    </button>
                  </Link>
                </motion.div>
              )}
            </motion.div>
          </motion.aside>
          <motion.button
            onClick={() => setModalOpen(true)}
            className="bg-[#333]/50 backdrop-blur-md text-white font-semibold text-sm px-5 py-3 rounded-full hover:scale-105 transition-all shadow-md flex items-center gap-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}>
            <Edit size={16} /> Edit Profile
          </motion.button>
        </motion.section>
        <motion.div
          className="border-t border-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        />

        <motion.section
          className="mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}>
          <motion.p
            className="text-gray-300 text-lg font-light p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}>
            No content available.
          </motion.p>
        </motion.section>
      </motion.div>

      <EditProfileForm
        isShowing={modalOpen}
        hide={() => setModalOpen(false)}
        user={user}
      />
    </>
  );
}

export default Profile;