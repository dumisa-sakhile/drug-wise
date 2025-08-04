import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { auth, db } from "@/config/firebase";
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  addDoc,
  deleteField,
} from "firebase/firestore";
import { del } from "@vercel/blob";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  AlertCircle,
  X,
  RotateCcw,
  Trash2,
  ArrowRight,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/admin/medication")({
  component: AdminMedication,
});

interface MedicationType {
  id: string;
  medicationName: string;
  description: string;
  comment?: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: any;
  rejectionReason?: string;
  reviewedAt?: any;
  reviewedBy?: string;
  reviewerName?: string;
  file: {
    url: string;
    name: string;
    type: string;
    uploadedAt: string;
    size: number;
  };
}

interface User {
  id: string;
  uid: string;
  name: string;
  surname: string;
  email: string;
  isAdmin: boolean;
}

interface ModalState {
  type: "details" | "adminAction" | null;
  medication?: MedicationType | null;
  adminStatus?: "approved" | "rejected";
  rejectionReason?: string;
}

function AdminMedication() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState>({ type: null });
  const [search, setSearch] = useState<string>("");
  const [status, setStatus] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [rowsPerPage, setRowsPerPage] = useState<number>(15);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user?.uid ?? null);
    });
    return () => unsubscribe();
  }, []);

  const { data: users = {}, isLoading: isUsersLoading } = useQuery<
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
    enabled: !!currentUser,
  });

  const { data: medications = [], isLoading: isMedsLoading } = useQuery<
    MedicationType[]
  >({
    queryKey: ["allMedications"],
    queryFn: async () => {
      if (!currentUser) return [];
      const medsRef = collection(db, "medications");
      const q = query(medsRef);
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<MedicationType, "id">),
      }));
    },
    enabled: !!currentUser,
    initialData: [],
    placeholderData: keepPreviousData,
  });

  const filteredMedications = useMemo(() => {
    let result = medications;
    if (status !== "all") {
      result = result.filter((m) => m.status === status);
    }
    if (search.trim() && !isUsersLoading) {
      const searchLower = search.toLowerCase().trim();
      result = result.filter((m) => {
        const user = users[m.userId];
        return (
          m.medicationName.toLowerCase().includes(searchLower) ||
          m.description.toLowerCase().includes(searchLower) ||
          (user &&
            (user.name.toLowerCase().includes(searchLower) ||
              user.surname.toLowerCase().includes(searchLower) ||
              user.email.toLowerCase().includes(searchLower)))
        );
      });
    }
    return result;
  }, [medications, status, search, users, isUsersLoading]);

  const paginatedMedications = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredMedications.slice(start, start + rowsPerPage);
  }, [filteredMedications, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredMedications.length / rowsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, status, rowsPerPage]);

  const { mutate: updateMedication, isPending: isUpdating } = useMutation({
    mutationFn: async ({
      medId,
      data,
    }: {
      medId: string;
      data: Partial<MedicationType>;
    }) => {
      if (!currentUser) throw new Error("Not authenticated");
      const medRef = doc(db, "medications", medId);
      const medSnap = await getDoc(medRef);
      if (!medSnap.exists()) {
        throw new Error("Medication not found");
      }
      const trimmedRejectionReason = data.rejectionReason?.trim();
      const updateData: any = {
        status: data.status,
        reviewedAt: serverTimestamp(),
        reviewedBy: auth.currentUser?.uid ?? "",
        reviewerName: auth.currentUser?.displayName ?? "Admin",
      };
      if (data.status === "rejected") {
        if (!trimmedRejectionReason) {
          throw new Error("Rejection reason is required and cannot be empty");
        }
        updateData.rejectionReason = trimmedRejectionReason;
      } else {
        updateData.rejectionReason = deleteField();
      }
      await updateDoc(medRef, updateData);

      // Send notification
      const userId = medSnap.data().userId;
      const userSnap = await getDoc(doc(db, "users", userId));
      if (!userSnap.exists()) {
        throw new Error("User not found");
      }
      const userEmail = userSnap.data().email;
      const content =
        data.status === "approved"
          ? `Your medication "${medSnap.data().medicationName}" has been approved.`
          : `Your medication "${medSnap.data().medicationName}" has been rejected. Reason: ${trimmedRejectionReason}`;

      await addDoc(collection(db, "messages"), {
        senderId: currentUser,
        senderName: "DrugWise Team",
        recipientId: userId,
        content: content,
        sentAt: serverTimestamp(),
        isRead: false,
        subject: `Medication ${data.status === "approved" ? "Approved" : "Rejected"}`,
        isWelcomeMessage: false,
      });

      return { userEmail, content };
    },
    onSuccess: ({ userEmail, content }) => {
      toast.success(
        `Medication ${modalState.adminStatus} and notification sent to ${userEmail}: ${content}`
      );
      setModalState({ type: null });
      queryClient.invalidateQueries({ queryKey: ["allMedications"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update medication");
    },
  });

  const { mutate: revertMedication, isPending: isReverting } = useMutation({
    mutationFn: async (medId: string) => {
      if (!currentUser) throw new Error("Not authenticated");
      const medRef = doc(db, "medications", medId);
      const medSnap = await getDoc(medRef);
      if (!medSnap.exists()) {
        throw new Error("Medication not found");
      }
      await updateDoc(medRef, {
        status: "pending",
        reviewedAt: deleteField(),
        reviewedBy: deleteField(),
        reviewerName: deleteField(),
        rejectionReason: deleteField(),
      });

      // Send notification
      const userId = medSnap.data().userId;
      const userSnap = await getDoc(doc(db, "users", userId));
      if (!userSnap.exists()) {
        throw new Error("User not found");
      }
      const userEmail = userSnap.data().email;
      const content = `Your medication "${medSnap.data().medicationName}" has been reverted to pending for further review.`;

      await addDoc(collection(db, "messages"), {
        senderId: currentUser,
        senderName: "DrugWise Team",
        recipientId: userId,
        content,
        sentAt: serverTimestamp(),
        isRead: false,
        subject: "Medication Reverted to Pending",
        isWelcomeMessage: false,
      });

      return { userEmail, content };
    },
    onSuccess: ({ userEmail, content }) => {
      toast.success(
        `Medication reverted to pending and notification sent to ${userEmail}: ${content}`
      );
      setModalState({ type: null });
      queryClient.invalidateQueries({ queryKey: ["allMedications"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to revert medication");
    },
  });

  const { mutate: deleteMedication, isPending: isDeleting } = useMutation({
    mutationFn: async (medId: string) => {
      if (!currentUser) throw new Error("Not authenticated");
      const medRef = doc(db, "medications", medId);
      const medSnap = await getDoc(medRef);
      if (!medSnap.exists()) {
        throw new Error("Medication not found");
      }
      const fileUrl = medSnap.data()?.file?.url;

      // Send notification
      const userId = medSnap.data().userId;
      const userSnap = await getDoc(doc(db, "users", userId));
      if (!userSnap.exists()) {
        throw new Error("User not found");
      }
      const userEmail = userSnap.data().email;
      const content = `Your medication "${medSnap.data().medicationName}" has been deleted by an admin.`;

      await addDoc(collection(db, "messages"), {
        senderId: currentUser,
        senderName: "DrugWise Team",
        recipientId: userId,
        content,
        sentAt: serverTimestamp(),
        isRead: false,
        subject: "Medication Deleted",
        isWelcomeMessage: false,
      });

      // Perform Firestore deletion
      await deleteDoc(medRef);

      // Non-blocking Blob deletion
      if (fileUrl) {
        del(fileUrl, {
          token: import.meta.env.VITE_BLOB_READ_WRITE_TOKEN,
        }).catch((error: any) => {
          console.error(
            `Failed to delete Blob file: ${error.message || "Unknown error"}`
          );
        });
      }

      return { userEmail, content };
    },
    onSuccess: ({ userEmail, content }) => {
      toast.success(
        `Medication deleted and notification sent to ${userEmail}: ${content}`
      );
      setModalState({ type: null });
      queryClient.invalidateQueries({ queryKey: ["allMedications"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete medication");
    },
  });

  const handleAdminAction = () => {
    if (!modalState.medication?.id || !modalState.adminStatus) return;
    if (
      modalState.adminStatus === "rejected" &&
      !modalState.rejectionReason?.trim()
    ) {
      toast.error(
        "Please provide a valid rejection reason (cannot be empty or just spaces)"
      );
      return;
    }
    updateMedication({
      medId: modalState.medication.id,
      data: {
        status: modalState.adminStatus,
        rejectionReason: modalState.rejectionReason,
      },
    });
  };

  function StatusBadge({ status }: { status: MedicationType["status"] }) {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-semibold";
    switch (status) {
      case "approved":
        return (
          <span
            className={`${baseClasses} bg-green-900/30 text-green-400 flex items-center gap-1`}>
            <Check size={14} /> Approved
          </span>
        );
      case "rejected":
        return (
          <span
            className={`${baseClasses} bg-red-900/30 text-red-400 flex items-center gap-1`}>
            <AlertCircle size={14} /> Rejected
          </span>
        );
      case "pending":
      default:
        return (
          <span className={`${baseClasses} bg-yellow-900/30 text-yellow-400`}>
            Pending Review
          </span>
        );
    }
  }

  return (
    <div className="font-light max-w-full mx-auto md:px-4 py-8 min-h-screen text-white">
      <title>DrugWise - Admin Medication Reviews</title>
      <h1 className="text-3xl font-bold mb-8 text-center sm:text-left bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
        Medication Reviews
      </h1>
      <p className="text-neutral-500 mb-8 font-light">
        Review and manage user-submitted medications.
      </p>

      <div className="overflow-x-auto rounded-xl border border-neutral-700 bg-neutral-800 shadow-inner">
        <section className="max-w-full mx-auto">
          {isMedsLoading || isUsersLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-[#222] rounded-md animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="hidden sm:block overflow-x-auto rounded-xl border border-neutral-700 bg-neutral-800 shadow-inner">
              <table className="min-w-full text-sm text-left text-neutral-300 divide-y divide-neutral-700">
                <thead className="bg-neutral-700/50">
                  <tr>
                    <th colSpan={6} className="px-4 sm:px-6 py-3 font-semibold">
                      <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="relative w-full sm:w-3/4">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                          <input
                            type="text"
                            placeholder="Search by medication, description or user..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 text-base text-white rounded-lg shadow-sm border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-light"
                          />
                        </div>
                        <select
                          value={status}
                          onChange={(e) =>
                            setStatus(
                              e.target.value as
                                | "all"
                                | "pending"
                                | "approved"
                                | "rejected"
                            )
                          }
                          className="w-full sm:w-1/4 px-3 py-2.5 bg-neutral-900 text-base text-white rounded-lg shadow-sm border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-light">
                          <option value="all">All Status</option>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <span className="text-neutral-300 font-semibold">
                          {filteredMedications.length} total
                        </span>
                      </div>
                    </th>
                  </tr>
                  <tr>
                    <th className="px-4 sm:px-6 py-3 font-semibold">
                      Medication
                    </th>
                    <th className="px-4 sm:px-6 py-3 font-semibold">
                      Description
                    </th>
                    <th className="px-4 sm:px-6 py-3 font-semibold">
                      Submitted By
                    </th>
                    <th className="px-4 sm:px-6 py-3 font-semibold">
                      Reviewed By
                    </th>
                    <th className="px-4 sm:px-6 py-3 font-semibold">Status</th>
                    <th className="px-4 sm:px-6 py-3 font-semibold">
                      Submitted At
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredMedications.length === 0 ? (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="border-b border-neutral-700">
                        <td
                          colSpan={6}
                          className="px-4 sm:px-6 py-8 text-center text-neutral-500 font-light">
                          No medications found matching the search criteria.
                        </td>
                      </motion.tr>
                    ) : (
                      paginatedMedications.map((m: MedicationType) => (
                        <motion.tr
                          key={m.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.25 }}
                          className="border-b border-neutral-700 hover:bg-neutral-700 cursor-pointer"
                          onClick={() =>
                            setModalState({ type: "details", medication: m })
                          }>
                          <td className="px-4 sm:px-6 py-4 font-semibold">
                            {m.medicationName}
                          </td>
                          <td className="px-4 sm:px-6 py-4 max-w-xs truncate">
                            {m.description}
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            {users[m.userId]?.name +
                              " " +
                              (users[m.userId]?.surname || "") || m.userId}
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            {m.reviewerName ?? "-"}
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <StatusBadge status={m.status} />
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            {m.submittedAt?.toDate?.().toLocaleString() ?? "-"}
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </section>

        {!(isMedsLoading || isUsersLoading) && (
          <div className="sm:hidden space-y-6">
            <AnimatePresence>
              {filteredMedications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-neutral-500 text-center py-10 flex flex-col items-center justify-center">
                  <AlertCircle className="text-6xl mb-4 text-neutral-600" />
                  <p className="text-lg">
                    No medications found matching the search criteria.
                  </p>
                </motion.div>
              ) : (
                paginatedMedications.map((m: MedicationType) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="bg-neutral-800 p-5 rounded-xl border border-neutral-700 cursor-pointer shadow-md hover:scale-[1.02] transition-transform duration-200"
                    onClick={() =>
                      setModalState({ type: "details", medication: m })
                    }>
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold truncate max-w-[70%]">
                        {m.medicationName}
                      </h3>
                      <StatusBadge status={m.status} />
                    </div>
                    <p className="text-neutral-400 mt-2 line-clamp-2">
                      {m.description}
                    </p>
                    <div className="flex justify-between items-center mt-4">
                      <time className="text-neutral-500 text-xs">
                        {m.submittedAt?.toDate?.().toLocaleDateString() ?? "-"}
                      </time>
                      <span className="text-blue-400 text-sm flex items-center gap-1">
                        Details <ArrowRight size={14} />
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {!(
        isMedsLoading ||
        isUsersLoading ||
        filteredMedications.length === 0
      ) && (
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

      {modalState.type && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6 font-light"
          onClick={() => setModalState({ type: null })}>
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className={`bg-neutral-800 rounded-2xl shadow-lg p-6 max-w-${
              modalState.type === "adminAction" ? "md" : "full sm:max-w-3xl"
            } w-full border border-neutral-700 relative overflow-auto max-h-[90vh]`}
            onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-2 right-2 text-neutral-400 hover:text-white text-3xl font-light p-2 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors duration-200"
              onClick={() => setModalState({ type: null })}
              aria-label="Close modal">
              <X />
            </button>

            {modalState.type === "details" && modalState.medication && (
              <>
                <h3 className="text-xl sm:text-2xl font-bold mb-6 text-center sm:text-left bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
                  Medication Details
                </h3>
                <div className="space-y-4 text-neutral-200 text-sm sm:text-base">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold text-neutral-300">
                        Medication Name:
                      </p>
                      <p>{modalState.medication.medicationName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-neutral-300">Status:</p>
                      <StatusBadge status={modalState.medication.status} />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-300">
                        Submitted By:
                      </p>
                      <p>
                        {users[modalState.medication.userId]?.name +
                          " " +
                          (users[modalState.medication.userId]?.surname ||
                            "") || modalState.medication.userId}
                      </p>
                    </div>
                    {modalState.medication.reviewerName && (
                      <div>
                        <p className="font-semibold text-neutral-300">
                          Reviewed By:
                        </p>
                        <p>{modalState.medication.reviewerName ?? "-"}</p>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-neutral-300">
                        Submitted At:
                      </p>
                      <p>
                        {modalState.medication.submittedAt
                          ?.toDate?.()
                          .toLocaleString() ?? "-"}
                      </p>
                    </div>
                    {modalState.medication.reviewedAt && (
                      <div>
                        <p className="font-semibold text-neutral-300">
                          Reviewed At:
                        </p>
                        <p>
                          {modalState.medication.reviewedAt
                            .toDate()
                            .toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="font-semibold text-neutral-300">
                      Description:
                    </p>
                    <p className="whitespace-pre-line">
                      {modalState.medication.description}
                    </p>
                  </div>

                  {modalState.medication.comment && (
                    <div>
                      <p className="font-semibold text-neutral-300">Comment:</p>
                      <p className="whitespace-pre-line">
                        {modalState.medication.comment}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="font-semibold text-neutral-300">
                      Uploaded File:
                    </p>
                    {modalState.medication.file ? (
                      <div className="my-2">
                        <a
                          href={modalState.medication.file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:underline">
                          {modalState.medication.file.name} (
                          {modalState.medication.file.type.split("/")[1]})
                        </a>
                        <span className="text-neutral-500 text-xs ml-2">
                          Uploaded:{" "}
                          {new Date(
                            modalState.medication.file.uploadedAt
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      <p>No file uploaded.</p>
                    )}
                  </div>

                  {modalState.medication.status === "rejected" &&
                    modalState.medication.rejectionReason && (
                      <div className="bg-red-900/20 p-4 rounded-xl">
                        <p className="font-semibold text-red-300">
                          Rejection Reason:
                        </p>
                        <p className="text-red-200 whitespace-pre-line">
                          {modalState.medication.rejectionReason}
                        </p>
                      </div>
                    )}

                  <div className="mt-6 flex justify-end gap-3 flex-wrap">
                    {modalState.medication.status === "pending" && (
                      <>
                        <button
                          onClick={() =>
                            setModalState({
                              type: "adminAction",
                              medication: modalState.medication,
                              adminStatus: "approved",
                            })
                          }
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl transition-colors duration-200">
                          <Check size={18} /> Approve
                        </button>
                        <button
                          onClick={() =>
                            setModalState({
                              type: "adminAction",
                              medication: modalState.medication,
                              adminStatus: "rejected",
                            })
                          }
                          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-xl transition-colors duration-200">
                          <AlertCircle size={18} /> Reject
                        </button>
                      </>
                    )}
                    {(modalState.medication.status === "approved" ||
                      modalState.medication.status === "rejected") && (
                      <button
                        onClick={() =>
                          revertMedication(modalState.medication!.id)
                        }
                        disabled={isReverting}
                        className={`flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-xl transition-colors duration-200 ${
                          isReverting ? "opacity-60 cursor-not-allowed" : ""
                        }`}>
                        {isReverting ? (
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
                            Reverting...
                          </>
                        ) : (
                          <>
                            <RotateCcw size={18} /> Revert to Pending
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() =>
                        deleteMedication(modalState.medication!.id)
                      }
                      disabled={isDeleting}
                      className={`flex items-center gap-2 bg-rose-500/10 text-rose-400 border-rose-500/20 py-2 px-4 rounded-xl transition-colors duration-200 hover:bg-rose-500/20 ${
                        isDeleting ? "opacity-60 cursor-not-allowed" : ""
                      }`}>
                      {isDeleting ? (
                        <>
                          <svg
                            className="animate-spin h-5 w-5 text-rose-200"
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
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 size={18} /> Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            {modalState.type === "adminAction" && modalState.medication && (
              <>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  {modalState.adminStatus === "approved" ? (
                    <>
                      <Check className="text-green-400" /> Approve Medication
                    </>
                  ) : (
                    <>
                      <AlertCircle className="text-red-400" /> Reject Medication
                    </>
                  )}
                </h3>
                {modalState.adminStatus === "rejected" && (
                  <div className="mb-4">
                    <label className="block text-neutral-300 mb-2">
                      Rejection Reason (required)
                    </label>
                    <textarea
                      value={modalState.rejectionReason ?? ""}
                      onChange={(e) =>
                        setModalState({
                          ...modalState,
                          rejectionReason: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full rounded-xl bg-neutral-900 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Provide reason for rejection..."
                    />
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setModalState({ type: null })}
                    className="px-4 py-2 rounded-xl bg-neutral-500/10 text-neutral-400 border-neutral-500/20 hover:bg-neutral-700 transition-colors duration-200">
                    Cancel
                  </button>
                  <button
                    onClick={handleAdminAction}
                    disabled={
                      isUpdating ||
                      (modalState.adminStatus === "rejected" &&
                        !modalState.rejectionReason?.trim())
                    }
                    className={`px-4 py-2 rounded-xl ${
                      modalState.adminStatus === "approved"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                    } text-white transition-colors duration-200 flex items-center gap-2 ${
                      isUpdating ||
                      (modalState.adminStatus === "rejected" &&
                        !modalState.rejectionReason?.trim())
                        ? "opacity-70 cursor-not-allowed"
                        : ""
                    }`}>
                    {isUpdating ? (
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
                        Processing...
                      </>
                    ) : (
                      <>
                        {modalState.adminStatus === "approved" ? (
                          <Check size={18} />
                        ) : (
                          <AlertCircle size={18} />
                        )}
                        Confirm
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default AdminMedication;
