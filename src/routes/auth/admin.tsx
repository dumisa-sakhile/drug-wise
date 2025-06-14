import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { auth, db } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import {
  collection,
  query,
  limit,
  getDocs,
  doc,
  getDoc,
  setDoc,
  Timestamp,
  orderBy,
  startAfter,
} from "firebase/firestore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

export const Route = createFileRoute("/auth/admin")({
  component: Admin,
});

function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [prevDocs, setPrevDocs] = useState<any[]>([]);
  const [editedUsers, setEditedUsers] = useState<{
    [uid: string]: Partial<UserData> & { uid: string };
  }>({});
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pageSize = 10;

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

  useEffect(() => {
    if (user && userData && !userData.isAdmin) {
      toast.error("You do not have permission to access this page.");
      navigate({ to: "/auth/profile" });
    }
  }, [user, userData, navigate]);

  const { data: allUsers, isLoading: allUsersLoading } = useQuery<UserData[]>({
    queryKey: ["allUsers", page],
    queryFn: async () => {
      if (!user || !userData?.isAdmin) return [];
      const usersRef = collection(db, "users");
      let q = query(usersRef, orderBy("joinedAt"), limit(pageSize));
      if (lastDoc) {
        q = query(
          usersRef,
          orderBy("joinedAt"),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }
      const snapshot = await getDocs(q);
      const users = snapshot.docs.map((doc) => doc.data() as UserData);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      return users;
    },
    enabled: !!user && userData?.isAdmin,
  });

  const updateUserMutation = useMutation({
    mutationFn: async (updatedUser: Partial<UserData> & { uid: string }) => {
      if (!user || !userData?.isAdmin) throw new Error("Unauthorized");
      const userDocRef = doc(db, "users", updatedUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) throw new Error("User not found");

      const existingData = userDoc.data() as UserData;
      const dobValue = updatedUser.dob
        ? typeof updatedUser.dob === "string"
          ? Timestamp.fromDate(new Date(updatedUser.dob))
          : updatedUser.dob
        : existingData.dob;

      await setDoc(userDocRef, {
        ...existingData,
        ...updatedUser,
        joinedAt: existingData.joinedAt, // Preserve joinedAt
        lastLogin: existingData.lastLogin || null, // Preserve lastLogin
        dob: dobValue,
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

  const handleInputChange = (
    user: UserData,
    field: keyof UserData,
    value: string | boolean | Timestamp | null
  ) => {
    let updatedValue: string | boolean | Timestamp | null = value;

    // Store dob as string for date input compatibility
    if (field === "dob" && value instanceof Timestamp) {
      updatedValue = value.toDate().toISOString().split("T")[0];
    }

    setEditedUsers((prev) => ({
      ...prev,
      [user.uid]: {
        ...prev[user.uid],
        [field]: updatedValue,
        uid: user.uid,
      },
    }));
  };

  const handleSaveUser = (uid: string) => {
    const updatedData = editedUsers[uid];
    if (!updatedData) {
      toast.info("No changes to save.");
      return;
    }

    const user = allUsers?.find((u) => u.uid === uid);
    if (!user) {
      toast.error("User not found.");
      return;
    }

    // Validate fields before saving
    if (updatedData.email && !validateEmail(updatedData.email)) {
      toast.error("Invalid email address");
      return;
    }
    if (updatedData.gender && !validateGender(updatedData.gender)) {
      toast.error("Invalid gender selection");
      return;
    }
    if (updatedData.name && !validateName(updatedData.name)) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    if (updatedData.surname && !validateName(updatedData.surname)) {
      toast.error("Surname must be at least 2 characters");
      return;
    }
    if (
      updatedData.dob &&
      !validateDob(
        typeof updatedData.dob === "string"
          ? updatedData.dob
          : updatedData.dob instanceof Timestamp
          ? updatedData.dob.toDate().toISOString().split("T")[0]
          : ""
      )
    ) {
      toast.error("Invalid date of birth");
      return;
    }

    updateUserMutation.mutate(updatedData, {
      onSuccess: () => {
        setEditedUsers((prev) => {
          const newState = { ...prev };
          delete newState[uid];
          return newState;
        });
      },
    });
  };

  const handleResetUser = (uid: string) => {
    setEditedUsers((prev) => {
      const newState = { ...prev };
      delete newState[uid];
      return newState;
    });
    toast.info("Changes reset.");
  };

  const handleNextPage = () => {
    if (allUsers && allUsers.length === pageSize) {
      setPrevDocs((prev) => [...prev, lastDoc]);
      setPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPrevDocs((prev) => prev.slice(0, -1));
      setLastDoc(prevDocs[prevDocs.length - 2] || null);
      setPage((prev) => prev - 1);
    }
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

  const formatDateForInput = (
    dob: Timestamp | string | null | undefined
  ): string => {
    if (!dob) return "";
    if (typeof dob === "string") return dob;
    return dob.toDate().toISOString().split("T")[0];
  };

  if (!user) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-inherit backdrop-blur-sm">
        <p className="text-white text-xl font-light">
          Please log in to access this page
        </p>
      </div>
    );
  }

  if (!userData?.isAdmin) {
    return null; // Redirect handled by useEffect
  }

  return (
    <>
      <title>Drug Wise - Admin</title>

      <div className="w-full min-h-screen flex flex-col gap-6 py-4 px-6 mx-auto max-w-6xl text-gray-200">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Admin Dashboard
        </h1>
        <div className="border-t border-white/10"></div>

        <section className="mt-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Manage Users
          </h2>
          {allUsersLoading ? (
            <div className="flex justify-center items-center p-4">
              <svg
                className="animate-spin h-8 w-8 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          ) : allUsers?.length === 0 ? (
            <p className="text-gray-300 text-lg font-light p-4">
              No users found.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-[#1C1C1E] rounded-lg">
                  <thead>
                    <tr className="text-left text-white text-sm">
                      <th className="px-4 py-2">UID</th>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">Surname</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Gender</th>
                      <th className="px-4 py-2">Date of Birth</th>
                      <th className="px-4 py-2">Joined At</th>
                      <th className="px-4 py-2">Last Login</th>
                      <th className="px-4 py-2">Admin</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers?.map((u) => (
                      <tr key={u.uid} className="border-t border-white/10">
                        <td className="px-4 py-2 text-gray-200 text-sm">
                          {u.uid.slice(0, 8)}...
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editedUsers[u.uid]?.name ?? u.name}
                            onChange={(e) =>
                              handleInputChange(u, "name", e.target.value)
                            }
                            className="bg-[#2A2A2D] text-white px-2 py-1 rounded text-sm w-full focus:outline-none focus:ring-2 focus:ring-gray-500"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={editedUsers[u.uid]?.surname ?? u.surname}
                            onChange={(e) =>
                              handleInputChange(u, "surname", e.target.value)
                            }
                            className="bg-[#2A2A2D] text-white px-2 py-1 rounded text-sm w-full focus:outline-none focus:ring-2 focus:ring-gray-500"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="email"
                            value={editedUsers[u.uid]?.email ?? u.email}
                            onChange={(e) =>
                              handleInputChange(u, "email", e.target.value)
                            }
                            className="bg-[#2A2A2D] text-white px-2 py-1 rounded text-sm w-full focus:outline-none focus:ring-2 focus:ring-gray-500"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={editedUsers[u.uid]?.gender ?? u.gender}
                            onChange={(e) =>
                              handleInputChange(u, "gender", e.target.value)
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
                            value={formatDateForInput(
                              editedUsers[u.uid]?.dob ?? u.dob
                            )}
                            onChange={(e) =>
                              handleInputChange(u, "dob", e.target.value)
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
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={editedUsers[u.uid]?.isAdmin ?? u.isAdmin}
                            onChange={(e) =>
                              handleInputChange(u, "isAdmin", e.target.checked)
                            }
                            className="bg-[#2A2A2D] text-white rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                          />
                        </td>
                        <td className="px-4 py-2 flex gap-2">
                          <button
                            onClick={() => handleSaveUser(u.uid)}
                            className="bg-white text-black font-semibold px-3 py-1 rounded-full hover:opacity-90 transition-all text-sm"
                            disabled={!editedUsers[u.uid]}>
                            Save
                          </button>
                          <button
                            onClick={() => handleResetUser(u.uid)}
                            className="text-sm text-gray-400 hover:text-white px-3 py-1 rounded-full transition"
                            disabled={!editedUsers[u.uid]}>
                            Reset
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between mt-4">
                <button
                  onClick={handlePrevPage}
                  disabled={page === 1}
                  className="bg-[#333]/50 backdrop-blur-md text-white font-semibold text-sm px-5 py-2 rounded-full hover:scale-105 transition-all shadow-md disabled:opacity-50">
                  Previous
                </button>
                <span className="text-gray-300 text-sm self-center">
                  Page {page}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={allUsers && allUsers.length < pageSize}
                  className="bg-[#333]/50 backdrop-blur-md text-white font-semibold text-sm px-5 py-2 rounded-full hover:scale-105 transition-all shadow-md disabled:opacity-50">
                  Next
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}

export default Admin;
