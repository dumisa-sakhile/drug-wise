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
import { toast } from "react-hot-toast";
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

export const Route = createFileRoute("/dashboard/admin/")({
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
      navigate({ to: "/dashboard" });
    }
  }, [user, userData, navigate]);

  const { data: allUsers } = useQuery<UserData[]>({
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

  const filteredUsers = Array.isArray(allUsers)
    ? allUsers.filter((u) => {
        const matchesSearchTerm =
          u.uid.includes(searchTerm) ||
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.surname.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGender = filterGender ? u.gender === filterGender : true;
        return matchesSearchTerm && matchesGender;
      })
    : [];

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

  const tableRowVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3 },
    },
  };

  const handleSaveUser = (uid: string) => {
    const updatedData = editedUsers[uid];
    if (!updatedData) return toast.error("No changes to save.");
    const user = filteredUsers.find((u) => u.uid === uid);
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
    toast.success("Changes reset.");
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

  return (
    <div className="p-4 text-white ">
      <h1 className="text-xl mb-4 roboto-condensed-bold">Users Management</h1>
      <p className="text-[#999] mb-6 roboto-condensed-light">
        Manage users, edit their details, and view their information.
      </p>

      <div className="overflow-x-auto rounded-lg border border-[#333333]">
        <div className="flex flex-col sm:flex-row gap-4 items-center p-4 bg-[#131313]">
          <div className="relative w-full sm:w-3/4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#999]" />
            <input
              type="text"
              placeholder="Search by UID, Name, or Surname..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1A1A1A] text-white rounded focus:outline-none roboto-condensed-light"
            />
          </div>
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="w-full sm:w-1/4 px-4 py-2 bg-[#1A1A1A] text-white rounded focus:outline-none roboto-condensed-light">
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[#999] bg-[#131313] border-b border-[#333333] roboto-condensed-bold">
              <th className="px-6 py-4">No.</th>
              <th className="px-6 py-4">UID</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Surname</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Gender</th>
              <th className="px-6 py-4">Date of Birth</th>
              <th className="px-6 py-4">Joined At</th>
              {Object.keys(editedUsers).some(
                (uid) =>
                  editedUsers[uid] && Object.keys(editedUsers[uid]).length > 1
              ) && <th className="px-6 py-4">Actions</th>}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((u, index) => {
                  const hasChanges =
                    editedUsers[u.uid] &&
                    Object.keys(editedUsers[u.uid]).length > 1;
                  return (
                    <motion.tr
                      key={u.uid}
                      variants={tableRowVariants}
                      initial="hidden"
                      animate="visible"
                      className="border-b border-[#333333] hover:bg-[#242424]">
                      <td className="px-6 py-4 text-[#999]">{index + 1}</td>
                      <td className="px-6 py-4 text-white">
                        {u.uid.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editedUsers[u.uid]?.name ?? u.name}
                          onChange={(e) =>
                            handleInputChange(u, "name", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-[#1A1A1A] text-white rounded focus:outline-none roboto-condensed-light"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editedUsers[u.uid]?.surname ?? u.surname}
                          onChange={(e) =>
                            handleInputChange(u, "surname", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-[#1A1A1A] text-white rounded focus:outline-none roboto-condensed-light"
                        />
                      </td>
                      <td className="px-6 py-4 text-[#666]">
                        <input
                          type="email"
                          value={editedUsers[u.uid]?.email ?? u.email}
                          readOnly
                          className="w-full px-3 py-2 bg-[#1A1A1A] text-[#666] rounded focus:outline-none cursor-not-allowed roboto-condensed-light"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={editedUsers[u.uid]?.gender ?? u.gender}
                          onChange={(e) =>
                            handleInputChange(u, "gender", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-[#1A1A1A] text-white rounded focus:outline-none roboto-condensed-light">
                          <option value="">Select</option>
                          <option value="male">M</option>
                          <option value="female">F</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="date"
                          value={formatDateForInput(
                            editedUsers[u.uid]?.dob ?? u.dob
                          )}
                          onChange={(e) =>
                            handleInputChange(u, "dob", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-[#1A1A1A] text-white rounded focus:outline-none roboto-condensed-light"
                        />
                      </td>
                      <td className="px-6 py-4 text-[#999] roboto-condensed-light">
                        {formatDate(u.joinedAt)}
                      </td>
                      {hasChanges && (
                        <td className="px-6 py-4 flex gap-3">
                          <button
                            onClick={() => handleSaveUser(u.uid)}
                            className="px-4 py-2 rounded bg-lime-600 text-white hover:bg-lime-500 roboto-condensed-bold">
                            Save
                          </button>
                          <button
                            onClick={() => handleResetUser(u.uid)}
                            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 roboto-condensed-bold">
                            Cancel
                          </button>
                        </td>
                      )}
                    </motion.tr>
                  );
                })
              ) : (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="border-b border-[#333333]">
                  <td
                    colSpan={9}
                    className="px-6 py-8 text-center text-[#999] roboto-condensed-light">
                    No users found matching the search criteria.
                  </td>
                </motion.tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Admin;
