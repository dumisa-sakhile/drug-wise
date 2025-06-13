import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { auth, db } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
  role: string;
  lastLogin: Timestamp | null;
}

export const Route = createFileRoute("/auth/profile")({
  component: Profile,
});

function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

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

  const { data: allUsers, isLoading: allUsersLoading } = useQuery<UserData[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!user || userData?.role !== "admin") return [];
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      return snapshot.docs.map((doc) => doc.data() as UserData);
    },
    enabled: !!user && userData?.role === "admin",
  });

  const updateUserMutation = useMutation({
    mutationFn: async (updatedUser: Partial<UserData> & { uid: string }) => {
      if (!user || userData?.role !== "admin") throw new Error("Unauthorized");
      const userDocRef = doc(db, "users", updatedUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) throw new Error("User not found");

      const existingData = userDoc.data() as UserData;
      await setDoc(userDocRef, {
        ...existingData,
        ...updatedUser,
        role: existingData.role, // Preserve role
        joinedAt: existingData.joinedAt, // Preserve joinedAt
        lastLogin: existingData.lastLogin || null, // Preserve lastLogin
        dob: updatedUser.dob
          ? (typeof updatedUser.dob === "string"
              ? Timestamp.fromDate(new Date(updatedUser.dob))
              : updatedUser.dob)
          : existingData.dob,
      });
    },
    onSuccess: () => {
      toast.success("User updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update user");
    },
  });

  const handleEditUser = (
    user: UserData,
    field: keyof UserData,
    value: string | Timestamp | null
  ) => {
    if (field === "role" || field === "joinedAt" || field === "lastLogin")
      return; // Prevent editing
    const updatedData: Partial<UserData> & { uid: string } = { uid: user.uid };

    if (field === "dob") {
      if (value && validateDob(value as string)) {
        updatedData.dob =
          typeof value === "string"
            ? Timestamp.fromDate(new Date(value))
            : value;
      } else {
        toast.error("Invalid date of birth");
        return;
      }
    } else if (field === "email" && !validateEmail(value as string)) {
      toast.error("Invalid email address");
      return;
    } else if (field === "gender" && !validateGender(value as string)) {
      toast.error("Invalid gender selection");
      return;
    } else if (
      (field === "name" || field === "surname") &&
      !validateName(value as string)
    ) {
      toast.error(
        `${field === "name" ? "Name" : "Surname"} must be at least 2 characters`
      );
      return;
    } else {
      updatedData[field] = value as string;
    }

    updateUserMutation.mutate(updatedData);
  };

  const validateName = (value: string) => value.trim().length >= 2;
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

  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return "-";
    return timestamp.toDate().toLocaleDateString("en-ZA"); // SAST display
  };

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
            <div>
              <h3 className="text-md sm:text-lg font-light text-white">
                {userData?.name || user?.displayName || "Anonymous"}
              </h3>
              <p className="text-sm text-gray-400">
                {userData?.email || user?.email || "-"}
              </p>
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
          {userData?.role === "admin" ? (
            <>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Manage Users
              </h2>
              {allUsersLoading ? (
                <p className="text-gray-300 text-lg font-light p-4">
                  Loading users...
                </p>
              ) : allUsers?.length === 0 ? (
                <p className="text-gray-300 text-lg font-light p-4">
                  No users found.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-[#1C1C1E] rounded-lg">
                    <thead>
                      <tr className="text-left text-gray-400 text-sm">
                        <th className="px-4 py-2">UID</th>
                        <th className="px-4 py-2">Name</th>
                        <th className="px-4 py-2">Surname</th>
                        <th className="px-4 py-2">Email</th>
                        <th className="px-4 py-2">Gender</th>
                        <th className="px-4 py-2">Date of Birth</th>
                        <th className="px-4 py-2">Joined At</th>
                        <th className="px-4 py-2">Last Login</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers?.map((u) => (
                        <tr key={u.uid} className="border-t border-gray-700">
                          <td className="px-4 py-2 text-gray-200 text-sm">
                            {u.uid.slice(0, 8)}...
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              defaultValue={u.name}
                              onBlur={(e) =>
                                handleEditUser(u, "name", e.target.value)
                              }
                              className="bg-[#2A2A2D] text-white px-2 py-1 rounded text-sm w-full focus:outline-none focus:ring-2 focus:ring-gray-500"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              defaultValue={u.surname}
                              onBlur={(e) =>
                                handleEditUser(u, "surname", e.target.value)
                              }
                              className="bg-[#2A2A2D] text-white px-2 py-1 rounded text-sm w-full focus:outline-none focus:ring-2 focus:ring-gray-500"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="email"
                              defaultValue={u.email}
                              onBlur={(e) =>
                                handleEditUser(u, "email", e.target.value)
                              }
                              className="bg-[#2A2A2D] text-white px-2 py-1 rounded text-sm w-full focus:outline-none focus:ring-2 focus:ring-gray-500"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <select
                              defaultValue={u.gender}
                              onChange={(e) =>
                                handleEditUser(u, "gender", e.target.value)
                              }
                              className="bg-[#2A2A2D] text-white px-2 py-1 rounded text-sm w-full focus:outline-none focus:ring-2 focus:ring-gray-500">
                              <option value="">Select</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="non-binary">Non-binary</option>
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="date"
                              defaultValue={
                                u.dob
                                  ? u.dob.toDate().toISOString().split("T")[0]
                                  : ""
                              }
                              onBlur={(e) =>
                                handleEditUser(u, "dob", e.target.value)
                              }
                              className="bg-[#2A2A2D] text-white px-2 py-1 rounded text-sm w-full focus:outline-none focus:ring-2 focus:ring-gray-500"
                            />
                          </td>
                          <td className="px-4 py-2 text-gray-200 text-sm">
                            {formatDate(u.joinedAt)}
                          </td>
                          <td className="px-4 py-2 text-gray-200 text-sm">
                            {formatDate(u.lastLogin)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-300 text-lg font-light p-4">
              No content available.
            </p>
          )}
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
