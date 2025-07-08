import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auth, db } from "@/config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pill,
  X,
  ArrowRight,
  Trash2,
  Edit,
  Check,
  AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/medication")({
  component: Medication,
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
}

function Medication() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [medicationName, setMedicationName] = useState("");
  const [description, setDescription] = useState("");
  const [comment, setComment] = useState("");
  const [modalMed, setModalMed] = useState<MedicationType | null>(null);
  const [viewAllOpen, setViewAllOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    medicationName: "",
    description: "",
    comment: "",
  });
  const [adminAction, setAdminAction] = useState<{
    status: "approved" | "rejected";
    rejectionReason?: string;
  } | null>(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user?.uid ?? null);
    });
    return () => unsubscribe();
  }, []);

  const { data: medications = [], isLoading: medsLoading } = useQuery<
    MedicationType[]
  >({
    queryKey: ["userMedications", currentUser],
    queryFn: async () => {
      if (!currentUser) return [];
      const medsRef = collection(db, "medications");
      const q = query(medsRef, where("userId", "==", currentUser));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<MedicationType, "id">),
      }));
    },
    enabled: !!currentUser,
  });

  const { mutate: submitMedication, isPending: isSubmitting } = useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error("Not authenticated");
      if (!medicationName.trim() || !description.trim()) {
        throw new Error("Medication name and description are required");
      }
      const medsRef = collection(db, "medications");
      await addDoc(medsRef, {
        medicationName: medicationName.trim(),
        description: description.trim(),
        comment: comment.trim() || "",
        userId: currentUser,
        status: "pending",
        submittedAt: serverTimestamp(),
      });
    },
    onSuccess: () => {
      toast.success("Medication submitted successfully!");
      setMedicationName("");
      setDescription("");
      setComment("");
      queryClient.invalidateQueries({
        queryKey: ["userMedications", currentUser],
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit medication");
    },
  });

  const { mutate: deleteMedication, isPending: isDeleting } = useMutation({
    mutationFn: async (medId: string) => {
      if (!currentUser) throw new Error("Not authenticated");
      await deleteDoc(doc(db, "medications", medId));
    },
    onSuccess: () => {
      toast.success("Medication deleted successfully!");
      setModalMed(null);
      queryClient.invalidateQueries({
        queryKey: ["userMedications", currentUser],
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete medication");
    },
  });

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
      await updateDoc(medRef, {
        ...data,
        reviewedAt: serverTimestamp(),
        reviewedBy: auth.currentUser?.displayName ?? "Admin",
      });
    },
    onSuccess: () => {
      toast.success("Medication updated successfully!");
      setIsEditing(false);
      setAdminAction(null);
      queryClient.invalidateQueries({
        queryKey: ["userMedications", currentUser],
      });
    },
    onError: (error: any) => {
      console.error("Error in updateMedication:", error);
      toast.error(error.message || "Failed to update medication");
    },
  });

  const handleAdminAction = () => {
    if (!modalMed?.id || !adminAction?.status) return;

    updateMedication({
      medId: modalMed.id,
      data: {
        status: adminAction.status,
        rejectionReason: adminAction.rejectionReason,
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

  const handleEditClick = (med: MedicationType) => {
    setIsEditing(true);
    setEditForm({
      medicationName: med.medicationName,
      description: med.description,
      comment: med.comment ?? "",
    });
  };

  const handleUpdateSubmit = () => {
    if (!modalMed?.id) return;
    if (!editForm.medicationName.trim() || !editForm.description.trim()) {
      toast.error("Medication name and description are required");
      return;
    }

    updateMedication({
      medId: modalMed.id,
      data: {
        medicationName: editForm.medicationName.trim(),
        description: editForm.description.trim(),
        comment: editForm.comment.trim() || "",
        status: "pending",
      },
    });
  };

  const summaryLimit = 5;
  const summaryMeds = medications.slice(0, summaryLimit);
  const hasMore = medications.length > summaryLimit;

  const isAdmin = auth.currentUser?.uid !== currentUser;

  return (
    <div className="font-light max-w-5xl mx-auto md:px-4 py-8 min-h-screen text-white">
      <title>DrugWise - Medication Management</title>
      <h1 className="text-3xl font-bold mb-8 text-center sm:text-left">
        {isAdmin ? "Medication Reviews" : "Submit New Medication"}
      </h1>

      {!isAdmin && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitMedication();
          }}
          className="bg-neutral-800 p-6 rounded-xl border border-neutral-700 mb-10 max-w-3xl mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300">
          <label className="block mb-5">
            <span className="text-neutral-300 font-semibold mb-2 block">
              Medication Name <span className="text-red-400 font-bold">*</span>
            </span>
            <input
              type="text"
              value={medicationName}
              onChange={(e) => setMedicationName(e.target.value)}
              className="w-full rounded-lg bg-neutral-900 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter medication name"
              required
              disabled={isSubmitting}
            />
          </label>

          <label className="block mb-5">
            <span className="text-neutral-300 font-semibold mb-2 block">
              Description <span className="text-red-400 font-bold">*</span>
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe the medication (e.g., dosage, purpose, side effects)"
              required
              disabled={isSubmitting}
              className="w-full rounded-lg bg-neutral-900 text-white px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </label>

          <label className="block mb-6">
            <span className="text-neutral-300 font-semibold mb-2 block">
              Comment (optional)
            </span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="Add any additional notes or context here"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-neutral-900 text-white px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full max-w-[200px] mx-auto flex items-center justify-center gap-2 bg-lime-600 hover:bg-lime-700 transition-colors duration-200 rounded-lg py-3 text-lg text-lime-100 font-semibold shadow-md
              ${isSubmitting ? "opacity-60 cursor-not-allowed" : "opacity-100"}`}>
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-lime-200"
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
                Submitting...
              </>
            ) : (
              "Submit Medication"
            )}
          </button>
        </form>
      )}

      <section className="max-w-5xl mx-auto mt-12">
        <h2 className="text-2xl font-bold mb-6 text-center sm:text-left">
          {isAdmin
            ? "All Medication Submissions"
            : "Your Submitted Medications"}
        </h2>

        {medsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-neutral-800 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : medications.length === 0 ? (
          <div className="text-neutral-500 text-center py-10 flex flex-col items-center justify-center">
            <Pill className="text-6xl mb-4 text-neutral-600" />
            <p className="text-lg">
              {isAdmin
                ? "No medication submissions to review."
                : "You haven't submitted any medications yet."}
            </p>
            {!isAdmin && (
              <p className="text-sm mt-2">
                Start by using the form above to submit your first medication.
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto rounded-xl border border-neutral-700 bg-neutral-800 shadow-inner">
              <table className="min-w-full text-left text-neutral-300 text-sm">
                <thead className="bg-neutral-700/50">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Medication</th>
                    <th className="px-6 py-4 font-semibold">Description</th>
                    {isAdmin && (
                      <th className="px-6 py-4 font-semibold">Submitted By</th>
                    )}
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Submitted At</th>
                    <th className="px-6 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {summaryMeds.map((med) => (
                      <motion.tr
                        key={med.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="border-b border-neutral-700 hover:bg-neutral-700 cursor-pointer transition-colors duration-200"
                        onClick={() => setModalMed(med)}>
                        <td className="px-6 py-4 font-semibold whitespace-nowrap">
                          {med.medicationName}
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate">
                          {med.description}
                        </td>
                        {isAdmin && <td className="px-6 py-4">{med.userId}</td>}
                        <td className="px-6 py-4">
                          <StatusBadge status={med.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {med.submittedAt?.toDate?.().toLocaleString() ?? "-"}
                        </td>
                        <td className="px-6 py-4 text-blue-400 hover:text-blue-300 flex items-center gap-1">
                          View Details <ArrowRight size={16} />
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            <div className="sm:hidden space-y-6">
              <AnimatePresence>
                {summaryMeds.map((med) => (
                  <motion.div
                    key={med.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="bg-neutral-800 p-5 rounded-xl border border-neutral-700 cursor-pointer shadow-md hover:scale-[1.02] transition-transform duration-200"
                    onClick={() => setModalMed(med)}>
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold truncate max-w-[70%]">
                        {med.medicationName}
                      </h3>
                      <StatusBadge status={med.status} />
                    </div>
                    <p className="text-neutral-400 mt-2 line-clamp-2">
                      {med.description}
                    </p>
                    <div className="flex justify-between items-center mt-4">
                      <time className="text-neutral-500 text-xs">
                        {med.submittedAt?.toDate?.().toLocaleDateString() ??
                          "-"}
                      </time>
                      <span className="text-blue-400 text-sm flex items-center gap-1">
                        Details <ArrowRight size={14} />
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {hasMore && (
              <button
                onClick={() => setViewAllOpen(true)}
                className="mt-6 block mx-auto sm:mx-0 text-blue-400 font-semibold hover:text-blue-300 transition-colors duration-200 py-2 px-4 rounded-md border border-blue-400 hover:border-blue-300">
                View All Medications ({medications.length})
              </button>
            )}
          </>
        )}
      </section>

      {adminAction?.status && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6"
          onClick={() => setAdminAction(null)}>
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="bg-neutral-800 rounded-xl shadow-lg p-6 max-w-md w-full border border-neutral-700 relative"
            onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-2 right-2 text-neutral-400 hover:text-white text-3xl font-light p-2 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors duration-200"
              onClick={() => setAdminAction(null)}
              aria-label="Close modal">
              <X />
            </button>

            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              {adminAction.status === "approved" ? (
                <>
                  <Check className="text-green-400" /> Approve Medication
                </>
              ) : (
                <>
                  <AlertCircle className="text-red-400" /> Reject Medication
                </>
              )}
            </h3>

            {adminAction.status === "rejected" && (
              <div className="mb-4">
                <label className="block text-neutral-300 mb-2">
                  Rejection Reason (optional)
                </label>
                <textarea
                  value={adminAction.rejectionReason ?? ""}
                  onChange={(e) =>
                    setAdminAction({
                      status: adminAction.status,
                      rejectionReason: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full rounded-lg bg-neutral-900 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Provide reason for rejection..."
                />
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setAdminAction(null)}
                className="px-4 py-2 rounded-lg bg-neutral-500/10 text-neutral-400 border-neutral-500/20 hover:bg-neutral-700 transition-colors duration-200">
                Cancel
              </button>
              <button
                onClick={handleAdminAction}
                disabled={isUpdating}
                className={`px-4 py-2 rounded-lg ${
                  adminAction.status === "approved"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                } text-white transition-colors duration-200 flex items-center gap-2 ${
                  isUpdating ? "opacity-70 cursor-not-allowed" : ""
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
                    {adminAction.status === "approved" ? (
                      <Check size={18} />
                    ) : (
                      <AlertCircle size={18} />
                    )}
                    Confirm
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {(modalMed || viewAllOpen) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6 font-light"
          onClick={() => {
            setModalMed(null);
            setViewAllOpen(false);
            setIsEditing(false);
          }}>
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="bg-neutral-800 rounded-xl shadow-lg p-6 max-w-full sm:max-w-3xl w-full border border-neutral-700 relative overflow-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-2 right-2 text-neutral-400 hover:text-white text-3xl font-light p-2 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors duration-200"
              onClick={() => {
                setModalMed(null);
                setViewAllOpen(false);
                setIsEditing(false);
              }}
              aria-label="Close modal">
              <X />
            </button>

            {modalMed ? (
              <>
                <h3 className="text-xl sm:text-2xl font-bold mb-6 text-center sm:text-left text-blue-300">
                  {isEditing ? "Edit Medication" : "Medication Details"}
                </h3>

                {isEditing ? (
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-neutral-300 font-semibold mb-2 block">
                        Medication Name <span className="text-red-400">*</span>
                      </span>
                      <input
                        type="text"
                        value={editForm.medicationName}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            medicationName: e.target.value,
                          })
                        }
                        className="w-full rounded-lg bg-neutral-900 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                    </label>

                    <label className="block">
                      <span className="text-neutral-300 font-semibold mb-2 block">
                        Description <span className="text-red-400">*</span>
                      </span>
                      <textarea
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            description: e.target.value,
                          })
                        }
                        rows={4}
                        className="w-full rounded-lg bg-neutral-900 text-white px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                    </label>

                    <label className="block">
                      <span className="text-neutral-300 font-semibold mb-2 block">
                        Comment (optional)
                      </span>
                      <textarea
                        value={editForm.comment}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            comment: e.target.value,
                          })
                        }
                        rows={2}
                        className="w-full rounded-lg bg-neutral-900 text-white px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </label>

                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 rounded-lg bg-neutral-500/10 text-neutral-400 border-neutral-500/20 hover:bg-neutral-700 transition-colors duration-200">
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateSubmit}
                        disabled={isUpdating}
                        className={`px-4 py-2 rounded-lg bg-lime-500/10 text-lime-400 border-lime-500/20 transition-colors duration-200 flex items-center gap-2 ${
                          isUpdating ? "opacity-70 cursor-not-allowed" : ""
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
                            Updating...
                          </>
                        ) : (
                          "Update Medication"
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-neutral-200 text-sm sm:text-base">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold text-neutral-300">
                          Medication Name:
                        </p>
                        <p>{modalMed?.medicationName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-neutral-300">
                          Status:
                        </p>
                        <StatusBadge status={modalMed?.status ?? "pending"} />
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-300">
                          Submitted At:
                        </p>
                        <p>
                          {modalMed?.submittedAt?.toDate?.().toLocaleString() ??
                            "-"}
                        </p>
                      </div>
                      {modalMed?.reviewedAt && (
                        <div>
                          <p className="font-semibold text-neutral-300">
                            Reviewed At:
                          </p>
                          <p>{modalMed.reviewedAt.toDate().toLocaleString()}</p>
                        </div>
                      )}
                      {modalMed?.reviewedBy && (
                        <div>
                          <p className="font-semibold text-neutral-300">
                            Reviewed By:
                          </p>
                          <p>{modalMed.reviewedBy}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="font-semibold text-neutral-300">
                        Description:
                      </p>
                      <p className="whitespace-pre-line">
                        {modalMed?.description}
                      </p>
                    </div>

                    {modalMed?.comment && (
                      <div>
                        <p className="font-semibold text-neutral-300">
                          Comment:
                        </p>
                        <p className="whitespace-pre-line">
                          {modalMed.comment}
                        </p>
                      </div>
                    )}

                    {modalMed?.status === "rejected" &&
                      modalMed?.rejectionReason && (
                        <div className="bg-red-900/20 p-4 rounded-lg">
                          <p className="font-semibold text-red-300">
                            Rejection Reason:
                          </p>
                          <p className="text-red-200 whitespace-pre-line">
                            {modalMed.rejectionReason}
                          </p>
                        </div>
                      )}

                    <div className="mt-6 flex justify-end gap-3">
                      {(modalMed?.status === "pending" ||
                        modalMed?.status === "rejected") && (
                        <>
                          {!isEditing && (
                            <button
                              onClick={() =>
                                modalMed && handleEditClick(modalMed)
                              }
                              className="flex items-center gap-2 bg-lime-500/10 text-lime-400 border-lime-500/20 py-2 px-4 rounded-lg transition-colors duration-200 hover:bg-lime-500/20">
                              <Edit size={18} /> Edit
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (modalMed?.id) {
                                deleteMedication(modalMed.id);
                              }
                            }}
                            disabled={isDeleting}
                            className={`flex items-center gap-2 bg-rose-500/10 text-rose-400 border-rose-500/20 py-2 px-4 rounded-lg transition-colors duration-200 hover:bg-rose-500/20 ${
                              isDeleting ? "opacity-60 cursor-not-allowed" : ""
                            }`}>
                            {isDeleting ? (
                              <>
                                <svg
                                  className="animate-spin h-5 w-5 text-red-200"
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
                        </>
                      )}
                      {isAdmin && modalMed?.status === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              setAdminAction({ status: "approved" })
                            }
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors duration-200">
                            <Check size={18} /> Approve
                          </button>
                          <button
                            onClick={() =>
                              setAdminAction({ status: "rejected" })
                            }
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors duration-200">
                            <AlertCircle size={18} /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="text-xl sm:text-2xl font-bold mb-6 text-center sm:text-left text-blue-300">
                  All Submitted Medications
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-neutral-300">
                    <thead>
                      <tr className="text-left bg-neutral-700/50 border-b border-neutral-700 font-bold">
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3 hidden sm:table-cell">
                          Description
                        </th>
                        <th className="px-4 py-3 hidden md:table-cell">
                          Comment
                        </th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 hidden sm:table-cell">
                          Submitted At
                        </th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medications.map((med) => (
                        <tr
                          key={med.id}
                          className="border-b border-neutral-700 hover:bg-neutral-700 cursor-pointer transition-colors duration-200"
                          onClick={() => {
                            setModalMed(med);
                            setViewAllOpen(false);
                          }}>
                          <td className="px-4 py-3 font-bold whitespace-nowrap">
                            {med.medicationName}
                          </td>
                          <td
                            className="px-4 py-3 font-light max-w-[150px] truncate hidden sm:table-cell"
                            title={med.description}>
                            {med.description}
                          </td>
                          <td
                            className="px-4 py-3 font-light max-w-[100px] truncate hidden md:table-cell"
                            title={med.comment ?? ""}>
                            {med.comment ?? "-"}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={med.status} />
                          </td>
                          <td className="px-4 py-3 font-light hidden sm:table-cell whitespace-nowrap">
                            {med.submittedAt?.toDate?.().toLocaleDateString() ??
                              "-"}
                          </td>
                          <td className="px-4 py-3 text-blue-400 hover:text-blue-300 flex items-center gap-1">
                            View <ArrowRight size={16} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default Medication;
