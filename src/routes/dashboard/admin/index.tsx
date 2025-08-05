import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
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
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/admin/")({
  component: Admin,
});

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

function Admin() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedUser, setEditedUser] = useState<Partial<UserData>>({});
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    surname?: string;
    gender?: string;
    dob?: string;
  }>({});
  const [rowsPerPage, setRowsPerPage] = useState<number>(15);
  const [currentPage, setCurrentPage] = useState<number>(1);
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
      navigate({ to: "/dashboard" });
    }
  }, [user, userData, navigate]);

  const { data: allUsers, isLoading: isUsersLoading } = useQuery<UserData[]>({
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

  const filteredUsers = useMemo(() => {
    if (!Array.isArray(allUsers)) return [];
    let result = allUsers;
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.uid.includes(searchLower) ||
          u.name.toLowerCase().includes(searchLower) ||
          u.surname.toLowerCase().includes(searchLower)
      );
    }
    if (filterGender) {
      result = result.filter((u) => u.gender === filterGender);
    }
    return result;
  }, [allUsers, searchTerm, filterGender]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterGender, rowsPerPage]);

  const updateUserMutation = useMutation({
    mutationFn: async (updatedUser: Partial<UserData> & { uid: string }) => {
      const errors: {
        name?: string;
        surname?: string;
        gender?: string;
        dob?: string;
      } = {};
      if (!updatedUser.name?.trim()) {
        errors.name = "Name is required";
      } else if (updatedUser.name.length < 2) {
        errors.name = "Name must be at least 2 characters";
      }
      if (!updatedUser.surname?.trim()) {
        errors.surname = "Surname is required";
      } else if (updatedUser.surname.length < 2) {
        errors.surname = "Surname must be at least 2 characters";
      }
      if (
        updatedUser.gender &&
        !["male", "female"].includes(updatedUser.gender)
      ) {
        errors.gender = "Invalid gender selection";
      }
      if (updatedUser.dob !== undefined && updatedUser.dob !== null) {
        const dob =
          typeof updatedUser.dob === "string"
            ? new Date(updatedUser.dob)
            : updatedUser.dob.toDate();
        if (
          isNaN(dob.getTime()) ||
          dob > new Date() ||
          dob < new Date("1900-01-01")
        ) {
          errors.dob = "Invalid date of birth";
        }
      }
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        throw new Error("Please fix validation errors");
      }

      const userDocRef = doc(db, "users", updatedUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) throw new Error("User not found");
      const existingData = userDoc.data() as UserData;
      const dobValue =
        updatedUser.dob === null
          ? null
          : updatedUser.dob
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
      setEditedUser({});
      setValidationErrors({});
      setIsModalOpen(false);
    },
    onError: (error: any) =>
      toast.error(error.message || "Failed to update user"),
  });

  const handleViewUser = (user: UserData) => {
    setSelectedUser(user);
    setEditedUser({
      uid: user.uid,
      name: user.name,
      surname: user.surname,
      gender: user.gender,
      dob: user.dob,
    });
    setIsModalOpen(true);
  };

  const formatDate = (timestamp: Timestamp | null) =>
    timestamp ? timestamp.toDate().toLocaleDateString("en-ZA") : "-";

  const formatDateForInput = (dob: Timestamp | null): string =>
    dob ? dob.toDate().toISOString().split("T")[0] : "";

  // Check if changes have been made
  const hasChanges = useMemo(() => {
    if (!selectedUser) return false;
    return (
      editedUser.name !== selectedUser.name ||
      editedUser.surname !== selectedUser.surname ||
      editedUser.gender !== selectedUser.gender ||
      (editedUser.dob &&
        selectedUser.dob &&
        formatDateForInput(editedUser.dob as Timestamp) !==
          formatDateForInput(selectedUser.dob)) ||
      (!editedUser.dob && selectedUser.dob) ||
      (editedUser.dob && !selectedUser.dob)
    );
  }, [editedUser, selectedUser]);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard
      .writeText(email)
      .then(() => {
        toast.success("Email copied to clipboard!");
      })
      .catch((err) => {
        toast.error("Failed to copy email.");
        console.error("Copy failed:", err);
      });
  };

  return (
    <div className="font-light max-w-full mx-auto md:px-4 py-8 min-h-screen text-white ">
      <title>DrugWise - Admin User Management</title>
      <h1 className="text-3xl font-bold mb-8 text-center sm:text-left bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
        User Management
      </h1>
      <p className="text-neutral-500 mb-8 font-light">
        Manage users, edit their details, and view their information.
      </p>

      <div className="overflow-x-auto rounded-xl border border-neutral-700 bg-neutral-800 shadow-inner">
        <table className="min-w-full text-sm text-left text-neutral-300 divide-y divide-neutral-700">
          <thead className="bg-neutral-700/50">
            <tr>
              <th colSpan={8} className="px-6 py-4 font-semibold">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="relative w-full sm:w-3/4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="Search by UID, Name, or Surname..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 text-base text-white rounded-lg shadow-sm border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-light"
                    />
                  </div>
                  <select
                    value={filterGender}
                    onChange={(e) => setFilterGender(e.target.value)}
                    className="w-full sm:w-1/4 px-3 py-2.5 bg-neutral-900 text-base text-white rounded-lg shadow-sm border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-light">
                    <option value="">All Genders</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  <span className="text-neutral-300 font-semibold">
                    {filteredUsers.length} total
                  </span>
                </div>
              </th>
            </tr>
            <tr>
              <th className="px-6 py-4 font-semibold">No.</th>
              <th className="px-6 py-4 font-semibold">UID</th>
              <th className="px-6 py-4 font-semibold">Name</th>
              <th className="px-6 py-4 font-semibold">Surname</th>
              <th className="px-6 py-4 font-semibold">Email</th>
              <th className="px-6 py-4 font-semibold">Gender</th>
              <th className="px-6 py-4 font-semibold">Date of Birth</th>
              <th className="px-6 py-4 font-semibold">Joined At</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {isUsersLoading ? (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="border-b border-neutral-700">
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-neutral-500 font-light">
                    Loading users...
                  </td>
                </motion.tr>
              ) : filteredUsers.length === 0 ? (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="border-b border-neutral-700">
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-neutral-500 font-light">
                    No users found matching the search criteria.
                  </td>
                </motion.tr>
              ) : (
                paginatedUsers.map((u, index) => (
                  <motion.tr
                    key={u.uid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="border-b border-neutral-700 hover:bg-neutral-700 cursor-pointer"
                    onClick={() => handleViewUser(u)}>
                    <td className="px-6 py-4 font-semibold">
                      {(currentPage - 1) * rowsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {u.uid.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 font-semibold">{u.name}</td>
                    <td className="px-6 py-4 font-semibold">{u.surname}</td>
                    <td className="px-6 py-4 text-neutral-500">{u.email}</td>
                    <td className="px-6 py-4 font-semibold">
                      {u.gender || "-"}
                    </td>
                    <td className="px-6 py-4">{formatDate(u.dob)}</td>
                    <td className="px-6 py-4">{formatDate(u.joinedAt)}</td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {!(isUsersLoading || filteredUsers.length === 0) && (
        <div className="flex items-center justify-between mt-4 text-[#999] font-light">
          <div className="text-sm">
            Rows per page
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="ml-2 px-2 py-1 bg-[#1A1A1A] text-white rounded focus:outline-none">
              {[5, 10, 15, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-2 py-1 rounded hover:bg-[#1A1A1A] disabled:opacity-50">
              <ChevronLeft size="16" />
            </button>
            <span className="text-sm">
              {currentPage} / {totalPages || 1}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-2 py-1 rounded hover:bg-[#1A1A1A] disabled:opacity-50">
              <ChevronRight size="16" />
            </button>
          </div>
        </div>
      )}

      {isModalOpen && selectedUser && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => {
            setIsModalOpen(false);
            setEditedUser({});
            setValidationErrors({});
          }}>
          <motion.div
            className="relative w-full max-w-md bg-neutral-800 rounded-2xl shadow-lg p-6 md:p-8 animate-slide-up overflow-auto max-h-[85vh] border border-neutral-700"
            initial={{ y: 50, opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              transition: { type: "spring", stiffness: 100, damping: 15 },
            }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-2 right-2 text-neutral-400 hover:text-white text-3xl font-light p-2 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors duration-200"
              onClick={() => {
                setIsModalOpen(false);
                setEditedUser({});
                setValidationErrors({});
              }}
              aria-label="Close">
              <X />
            </button>

            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}>
              <motion.h3 className="text-2xl sm:text-2xl font-bold mb-6 text-center sm:text-left bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
                Edit User Profile
              </motion.h3>
            </motion.div>

            {Object.keys(validationErrors).length > 0 && (
              <motion.div
                className="text-red-400 text-sm mb-5 p-3 rounded-xl bg-red-900/20 backdrop-blur-sm border border-red-900/30 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}>
                Please fix the validation errors.
              </motion.div>
            )}

            <motion.form
              onSubmit={(e) => e.preventDefault()}
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}>
              <label className="block">
                <span className="text-neutral-200 font-semibold mb-2 block">
                  Name <span className="text-red-400">*</span>
                </span>
                <input
                  type="text"
                  value={editedUser.name ?? selectedUser.name}
                  onChange={(e) =>
                    setEditedUser({ ...editedUser, name: e.target.value })
                  }
                  className="w-full rounded-xl bg-neutral-800/50 text-white px-4 py-3 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter name"
                  aria-invalid={!!validationErrors.name}
                  aria-describedby="name-error"
                />
                <AnimatePresence>
                  {validationErrors.name && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-red-400 text-sm mt-1"
                      id="name-error">
                      {validationErrors.name}
                    </motion.p>
                  )}
                </AnimatePresence>
              </label>

              <label className="block">
                <span className="text-neutral-200 font-semibold mb-2 block">
                  Surname <span className="text-red-400">*</span>
                </span>
                <input
                  type="text"
                  value={editedUser.surname ?? selectedUser.surname}
                  onChange={(e) =>
                    setEditedUser({ ...editedUser, surname: e.target.value })
                  }
                  className="w-full rounded-xl bg-neutral-800/50 text-white px-4 py-3 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter surname"
                  aria-invalid={!!validationErrors.surname}
                  aria-describedby="surname-error"
                />
                <AnimatePresence>
                  {validationErrors.surname && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-red-400 text-sm mt-1"
                      id="surname-error">
                      {validationErrors.surname}
                    </motion.p>
                  )}
                </AnimatePresence>
              </label>

              <label className="block">
                <span className="text-neutral-200 font-semibold mb-2 block">
                  Email <span className="text-red-400">*</span>
                </span>
                <div className="relative">
                  <input
                    type="email"
                    value={selectedUser.email}
                    readOnly
                    className="w-full rounded-xl bg-neutral-800/50 text-white px-4 py-3 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyEmail(selectedUser.email)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors duration-200"
                    aria-label="Copy email">
                    <Copy size={18} />
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="text-neutral-200 font-semibold mb-2 block">
                  Gender <span className="text-red-400">*</span>
                </span>
                <select
                  value={editedUser.gender ?? selectedUser.gender}
                  onChange={(e) =>
                    setEditedUser({ ...editedUser, gender: e.target.value })
                  }
                  className="w-full rounded-xl bg-neutral-800/50 text-white px-4 py-3 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  aria-invalid={!!validationErrors.gender}
                  aria-describedby="gender-error">
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <AnimatePresence>
                  {validationErrors.gender && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-red-400 text-sm mt-1"
                      id="gender-error">
                      {validationErrors.gender}
                    </motion.p>
                  )}
                </AnimatePresence>
              </label>

              <label className="block">
                <span className="text-neutral-200 font-semibold mb-2 block">
                  Date of Birth <span className="text-red-400">*</span>
                </span>
                <input
                  type="date"
                  value={formatDateForInput(editedUser.dob ?? selectedUser.dob)}
                  onChange={(e) =>
                    setEditedUser({
                      ...editedUser,
                      dob: e.target.value
                        ? Timestamp.fromDate(new Date(e.target.value))
                        : null,
                    })
                  }
                  className="w-full rounded-xl bg-neutral-800/50 text-white px-4 py-3 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  aria-invalid={!!validationErrors.dob}
                  aria-describedby="dob-error"
                />
                <AnimatePresence>
                  {validationErrors.dob && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-red-400 text-sm mt-1"
                      id="dob-error">
                      {validationErrors.dob}
                    </motion.p>
                  )}
                </AnimatePresence>
              </label>

              <label className="block">
                <span className="text-neutral-200 font-semibold mb-2 block">
                  Joined At <span className="text-red-400">*</span>
                </span>
                <input
                  type="text"
                  value={formatDate(selectedUser.joinedAt)}
                  readOnly
                  className="w-full rounded-xl bg-neutral-800/50 text-white px-4 py-3 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </label>

              <label className="block">
                <span className="text-neutral-200 font-semibold mb-2 block">
                  Admin Status <span className="text-red-400">*</span>
                </span>
                <input
                  type="text"
                  value={selectedUser.isAdmin ? "Admin" : "User"}
                  readOnly
                  className="w-full rounded-xl bg-neutral-800/50 text-white px-4 py-3 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </label>

              <motion.div
                className="flex justify-end gap-3 mt-6"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: { staggerChildren: 0.1 },
                  },
                }}>
                <motion.button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditedUser({});
                    setValidationErrors({});
                  }}
                  className="px-4 py-2 rounded-xl bg-neutral-500/10 text-neutral-400 border-neutral-500/20 hover:bg-neutral-700 transition-colors duration-200"
                  variants={{
                    hidden: { opacity: 0, scale: 0.95 },
                    visible: { opacity: 1, scale: 1 },
                  }}>
                  Cancel
                </motion.button>
                <motion.button
                  type="button"
                  disabled={!hasChanges || updateUserMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-lime-500 text-white transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed hover:from-green-600 hover:to-lime-600"
                  onClick={() =>
                    updateUserMutation.mutate({
                      ...editedUser,
                      uid: selectedUser.uid,
                    })
                  }
                  variants={{
                    hidden: { opacity: 0, scale: 0.95 },
                    visible: { opacity: 1, scale: 1 },
                  }}>
                  {updateUserMutation.isPending ? "Saving..." : "Save"}
                </motion.button>
              </motion.div>
            </motion.form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default Admin;
