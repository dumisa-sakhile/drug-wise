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
  where,
} from "firebase/firestore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
  const [showFields, setShowFields] = useState({ dob: false, joinedAt: false });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) =>
      setUser(currentUser)
    );
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

  const {
    data: allUsers,
    isLoading: allUsersLoading,
    refetch,
  } = useQuery<UserData[]>({
    queryKey: ["allUsers", page, searchTerm, filterGender],
    queryFn: async () => {
      if (!user || !userData?.isAdmin) return [];
      const usersRef = collection(db, "users");
      let q = query(usersRef, orderBy("joinedAt", "desc"), limit(pageSize));
      if (lastDoc) q = query(q, startAfter(lastDoc), limit(pageSize));
      if (searchTerm)
        q = query(
          q,
          where("uid", ">=", searchTerm),
          where("uid", "<=", searchTerm + "\uf8ff")
        );
      if (filterGender) q = query(q, where("gender", "==", filterGender));
      const snapshot = await getDocs(q);
      const users = snapshot.docs.map((doc) => doc.data() as UserData);
      if (users.length === 0 && (searchTerm || filterGender)) {
        setLastDoc(null);
        setPage(1);
        setPrevDocs([]);
      } else setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
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
        dob: dobValue,
      });
    },
    onSuccess: () => {
      toast.success("User updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
    onError: (error: any) =>
      toast.error(error.message || "Failed to update user"),
  });

  const handleInputChange = (
    user: UserData,
    field: keyof UserData,
    value: string | Timestamp | null
  ) => {
    let updatedValue: string | Timestamp | null = value;
    if (field === "dob" && value) updatedValue = value.toString().split("T")[0];
    setEditedUsers((prev) => ({
      ...prev,
      [user.uid]: { ...prev[user.uid], [field]: updatedValue, uid: user.uid },
    }));
  };

  const handleSaveUser = (uid: string) => {
    const updatedData = editedUsers[uid];
    if (!updatedData) return toast.info("No changes to save.");
    const user = allUsers?.find((u) => u.uid === uid);
    if (!user) return toast.error("User not found");
    if (updatedData.email && !validateEmail(updatedData.email))
      return toast.error("Invalid email address");
    if (updatedData.gender && !validateGender(updatedData.gender))
      return toast.error("Invalid gender selection");
    if (updatedData.name && !validateName(updatedData.name))
      return toast.error("Name must be at least 2 characters");
    if (updatedData.surname && !validateName(updatedData.surname))
      return toast.error("Surname must be at least 2 characters");
    if (updatedData.dob && !validateDob(updatedData.dob.toString()))
      return toast.error("Invalid date of birth");
    updateUserMutation.mutate(updatedData, {
      onSuccess: () =>
        setEditedUsers((prev) => {
          const newState = { ...prev };
          delete newState[uid];
          return newState;
        }),
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

  const handleNextPage = () =>
    allUsers &&
    allUsers.length === pageSize &&
    (setPrevDocs((prev) => [...prev, lastDoc]), setPage((prev) => prev + 1));
  const handlePrevPage = () =>
    page > 1 &&
    (setPrevDocs((prev) => prev.slice(0, -1)),
    setLastDoc(prevDocs[prevDocs.length - 2] || null),
    setPage((prev) => prev - 1));

  const validateName = (value: string) => value.trim().length >= 2;
  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateGender = (gender: string) =>
    ["male", "female", "non-binary", ""].includes(gender);
  const validateDob = (dob: string) => {
    if (!dob) return false;
    const date = new Date(dob);
    return (
      date instanceof Date &&
      !isNaN(date.getTime()) &&
      date <= new Date() &&
      date >= new Date("1900-01-01")
    );
  };

  const formatDate = (timestamp: Timestamp | null) =>
    timestamp ? timestamp.toDate().toLocaleDateString("en-ZA") : "-";
  const formatDateForInput = (
    dob: Timestamp | string | null | undefined
  ): string =>
    dob
      ? typeof dob === "string"
        ? dob
        : dob.toDate().toISOString().split("T")[0]
      : "";

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const totalUsers = allUsers?.length || 0;
  const joinedThisMonth =
    allUsers?.filter(
      (u) =>
        u.joinedAt.toDate().getMonth() === currentMonth &&
        u.joinedAt.toDate().getFullYear() === currentYear
    ).length || 0;

  if (!user)
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-black">
        <p className="text-white text-xl font-light">
          Please log in to access this page
        </p>
      </div>
    );

  if (!userData?.isAdmin) return null;

  return (
    <>
      <title>Admin Dashboard</title>
      <motion.div
        className="w-full min-h-screen flex flex-col gap-8 py-8 px-12 mx-auto max-w-7xl bg-black text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}>
        <motion.h1
          className="text-5xl font-bold tracking-tight text-white"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}>
          Admin Dashboard
        </motion.h1>
        <div className="border-t border-white/10"></div>
        <motion.section
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}>
          <div className="flex justify-between mb-8 items-center">
            <div className="flex gap-6 items-center">
              <input
                type="text"
                placeholder="Search by UID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                  setLastDoc(null);
                  setPrevDocs([]);
                  refetch();
                }}
                className="bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 w-80 h-12"
              />
              <button
                onClick={() =>
                  setShowFields((prev) => ({ ...prev, dob: !prev.dob }))
                }
                className={`text-white px-6 py-3 rounded-full focus:outline-none w-40 h-12 ${showFields.dob ? "bg-blue-600" : "bg-white/10 backdrop-blur-md"}`}>
                DOB
              </button>
              <button
                onClick={() =>
                  setShowFields((prev) => ({
                    ...prev,
                    joinedAt: !prev.joinedAt,
                  }))
                }
                className={`text-white px-6 py-3 rounded-full focus:outline-none w-44 h-12 ${showFields.joinedAt ? "bg-blue-600" : "bg-white/10 backdrop-blur-md"}`}>
                Joined At
              </button>
            </div>
            <div className="flex gap-6 items-center">
              <select
                value={filterGender}
                onChange={(e) => {
                  setFilterGender(e.target.value);
                  setPage(1);
                  setLastDoc(null);
                  setPrevDocs([]);
                  refetch();
                }}
                className="bg-[#131313] backdrop-blur-md text-white px-6 py-3 rounded-full focus:outline-none w-40 h-12">
                <option value="">All Genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
              </select>
            </div>
          </div>
          <motion.div className="grid grid-cols-4 gap-8 mb-8">
            <div className="text-center p-6 bg-white/5 rounded-lg">
              <p className="text-gray-400 text-xl">Total Users</p>
              <p className="text-3xl font-bold text-white">{totalUsers}</p>
            </div>
            <div className="text-center p-6 bg-white/5 rounded-lg">
              <p className="text-gray-400 text-xl">Joined This Month</p>
              <p className="text-3xl font-bold text-white">{joinedThisMonth}</p>
            </div>
            <div className="text-center p-6 bg-white/5 rounded-lg">
              <p className="text-gray-400 text-xl">Admin Users</p>
              <p className="text-3xl font-bold text-white">
                {allUsers?.filter((u) => u.isAdmin).length || 0}
              </p>
            </div>
            <div className="text-center p-6 bg-white/5 rounded-lg">
              <p className="text-gray-400 text-xl">Active Users</p>
              <p className="text-3xl font-bold text-white">
                {allUsers?.filter((u) => u.lastLogin).length || 0}
              </p>
            </div>
          </motion.div>
          {allUsersLoading && (
            <motion.div
              className="flex justify-center items-center p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}>
              <svg
                className="animate-spin h-10 w-10 text-blue-500"
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
            </motion.div>
          )}
          {!allUsersLoading && (!allUsers || allUsers.length === 0) && (
            <motion.p
              className="text-gray-400 text-xl font-light p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}>
              No users found.
            </motion.p>
          )}
          {!allUsersLoading && allUsers && allUsers.length > 0 && (
            <div className="overflow-x-auto">
              <motion.table
                className="min-w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}>
                <thead>
                  <tr className="text-left text-gray-200 text-base">
                    <th className="px-8 py-4">#</th>
                    <th className="px-8 py-4">UID</th>
                    <th className="px-8 py-4">Name</th>
                    <th className="px-8 py-4">Surname</th>
                    <th className="px-8 py-4">Email</th>
                    <th className="px-8 py-4">Gender</th>
                    {showFields.dob && (
                      <th className="px-8 py-4">Date of Birth</th>
                    )}
                    {showFields.joinedAt && (
                      <th className="px-8 py-4">Joined At</th>
                    )}
                    {Object.keys(editedUsers).some(
                      (uid) =>
                        editedUsers[uid] &&
                        Object.keys(editedUsers[uid]).length > 1
                    ) && <th className="px-8 py-4">Actions</th>}
                  </tr>
                </thead>
                <motion.tbody
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { staggerChildren: 0.1 },
                    },
                  }}>
                  {allUsers.map((u, index) => {
                    const hasChanges =
                      editedUsers[u.uid] &&
                      Object.keys(editedUsers[u.uid]).length > 1;
                    const globalIndex = (page - 1) * pageSize + index + 1;
                    return (
                      <motion.tr
                        key={u.uid}
                        className="border-t border-white/10 hover:bg-[#131313]/50 rounded-md"
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          visible: { opacity: 1, y: 0 },
                        }}>
                        <td className="px-8 py-4 text-gray-300 text-base">
                          {globalIndex}
                        </td>
                        <td className="px-8 py-4 text-gray-300 text-base">
                          {u.uid.slice(0, 8)}...
                        </td>
                        <td className="px-8 py-4">
                          <input
                            type="text"
                            value={editedUsers[u.uid]?.name ?? u.name}
                            onChange={(e) =>
                              handleInputChange(u, "name", e.target.value)
                            }
                            className="bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full h-10"
                          />
                        </td>
                        <td className="px-8 py-4">
                          <input
                            type="text"
                            value={editedUsers[u.uid]?.surname ?? u.surname}
                            onChange={(e) =>
                              handleInputChange(u, "surname", e.target.value)
                            }
                            className="bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full h-10"
                          />
                        </td>
                        <td className="px-8 py-4">
                          <input
                            type="email"
                            value={editedUsers[u.uid]?.email ?? u.email}
                            onChange={(e) =>
                              handleInputChange(u, "email", e.target.value)
                            }
                            className="bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full h-10"
                          />
                        </td>
                        <td className="px-8 py-4">
                          <select
                            value={editedUsers[u.uid]?.gender ?? u.gender}
                            onChange={(e) =>
                              handleInputChange(u, "gender", e.target.value)
                            }
                            className="bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full h-10">
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="non-binary">Non-binary</option>
                          </select>
                        </td>
                        {showFields.dob && (
                          <td className="px-8 py-4">
                            <input
                              type="date"
                              value={formatDateForInput(
                                editedUsers[u.uid]?.dob ?? u.dob
                              )}
                              onChange={(e) =>
                                handleInputChange(u, "dob", e.target.value)
                              }
                              className="bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full h-10"
                            />
                          </td>
                        )}
                        {showFields.joinedAt && (
                          <td className="px-8 py-4 text-gray-300 text-base">
                            {formatDate(u.joinedAt)}
                          </td>
                        )}
                        {hasChanges && (
                          <td className="px-8 py-4 flex gap-4">
                            <button
                              onClick={() => handleSaveUser(u.uid)}
                              className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-full hover:bg-blue-700 text-base h-10">
                              Save
                            </button>
                            <button
                              onClick={() => handleResetUser(u.uid)}
                              className="text-base text-gray-400 hover:text-white px-4 py-2 rounded-full transition h-10">
                              Reset
                            </button>
                          </td>
                        )}
                      </motion.tr>
                    );
                  })}
                </motion.tbody>
              </motion.table>
            </div>
          )}
          <motion.div
            className="flex justify-between mt-8 items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}>
            <button
              onClick={handlePrevPage}
              disabled={page === 1}
              className="bg-blue-600 text-white font-semibold text-base px-6 py-3 rounded-full hover:bg-blue-700 transition-all disabled:opacity-50 h-12">
              Previous
            </button>
            <span className="text-gray-400 text-base">
              Showing {(page - 1) * pageSize + 1} to{" "}
              {page * pageSize > (allUsers?.length || 0)
                ? allUsers?.length
                : page * pageSize}{" "}
              of {allUsers?.length || 0} results
            </span>
            <div className="flex gap-4 items-center">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value));
                  setPage(1);
                  setLastDoc(null);
                  setPrevDocs([]);
                  refetch();
                }}
                className="bg-[#131313] backdrop-blur-md text-white px-6 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 h-12">
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
              </select>
              <button
                onClick={handleNextPage}
                disabled={allUsers && allUsers.length < pageSize}
                className="bg-blue-600 text-white font-semibold text-base px-6 py-3 rounded-full hover:bg-blue-700 transition-all disabled:opacity-50 h-12">
                Next
              </button>
            </div>
          </motion.div>
        </motion.section>
      </motion.div>
    </>
  );
}

export default Admin;
