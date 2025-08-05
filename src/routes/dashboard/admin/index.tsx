import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
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
import UsersTable from "@/components/admin/users/UsersTable";
import UserModal from "@/components/admin/users/UserModal";
import AdminUsersSkeleton from "@/components/admin/users/AdminUsersSkeleton";

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
        setDoc(
          doc(db, "users", currentUser.uid),
          { lastLogin: Timestamp.fromDate(new Date()) },
          { merge: true }
        );
      }
    });
    return () => unsubscribe();
  }, []);

  const { data: userData, isLoading: isUserDataLoading } = useQuery<UserData>({
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
    if (user && userData && !userData.isAdmin && !isUserDataLoading) {
      toast.error("You do not have permission to access this page.");
      navigate({ to: "/dashboard" });
    }
  }, [user, userData, isUserDataLoading, navigate]);

  const { data: allUsers = [], isLoading: isUsersLoading } = useQuery<
    UserData[]
  >({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!user || !userData?.isAdmin) return [];
      const usersRef = collection(db, "users");
      const q = query(usersRef, orderBy("joinedAt", "desc"));
      const snapshot = await getDocs(q);
      const users = snapshot.docs.map((doc) => doc.data() as UserData);
      return Array.isArray(users) ? users : [];
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

  const totalPages = Math.ceil((filteredUsers.length || 0) / rowsPerPage);
  const paginatedUsers = useMemo(() => {
    if (!Array.isArray(filteredUsers)) return [];
    const start = (currentPage - 1) * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, currentPage, rowsPerPage]);

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

  if (isUsersLoading || isUserDataLoading || !userData?.isAdmin) {
    return <AdminUsersSkeleton />;
  }

  return (
    <motion.div
      className="max-w-full mx-auto md:px-4 py-8 min-h-screen text-white "
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}>
      <title>DrugWise - Admin User Management</title>
      <motion.h1
        className="text-2xl max-sm:text-xl font-semibold mb-2 text-center sm:text-left text-gray-100"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}>
        User Management
      </motion.h1>
      <motion.p
        className="text-sm text-gray-400 mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}>
        Manage users, edit their details, and view their information.
      </motion.p>
      <UsersTable
        users={paginatedUsers}
        totalUsers={filteredUsers.length}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterGender={filterGender}
        setFilterGender={setFilterGender}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        isLoading={isUsersLoading}
        onViewUser={handleViewUser}
      />
      <UserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditedUser({});
          setValidationErrors({});
        }}
        selectedUser={selectedUser}
        editedUser={editedUser}
        setEditedUser={setEditedUser}
        validationErrors={validationErrors}
        updateMutation={updateUserMutation}
      />
    </motion.div>
  );
}

export default Admin;
