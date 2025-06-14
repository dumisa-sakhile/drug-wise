import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { auth, db } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import EditProfileForm from "@/components/EditProfileForm";
import defaultAvatar from "/male.jpg?url";

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

  if (!user) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-inherit backdrop-blur-sm">
        <p className="text-white text-xl font-light">
          Please log in to view your profile
        </p>
      </div>
    );
  }

  return (
    <>
      <title>Drug Wise - Profile</title>

      <div className="w-full min-h-screen flex flex-col gap-6 py-4 px-6 mx-auto max-w-6xl text-gray-200">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Profile
        </h1>

        <section className="flex flex-col md:flex-row items-center justify-between gap-6">
          <aside className="flex items-center gap-6 flex-col md:flex-row">
            <img
              src={user?.photoURL || defaultAvatar}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-2 border-[rgba(255,255,255,0.2)] shadow-lg"
            />
            <div className="flex flex-col items-center md:items-start gap-2">
              <div>
                <h3 className="text-md sm:text-lg font-light text-white">
                  {userData?.name || user?.displayName || "Anonymous"}
                </h3>
                <p className="text-sm text-gray-400">
                  {userData?.email || user?.email || "-"}
                </p>
              </div>
              {userData?.isAdmin && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white bg-blue-600 px-2 py-1 rounded-full">
                    You're Admin
                  </span>
                  <Link to="/auth/admin">
                    <button className="px-3 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition text-sm">
                      Admin Portal
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </aside>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-[#333]/50 backdrop-blur-md text-white font-semibold text-sm px-5 py-3 rounded-full hover:scale-105 transition-all shadow-md">
            Edit Profile
          </button>
        </section>
        <div className="border-t border-white/10"></div>

        <section className="mt-6">
          <p className="text-gray-300 text-lg font-light p-4">
            No content available.
          </p>
        </section>
      </div>

      <EditProfileForm
        isShowing={modalOpen}
        hide={() => setModalOpen(false)}
        user={user}
      />
    </>
  );
}

export default Profile;
