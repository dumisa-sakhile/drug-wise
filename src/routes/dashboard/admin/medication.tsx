import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db, auth } from "@/config/firebase";
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";

export const Route = createFileRoute("/dashboard/admin/medication")({
  component: AdminMedication,
});

interface Medication {
  id: string;
  medicationName: string;
  description: string;
  userId: string;
  submittedAt: Timestamp;
  status: "approved" | "rejected" | "pending";
  rejectionReason?: string;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
}

interface User {
  id: string;
  uid: string;
  name: string;
  surname: string;
  email: string;
  isAdmin: boolean;
}

function AdminMedication() {
  const [search, setSearch] = useState<string>("");
  const [status, setStatus] = useState<
    "all" | "approved" | "rejected" | "pending"
  >("all");
  const [rowsPerPage, setRowsPerPage] = useState<number>(15);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [modal, setModal] = useState<null | { med: Medication }>(null);
  const [reviewStatus, setReviewStatus] = useState<
    "approved" | "rejected" | "pending"
  >("pending");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const queryClient = useQueryClient();

  // Get current user on component mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch all medications
  const { data: medications, isLoading: isMedicationsLoading } = useQuery<
    Medication[]
  >({
    queryKey: ["allMedications"],
    queryFn: async () => {
      const q = query(
        collection(db, "medications"),
        orderBy("submittedAt", "desc")
      );
      const snap = await getDocs(q);
      return snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Medication[];
    },
    enabled: !!currentUser,
  });

  // Fetch all users for display
  const { data: users, isLoading: isUsersLoading } = useQuery<
    Record<string, User>
  >({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const q = query(collection(db, "users"));
      const snap = await getDocs(q);
      const arr = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      const map: Record<string, User> = {};
      arr.forEach((u) => {
        map[u.uid] = u;
      });
      return map;
    },
    enabled: !!currentUser,
  });

  const isLoading = isMedicationsLoading || isUsersLoading;

  // Filtering
  const filtered = (medications || []).filter((m) => {
    const matchesStatus = status === "all" || m.status === status;
    const user = users?.[m.userId];
    const matchesSearch =
      m.medicationName?.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase()) ||
      user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      user?.surname?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Pagination
  const totalRows = filtered.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const paged = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Approve/Reject mutation
  const mutation = useMutation<
    void,
    Error,
    {
      id: string;
      status: "approved" | "rejected" | "pending";
      rejectionReason: string;
    }
  >({
    mutationFn: async ({ id, status, rejectionReason }) => {
      if (!currentUser) throw new Error("Not authenticated");

      const ref = doc(db, "medications", id);
      const updateData: Partial<Medication> = {
        status,
        reviewedAt: Timestamp.now(),
        reviewedBy: currentUser.uid,
      };

      if (status === "rejected") {
        updateData.rejectionReason = rejectionReason;
      } else {
        updateData.rejectionReason = "";
      }

      await updateDoc(ref, updateData);
    },
    onSuccess: () => {
      toast.success("Status updated successfully!");
      setModal(null);
      setRejectionReason("");
      queryClient.invalidateQueries({ queryKey: ["allMedications"] });
    },
    onError: (err) => {
     
      toast.error(err.message || "Failed to update status");
    },
  });

  function getStatusBadge(status: "approved" | "rejected" | "pending") {
    switch (status) {
      case "approved":
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-[#1A1A1A] text-green-400">
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-[#1A1A1A] text-red-400">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-[#1A1A1A] text-yellow-400">
            Pending
          </span>
        );
    }
  }

  function openModal(med: Medication) {
    setModal({ med });
    setReviewStatus(med.status);
    setRejectionReason(med.rejectionReason || "");
  }

  function handleReview() {
    if (!modal || !currentUser) return;

    // Validate rejection reason if needed
    if (reviewStatus === "rejected" && !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    mutation.mutate({
      id: modal.med.id,
      status: reviewStatus,
      rejectionReason,
    });
  }

  const tableRowVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3 },
    },
  };

  return (
    <div className="p-4 text-white ">
      <h1 className="text-xl mb-4 roboto-condensed-bold">
        Medication Management
      </h1>
      <p className="text-[#999] mb-6 roboto-condensed-light">
        Review and manage user-submitted medications.{" "}
        <span className="text-[#666]">{totalRows} total</span>
      </p>

      <div className="overflow-x-auto rounded-lg border border-[#333333]">
        <div className="flex flex-col sm:flex-row gap-4 items-center p-4 bg-[#141414]">
          <div className="relative w-full sm:w-3/4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#999]" />
            <input
              type="text"
              placeholder="Search by medication, description or user..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-[#1A1A1A] text-white rounded focus:outline-none roboto-condensed-light"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(
                e.target.value as "all" | "approved" | "rejected" | "pending"
              );
              setCurrentPage(1);
            }}
            className="w-full sm:w-1/4 px-4 py-2 bg-[#1A1A1A] text-white rounded focus:outline-none roboto-condensed-light">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[#999] bg-[#141414] border-b border-[#333333] roboto-condensed-bold">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Submitted</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-[#999] roboto-condensed-light">
                    Loading medications...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-[#999] roboto-condensed-light">
                    No medications found
                  </td>
                </tr>
              ) : (
                paged.map((m) => (
                  <motion.tr
                    key={m.id}
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    className="border-b border-[#333333] hover:bg-[#242424]">
                    <td className="px-6 py-4 roboto-condensed-bold">
                      {m.medicationName}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate roboto-condensed-light">
                      {m.description}
                    </td>
                    <td className="px-6 py-4 roboto-condensed-light">
                      {users?.[m.userId]?.name} {users?.[m.userId]?.surname}
                      <div className="text-xs text-[#666]">
                        {users?.[m.userId]?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 roboto-condensed-light">
                      {m.submittedAt?.toDate?.().toLocaleString("en-ZA") || "-"}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(m.status)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openModal(m)}
                        className="text-blue-400 hover:text-blue-300 underline roboto-condensed-bold">
                        Review
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-[#999] roboto-condensed-light">
        <div className="text-sm">
          Rows per page
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
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
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-2 py-1 rounded hover:bg-[#1A1A1A] disabled:opacity-50">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm">
            {currentPage} / {totalPages || 1}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-2 py-1 rounded hover:bg-[#1A1A1A] disabled:opacity-50">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Review Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#141414] rounded-lg shadow-lg p-6 w-full max-w-md border border-[#333333]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white roboto-condensed-bold">
                Review Medication
              </h3>
              <button
                className="text-[#999] hover:text-white"
                onClick={() => setModal(null)}>
                ×
              </button>
            </div>
            <div className="mb-4 space-y-3">
              <div>
                <span className="text-[#999] text-xs roboto-condensed-light">
                  Name
                </span>
                <div className="text-white roboto-condensed-bold">
                  {modal.med.medicationName}
                </div>
              </div>
              <div>
                <span className="text-[#999] text-xs roboto-condensed-light">
                  Description
                </span>
                <div className="text-white roboto-condensed-light">
                  {modal.med.description}
                </div>
              </div>
              <div>
                <span className="text-[#999] text-xs roboto-condensed-light">
                  User
                </span>
                <div className="text-white roboto-condensed-bold">
                  {users?.[modal.med.userId]?.name}{" "}
                  {users?.[modal.med.userId]?.surname}
                </div>
                <div className="text-xs text-[#666] roboto-condensed-light">
                  {users?.[modal.med.userId]?.email}
                </div>
              </div>
              <div>
                <span className="text-[#999] text-xs roboto-condensed-light">
                  Submitted
                </span>
                <div className="text-white roboto-condensed-light">
                  {modal.med.submittedAt?.toDate?.().toLocaleString("en-ZA") ||
                    "-"}
                </div>
              </div>
              <div>
                <span className="text-[#999] text-xs roboto-condensed-light">
                  Current Status
                </span>
                <div>{getStatusBadge(modal.med.status)}</div>
              </div>
              <div>
                <span className="text-[#999] text-xs roboto-condensed-light">
                  Change Status To
                </span>
                <select
                  value={reviewStatus}
                  onChange={(e) =>
                    setReviewStatus(
                      e.target.value as "approved" | "rejected" | "pending"
                    )
                  }
                  className="w-full mt-1 bg-[#1A1A1A] text-white rounded px-3 py-2 border border-[#333333] focus:outline-none roboto-condensed-light">
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              {reviewStatus === "rejected" && (
                <div>
                  <label className="block text-[#999] mb-1 text-xs roboto-condensed-light">
                    Rejection Reason (required)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1A1A1A] text-white rounded resize-none border border-[#333333] focus:outline-none roboto-condensed-light"
                    rows={3}
                    placeholder="Enter reason for rejection..."
                    required
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 rounded text-[#999] hover:text-white roboto-condensed-bold"
                onClick={() => setModal(null)}>
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-lime-600 text-black hover:bg-lime-500 roboto-condensed-regular"
                onClick={handleReview}
                disabled={
                  mutation.isPending ||
                  (reviewStatus === "rejected" && !rejectionReason.trim())
                }>
                {mutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
