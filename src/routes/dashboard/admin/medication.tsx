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
  addDoc,
  getDoc,
  where,
  Timestamp,
  deleteField,
  FieldValue,
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
  submittedAt: any;
  status: "approved" | "rejected" | "pending";
  rejectionReason?: string;
  reviewedAt?: any;
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

async function sendMedicationNotification({
  medicationId,
  userId,
  medicationName,
  status,
  rejectionReason,
  senderId,
  senderName,
}: {
  medicationId: string;
  userId: string;
  medicationName: string;
  status: "approved" | "rejected" | "pending";
  rejectionReason?: string;
  senderId: string;
  senderName: string;
}) {
  try {
    // Validate inputs
    if (
      !medicationId ||
      !userId ||
      !medicationName ||
      !senderId ||
      !senderName
    ) {
      throw new Error("Missing required fields for notification");
    }

    // Verify recipient user exists
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      throw new Error(`Recipient user ${userId} not found`);
    }

    // Verify medication exists
    const medRef = doc(db, "medications", medicationId);
    const medSnap = await getDoc(medRef);
    if (!medSnap.exists()) {
      throw new Error(`Medication ${medicationId} not found`);
    }

    // Check for existing notification to prevent duplicates
    const subject =
      status === "pending"
        ? `Medication Reverted to Pending: ${medicationName}`
        : `Medication ${status === "approved" ? "Approved" : "Rejected"}: ${medicationName}`;
    const messagesQuery = query(
      collection(db, "messages"),
      where("recipientId", "==", userId),
      where("medicationId", "==", medicationId),
      where("subject", "==", subject)
    );
    const messageDocs = await getDocs(messagesQuery);
    if (!messageDocs.empty) {
      console.log(
        `Notification already sent for medication ${medicationId} with status ${status}`
      );
      return;
    }

    // Construct message
    let content = "";
    if (status === "pending") {
      content = `Your medication submission "${medicationName}" has been reverted to pending status for further review.`;
    } else {
      content = `Your medication submission "${medicationName}" has been ${status}.`;
      if (status === "rejected" && rejectionReason) {
        content += `\n\nReason: ${rejectionReason}\n\nYou may edit and resubmit your medication for review.`;
      } else if (status === "approved") {
        content += "\n\nThis medication is now available in your records.";
      }
    }

    // Send notification
    await addDoc(collection(db, "messages"), {
      content,
      isRead: false,
      recipientId: userId,
      senderId,
      senderName,
      sentAt: Timestamp.now(),
      subject,
      medicationId, // For duplicate checks
    });

    console.log(
      `Sent notification for medication ${medicationId} (${status}) to user ${userId} by ${senderName}`
    );
  } catch (error: any) {
    const errorMessage =
      error.code === "permission-denied"
        ? "Permission denied: Check Firestore rules or admin status"
        : (error.message ?? "Unknown error");
    console.error("Error sending medication notification:", error);
    throw new Error(`Failed to send notification: ${errorMessage}`);
  }
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

  // Track current user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch current user data
  const { data: currentUserData, isLoading: isCurrentUserLoading } =
    useQuery<User | null>({
      queryKey: ["currentUserData", currentUser?.uid],
      queryFn: async () => {
        if (!currentUser?.uid) return null;
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          throw new Error(`Admin user ${currentUser.uid} not found`);
        }
        const data = docSnap.data();
        return {
          id: docSnap.id,
          uid: data.uid ?? docSnap.id,
          name: data.name ?? "Admin",
          surname: data.surname ?? "",
          email: data.email ?? "",
          isAdmin: data.isAdmin ?? false,
        } as User;
      },
      enabled: !!currentUser?.uid,
    });

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
        medicationName: doc.data().medicationName ?? "Unknown",
        description: doc.data().description ?? "",
        userId: doc.data().userId ?? "",
        submittedAt: doc.data().submittedAt,
        status: doc.data().status ?? "pending",
        rejectionReason: doc.data().rejectionReason,
        reviewedAt: doc.data().reviewedAt,
        reviewedBy: doc.data().reviewedBy,
      })) as Medication[];
    },
    enabled: !!currentUser?.uid && currentUserData?.isAdmin,
  });

  // Fetch all users
  const { data: users, isLoading: isUsersLoading } = useQuery<
    Record<string, User>
  >({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const q = query(collection(db, "users"));
      const snap = await getDocs(q);
      const arr = snap.docs.map((doc) => ({
        id: doc.id,
        uid: doc.data().uid ?? doc.id,
        name: doc.data().name ?? "Unknown",
        surname: doc.data().surname ?? "",
        email: doc.data().email ?? "",
        isAdmin: doc.data().isAdmin ?? false,
      })) as User[];
      const map: Record<string, User> = {};
      arr.forEach((u) => {
        map[u.uid] = u;
      });
      return map;
    },
    enabled: !!currentUser?.uid && currentUserData?.isAdmin,
  });

  const isLoading =
    isMedicationsLoading || isUsersLoading || isCurrentUserLoading;

  // Filter medications
  const filtered = (medications || []).filter((m) => {
    const matchesStatus = status === "all" || m.status === status;
    const user = users?.[m.userId];
    const matchesSearch =
      (m.medicationName?.toLowerCase?.()?.includes(search.toLowerCase()) ||
        m.description?.toLowerCase?.()?.includes(search.toLowerCase()) ||
        user?.name?.toLowerCase?.()?.includes(search.toLowerCase()) ||
        user?.surname?.toLowerCase?.()?.includes(search.toLowerCase()) ||
        user?.email?.toLowerCase?.()?.includes(search.toLowerCase())) ??
      false;
    return matchesStatus && matchesSearch;
  });

  const totalRows = filtered.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const paged = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Mutation for updating medication status
  const mutation = useMutation<
    void,
    Error,
    {
      id: string;
      status: "approved" | "rejected" | "pending";
      rejectionReason: string;
      prevStatus: "approved" | "rejected" | "pending";
    }
  >({
    mutationFn: async ({ id, status, rejectionReason }) => {
      if (!currentUser?.uid || !currentUserData?.isAdmin) {
        throw new Error("Not authenticated or not an admin");
      }

      const ref = doc(db, "medications", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        throw new Error(`Medication ${id} not found`);
      }

      const updateData: Record<string, string | FieldValue | undefined> = {
        status,
        reviewedAt: Timestamp.now(),
        reviewedBy: currentUser.uid,
      };

      if (status === "rejected") {
        updateData.rejectionReason = rejectionReason;
      } else {
        updateData.rejectionReason = deleteField();
      }

      await updateDoc(ref, updateData);
    },
    onSuccess: async (_, { id, status, rejectionReason, prevStatus }) => {
      if (status !== prevStatus && currentUser?.uid && currentUserData) {
        try {
          const ref = doc(db, "medications", id);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const medData = snap.data();
            if (
              status === "approved" ||
              status === "rejected" ||
              status === "pending"
            ) {
              await sendMedicationNotification({
                medicationId: id,
                userId: medData?.userId ?? "",
                medicationName: medData?.medicationName ?? "Unknown",
                status,
                rejectionReason,
                senderId: currentUser.uid,
                senderName:
                  `${currentUserData.name ?? "Admin"} ${currentUserData.surname ?? ""}`.trim(),
              });
              toast.success("Status updated and notification sent!");
            } else {
              toast.success("Status updated successfully!");
            }
          } else {
            toast.error(
              "Status updated but medication not found for notification"
            );
          }
        } catch (error: any) {
          toast.error(
            `Status updated but notification failed: ${error.message}`
          );
        }
      } else {
        toast.success("Status updated successfully!");
      }
      setModal(null);
      setRejectionReason("");
      setReviewStatus("pending");
      queryClient.invalidateQueries({ queryKey: ["allMedications"] });
    },
    onError: (err) => {
      const errorMessage =
        err.message === "permission-denied"
          ? "Permission denied: Check Firestore rules or admin status"
          : (err.message ?? "Failed to update status");
      toast.error(errorMessage);
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
    setRejectionReason(med.rejectionReason ?? "");
  }

  function handleReview() {
    if (!modal?.med?.id || !currentUser?.uid || !currentUserData?.isAdmin) {
      toast.error("Invalid session or permissions");
      return;
    }

    if (reviewStatus === "rejected" && !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    mutation.mutate({
      id: modal.med.id,
      status: reviewStatus,
      rejectionReason,
      prevStatus: modal.med.status,
    });
  }

  if (isCurrentUserLoading) {
    return <div className="p-4 text-white">Loading user data...</div>;
  }

  if (!currentUserData?.isAdmin) {
    return (
      <div className="p-4 text-white">
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="p-4 text-white">
      <h1 className="text-xl mb-4 font-bold">Medication Management</h1>
      <p className="text-[#999] mb-6 font-light">
        Review and manage user-submitted medications.{" "}
        <span className="text-[#666]">{totalRows} total</span>
      </p>

      <div className="overflow-x-auto rounded-lg border border-[#222]">
        <div className="flex flex-col sm:flex-row gap-4 items-center p-4 bg-[#222] border-b border-[#111]">
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
              className="w-full pl-10 pr-4 py-2 bg-[#222] text-white rounded-md focus:outline-none font-light ring-1 ring-[#333] focus:ring-blue-500 transition duration-200"
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
            className="w-full sm:w-1/4 px-4 py-2 bg-[#222] text-white rounded-md focus:outline-none  ring-1 ring-[#333] focus:ring-blue-500 transition duration-200 font-light">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[#999] border-b border-[#111]  bg-[#222] font-bold">
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
                    className="px-6 py-8 text-center text-[#999] font-light">
                    Loading medications...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-[#999] font-light">
                    No medications found
                  </td>
                </tr>
              ) : (
                paged.map((m) => (
                  <motion.tr
                    key={m.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="border-b border-[#111] hover:bg-[#333] bg-[#222]">
                    <td className="px-6 py-4 font-bold">
                      {m.medicationName ?? "N/A"}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate font-light">
                      {m.description ?? "N/A"}
                    </td>
                    <td className="px-6 py-4 font-light">
                      {users?.[m.userId]?.name ?? "Unknown"}{" "}
                      {users?.[m.userId]?.surname ?? ""}
                      <div className="text-xs text-[#666]">
                        {users?.[m.userId]?.email ?? "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-light">
                      {m.submittedAt?.toDate?.()?.toLocaleString("en-ZA") ??
                        "-"}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(m.status)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openModal(m)}
                        className="text-blue-400 hover:text-blue-300 underline font-bold">
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

      <div className="flex items-center justify-between mt-4 text-[#999] font-light">
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

      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#333] rounded-lg shadow-lg p-6 w-full max-w-md border border-[#333333]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-bold">
                Review Medication
              </h3>
              <button
                className="text-[#999] hover:text-white"
                onClick={() => {
                  setModal(null);
                  setReviewStatus("pending");
                  setRejectionReason("");
                }}>
                ×
              </button>
            </div>
            <div className="mb-4 space-y-3">
              <div>
                <span className="text-[#999] text-xs font-light">Name</span>
                <div className="text-white font-bold">
                  {modal?.med?.medicationName ?? "N/A"}
                </div>
              </div>
              <div>
                <span className="text-[#999] text-xs font-light">
                  Description
                </span>
                <div className="text-white font-light">
                  {modal?.med?.description ?? "N/A"}
                </div>
              </div>
              <div>
                <span className="text-[#999] text-xs font-light">User</span>
                <div className="text-white font-bold">
                  {users?.[modal?.med?.userId]?.name ?? "Unknown"}{" "}
                  {users?.[modal?.med?.userId]?.surname ?? ""}
                </div>
                <div className="text-xs text-[#666] font-light">
                  {users?.[modal?.med?.userId]?.email ?? "N/A"}
                </div>
              </div>
              <div>
                <span className="text-[#999] text-xs font-light">
                  Submitted
                </span>
                <div className="text-white font-light">
                  {modal?.med?.submittedAt
                    ?.toDate?.()
                    ?.toLocaleString("en-ZA") ?? "-"}
                </div>
              </div>
              <div>
                <span className="text-[#999] text-xs font-light">
                  Current Status
                </span>
                <div>{getStatusBadge(modal?.med?.status ?? "pending")}</div>
              </div>
              <div>
                <span className="text-[#999] text-xs font-light">
                  Change Status To
                </span>
                <select
                  value={reviewStatus}
                  onChange={(e) =>
                    setReviewStatus(
                      e.target.value as "approved" | "rejected" | "pending"
                    )
                  }
                  className="w-full mt-1 bg-[#222] text-white rounded px-3 py-2 border border-[#333333] focus:outline-none font-light">
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              {reviewStatus === "rejected" && (
                <div>
                  <label className="block text-[#999] mb-1 text-xs font-light">
                    Rejection Reason (required)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1A1A1A] text-white rounded resize-none border border-[#333333] focus:outline-none font-light"
                    rows={3}
                    placeholder="Enter reason for rejection..."
                    required
                  />
                  {!rejectionReason.trim() && (
                    <p className="text-red-400 text-xs mt-1">
                      Rejection reason is required
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 rounded text-[#999] hover:text-white font-bold"
                onClick={() => {
                  setModal(null);
                  setReviewStatus("pending");
                  setRejectionReason("");
                }}>
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded bg-lime-600 text-black hover:bg-lime-500 font-regular ${
                  mutation.isPending ||
                  (reviewStatus === "rejected" && !rejectionReason.trim())
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
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

export default AdminMedication;
