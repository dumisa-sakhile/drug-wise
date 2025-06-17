import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { auth, db } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  setDoc,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";

interface UserData {
  uid: string;
  email: string;
  gender: string;
  dob: Timestamp | null;
  name: string;
  surname: string;
  joinedAt: Timestamp;
  isAdmin: boolean;
}

export const Route = createFileRoute("/auth/admin")({
  component: Admin,
});

function Admin() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [editedUsers, setEditedUsers] = useState<{
    [uid: string]: Partial<UserData> & { uid: string };
  }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const lastLogin = Timestamp.fromDate(new Date());
        setDoc(
          doc(db, "users", currentUser.uid),
          { lastLogin },
          { merge: true }
        );
      }
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
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (user && userData && !userData.isAdmin) {
      toast.error("You do not have permission to access this page.");
      navigate({ to: "/auth/profile" });
    }
  }, [user, userData, navigate]);

  const { data: allUsers, isLoading: allUsersLoading } = useQuery<UserData[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!user || !userData?.isAdmin) return [];
      const usersRef = collection(db, "users");
      const q = query(usersRef, orderBy("joinedAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => doc.data() as UserData);
    },
    enabled: !!user && userData?.isAdmin,
    refetchOnWindowFocus: false,
  });

  const filteredUsers = allUsers?.filter((u) => {
    const matchesSearchTerm =
      u.uid.includes(searchTerm) ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.surname.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = filterGender ? u.gender === filterGender : true;
    return matchesSearchTerm && matchesGender;
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
    const user = filteredUsers?.find((u) => u.uid === uid);
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

  const validateName = (value: string) => value.trim().length >= 2;
  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validateGender = (gender: string) =>
    ["male", "female"].includes(gender);
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
  };

  const tableRowVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  if (!user)
    return (
      <motion.div
        className="w-full min-h-screen flex items-center justify-center bg-[#1a1a1a]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}>
        <p className="text-white text-xl font-sans font-medium">
          Please log in to access this page
        </p>
      </motion.div>
    );

  if (!userData?.isAdmin) return null;

  return (
    <>
      <title>Drug Wise - Admin Dashboard</title>
      <motion.div
        className="w-full min-h-screen flex flex-col gap-8 py-12 px-8 mx-auto max-w-7xl text-white "
        variants={containerVariants}
        initial="hidden"
        animate="visible">
        {/* Header */}
        <motion.header
          variants={itemVariants}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-[#222222] p-6 rounded-xl shadow-lg border border-white/10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white font-sans">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-300 font-sans mt-2">
              Welcome, {user.displayName} to the Drug Wise Admin Dashboard
            </p>
          </div>
          <button
            onClick={() => navigate({ to: "/auth/profile" })}
            className="bg-blue-600 hover:bg-blue-700 text-white font-sans font-semibold px-6 py-3 rounded-lg transition-all shadow-md">
            &larr; Back to Profile
          </button>
        </motion.header>

        {/* Table */}
        {allUsersLoading ? (
          <motion.div
            className="flex justify-center items-center p-8 bg-[#222222] rounded-xl shadow-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}>
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
        ) : !filteredUsers || filteredUsers.length === 0 ? (
          <motion.p
            className="text-white text-lg text-center py-8 bg-[#222222] rounded-xl shadow-lg font-sans"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}>
            No users found.
          </motion.p>
        ) : (
          <div className="overflow-x-auto rounded-xl shadow-lg bg-[#222222] border border-white/10">
            <table className="min-w-full text-sm font-sans">
              <thead>
                <tr className="text-left text-gray-300 bg-[#2a2a2a]">
                  <th className="px-6 py-4" colSpan={9}>
                    <motion.div
                      className="relative w-full flex flex-col sm:flex-row gap-4 items-center"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}>
                      <div className="relative w-full sm:w-3/4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by UID, Name, or Surname..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-[#333333] text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                        />
                      </div>
                      <motion.select
                        value={filterGender}
                        onChange={(e) => setFilterGender(e.target.value)}
                        className="w-full sm:w-1/4 px-4 py-3 bg-[#333333] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}>
                        <option value="">All Genders</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </motion.select>
                    </motion.div>
                  </th>
                </tr>
                <tr className="text-left text-gray-300 bg-[#2a2a2a] border-b border-white/10">
                  <th className="px-6 py-4 font-medium">No.</th>
                  <th className="px-6 py-4 font-medium">UID</th>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Surname</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Gender</th>
                  <th className="px-6 py-4 font-medium">Date of Birth</th>
                  <th className="px-6 py-4 font-medium">Joined At</th>
                  {Object.keys(editedUsers).some(
                    (uid) =>
                      editedUsers[uid] &&
                      Object.keys(editedUsers[uid]).length > 1
                  ) && <th className="px-6 py-4 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredUsers.map((u, index) => {
                    const hasChanges =
                      editedUsers[u.uid] &&
                      Object.keys(editedUsers[u.uid]).length > 1;
                    return (
                      <motion.tr
                        key={u.uid}
                        variants={tableRowVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, y: 10 }}
                        className="hover:bg-[#333333] transition-all border-b border-white/10 last:border-none">
                        <td className="px-6 py-4 text-gray-300">{index + 1}</td>
                        <td className="px-6 py-4 text-white">
                          {u.uid.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4">
                          <motion.input
                            type="text"
                            value={editedUsers[u.uid]?.name ?? u.name}
                            onChange={(e) =>
                              handleInputChange(u, "name", e.target.value)
                            }
                            className="w-full px-3 py-2 bg-[#333333] text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans border border-white/10"
                            placeholder="Enter name"
                            whileFocus={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <motion.input
                            type="text"
                            value={editedUsers[u.uid]?.surname ?? u.surname}
                            onChange={(e) =>
                              handleInputChange(u, "surname", e.target.value)
                            }
                            className="w-full px-3 py-2 bg-[#333333] text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans border border-white/10"
                            placeholder="Enter surname"
                            whileFocus={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <motion.input
                            type="email"
                            value={editedUsers[u.uid]?.email ?? u.email}
                            readOnly
                            className="w-full px-3 py-2 bg-[#333333] text-gray-400 placeholder-gray-400 rounded-lg focus:outline-none cursor-not-allowed font-sans border border-white/10"
                            placeholder="Enter email"
                            whileFocus={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <motion.select
                            value={editedUsers[u.uid]?.gender ?? u.gender}
                            onChange={(e) =>
                              handleInputChange(u, "gender", e.target.value)
                            }
                            className="w-full px-3 py-2 bg-[#333333] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans border border-white/10"
                            whileFocus={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}>
                            <option value="">Select</option>
                            <option value="male">M</option>
                            <option value="female">F</option>
                          </motion.select>
                        </td>
                        <td className="px-6 py-4">
                          <motion.input
                            type="date"
                            value={formatDateForInput(
                              editedUsers[u.uid]?.dob ?? u.dob
                            )}
                            onChange={(e) =>
                              handleInputChange(u, "dob", e.target.value)
                            }
                            className="w-full px-3 py-2 bg-[#333333] text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans border border-white/10"
                            whileFocus={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                          />
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {formatDate(u.joinedAt)}
                        </td>
                        {hasChanges && (
                          <td className="px-6 py-4 flex gap-3">
                            <motion.span
                              onClick={() => handleSaveUser(u.uid)}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-sans font-medium cursor-pointer transition-all"
                              title="Save changes"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}>
                              Save
                            </motion.span>
                            <motion.span
                              onClick={() => handleResetUser(u.uid)}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-sans font-medium cursor-pointer transition-all"
                              title="Cancel changes"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}>
                              Cancel
                            </motion.span>
                          </td>
                        )}
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
            <motion.div
              className="p-6 text-gray-300 text-sm text-center font-sans"
              variants={itemVariants}>
              Showing {filteredUsers?.length || 0} of {allUsers?.length || 0}{" "}
              users
            </motion.div>
          </div>
        )}
      </motion.div>
    </>
  );
}

export default Admin;
