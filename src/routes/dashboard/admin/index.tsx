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
import { Search, Check, X } from "lucide-react";

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

interface Medication {
  id: string;
  userId: string;
  medicationName: string;
  status: string;
  submittedAt: Timestamp;
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

  const { data: medications, isLoading: loadingMedications } = useQuery<
    Medication[]
  >({
    queryKey: ["medications", selectedUser?.uid],
    queryFn: async () => {
      if (!selectedUser) return [];
      const q = query(
        collection(db, "medications"),
        orderBy("submittedAt", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }) as Medication)
        .filter((med) => med.userId === selectedUser.uid);
    },
    enabled: !!selectedUser?.uid,
  });

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

  return (
    <div className="font-light max-w-full mx-auto md:px-4 py-8 min-h-screen text-white">
      <title>DrugWise - Admin User Management</title>
      <h1 className="text-3xl font-bold mb-8 text-center sm:text-left bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
        User Management
      </h1>
      <p className="text-neutral-500 mb-8 font-light">
        Manage users, edit their details, and view their information.
      </p>

      <div className="overflow-x-auto rounded-xl border border-neutral-700 bg-neutral-800 shadow-inner">
        <div className="flex flex-col sm:flex-row gap-4 items-center p-4 bg-neutral-800">
          <div className="relative w-full sm:w-3/4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search by UID, Name, or Surname..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-900 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-light"
            />
          </div>
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="w-full sm:w-1/4 px-4 py-2 bg-neutral-900 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-light">
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <table className="min-w-full text-sm text-left text-neutral-300">
          <thead className="bg-neutral-700/50">
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
              {filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((u, index) => (
                  <motion.tr
                    key={u.uid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="border-b border-neutral-700 hover:bg-neutral-700 cursor-pointer"
                    onClick={() => handleViewUser(u)}>
                    <td className="px-6 py-4 font-semibold">{index + 1}</td>
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
              ) : (
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
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 sm:p-6 font-light"
          onClick={() => setIsModalOpen(false)}>
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 80, damping: 15 }}
            className="bg-neutral-800 rounded-2xl shadow-lg p-6 sm:p-8 w-full max-w-lg border border-neutral-700 relative max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-4 right-4 text-neutral-400 hover:text-white text-2xl font-light p-2 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors duration-200"
              onClick={() => {
                setIsModalOpen(false);
                setEditedUser({});
                setValidationErrors({});
              }}
              aria-label="Close modal">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-semibold mb-6 text-center sm:text-left bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
              User Details
            </h2>

            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-neutral-300 mb-1.5 text-sm font-semibold">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editedUser.name ?? selectedUser.name}
                    onChange={(e) =>
                      setEditedUser({ ...editedUser, name: e.target.value })
                    }
                    className={`w-full px-3 py-2.5 bg-neutral-900 text-base text-white rounded-lg shadow-sm border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-light ${
                      validationErrors.name ? "border-red-400" : ""
                    }`}
                  />
                  {validationErrors.name && (
                    <p className="text-red-400 text-xs mt-1 font-light">
                      {validationErrors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1.5 text-sm font-semibold">
                    Surname
                  </label>
                  <input
                    type="text"
                    value={editedUser.surname ?? selectedUser.surname}
                    onChange={(e) =>
                      setEditedUser({ ...editedUser, surname: e.target.value })
                    }
                    className={`w-full px-3 py-2.5 bg-neutral-900 text-base text-white rounded-lg shadow-sm border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-light ${
                      validationErrors.surname ? "border-red-400" : ""
                    }`}
                  />
                  {validationErrors.surname && (
                    <p className="text-red-400 text-xs mt-1 font-light">
                      {validationErrors.surname}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1.5 text-sm font-semibold">
                    Email
                  </label>
                  <p className="w-full px-3 py-2.5 bg-neutral-900 text-base text-neutral-500 rounded-lg shadow-sm border border-neutral-600 font-light">
                    {selectedUser.email}
                  </p>
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1.5 text-sm font-semibold">
                    Gender
                  </label>
                  <select
                    value={editedUser.gender ?? selectedUser.gender}
                    onChange={(e) =>
                      setEditedUser({ ...editedUser, gender: e.target.value })
                    }
                    className={`w-full px-3 py-2.5 bg-neutral-900 text-base text-white rounded-lg shadow-sm border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-light ${
                      validationErrors.gender ? "border-red-400" : ""
                    }`}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  {validationErrors.gender && (
                    <p className="text-red-400 text-xs mt-1 font-light">
                      {validationErrors.gender}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1.5 text-sm font-semibold">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formatDateForInput(
                      editedUser.dob ?? selectedUser.dob
                    )}
                    onChange={(e) =>
                      setEditedUser({
                        ...editedUser,
                        dob: e.target.value
                          ? Timestamp.fromDate(new Date(e.target.value))
                          : null,
                      })
                    }
                    className={`w-full px-3 py-2.5 bg-neutral-900 text-base text-white rounded-lg shadow-sm border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-light ${
                      validationErrors.dob ? "border-red-400" : ""
                    }`}
                  />
                  {validationErrors.dob && (
                    <p className="text-red-400 text-xs mt-1 font-light">
                      {validationErrors.dob}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1.5 text-sm font-semibold">
                    Joined At
                  </label>
                  <p className="w-full px-3 py-2.5 bg-neutral-900 text-base text-neutral-500 rounded-lg shadow-sm border border-neutral-600 font-light">
                    {formatDate(selectedUser.joinedAt)}
                  </p>
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1.5 text-sm font-semibold">
                    Admin Status
                  </label>
                  <p className="w-full px-3 py-2.5 bg-neutral-900 text-base text-neutral-500 rounded-lg shadow-sm border border-neutral-600 font-light">
                    {selectedUser.isAdmin ? "Admin" : "User"}
                  </p>
                </div>
              </div>

              <div className="border-t border-neutral-700 pt-6">
                <h3 className="text-lg font-semibold mb-3 text-neutral-300">
                  Submitted Medications
                </h3>
                <div className="overflow-x-auto rounded-xl border border-neutral-700 bg-neutral-800 shadow-inner">
                  <table className="min-w-full text-sm text-left text-neutral-300 divide-y divide-neutral-700">
                    <thead className="bg-neutral-700/50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 font-semibold">
                          Medication Name
                        </th>
                        <th className="px-4 sm:px-6 py-3 font-semibold">
                          Submitted At
                        </th>
                        <th className="px-4 sm:px-6 py-3 font-semibold">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingMedications ? (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-4 sm:px-6 py-8 text-center text-neutral-500 font-light">
                            Loading medications...
                          </td>
                        </tr>
                      ) : medications && medications.length > 0 ? (
                        medications.map((med) => (
                          <tr
                            key={med.id}
                            className="border-b border-neutral-700 min-w-0">
                            <td className="px-4 sm:px-6 py-4 font-semibold">
                              {med.medicationName}
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              {formatDate(med.submittedAt)}
                            </td>
                            <td className="px-4 sm:px-6 py-4">{med.status}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-4 sm:px-6 py-8 text-center text-neutral-500 font-light">
                            No medications found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                className="px-5 py-2.5 rounded-lg bg-neutral-500/10 text-neutral-400 border border-neutral-500/20 hover:bg-neutral-700 text-sm font-semibold transition-colors duration-200"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditedUser({});
                  setValidationErrors({});
                }}>
                Close
              </button>
              <button
                className="px-5 py-2.5 rounded-lg bg-lime-600 hover:bg-lime-700 text-white text-sm font-semibold flex items-center gap-2 shadow-md transition-colors duration-200"
                onClick={() =>
                  updateUserMutation.mutate({
                    ...editedUser,
                    uid: selectedUser.uid,
                  })
                }
                disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default Admin;
