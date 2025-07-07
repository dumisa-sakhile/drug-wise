import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auth, db } from "@/config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

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
  submittedAt: Timestamp;
  rejectionReason?: string;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
}

function Medication() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [medicationName, setMedicationName] = useState("");
  const [description, setDescription] = useState("");
  const [comment, setComment] = useState("");
  const [modalMed, setModalMed] = useState<MedicationType | null>(null);
  const [viewAllOpen, setViewAllOpen] = useState(false);

  const queryClient = useQueryClient();

  // Track auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  // Fetch medications submitted by current user
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

  // Mutation for submitting new medication
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
        submittedAt: Timestamp.now(),
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

  // Status badge component with colors
  function StatusBadge({ status }: { status: MedicationType["status"] }) {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-semibold";
    switch (status) {
      case "approved":
        return (
          <span className={`${baseClasses} bg-green-700 text-green-300`}>
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className={`${baseClasses} bg-red-700 text-red-300`}>
            Rejected
          </span>
        );
      case "pending":
      default:
        return (
          <span className={`${baseClasses} bg-orange-700 text-orange-300`}>
            Pending
          </span>
        );
    }
  }

  // Summary: show first 5 medications for the initial view
  const summaryLimit = 5;
  const summaryMeds = medications.slice(0, summaryLimit);
  const hasMore = medications.length > summaryLimit;

  return (
    <div className="p-4 text-white max-w-4xl mx-auto w-full min-h-screen">
      <title>DrugWise - Submit Medication</title>
      <h1 className="text-2xl mb-6 roboto-condensed-bold text-center sm:text-left">
        Submit New Medication
      </h1>

      {/* Submission Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitMedication();
        }}
        className="bg-[#131313] p-6 rounded-lg border border-[#333333] mb-8 w-full">
        <div className="mb-4">
          <label
            htmlFor="medicationName"
            className="block text-[#999] mb-1 roboto-condensed-light">
            Medication Name <span className="text-red-500">*</span>
          </label>
          <input
            id="medicationName"
            type="text"
            value={medicationName}
            onChange={(e) => setMedicationName(e.target.value)}
            className="w-full px-3 py-2 bg-[#1A1A1A] text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 roboto-condensed-light"
            placeholder="Enter medication name"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="description"
            className="block text-[#999] mb-1 roboto-condensed-light">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-[#1A1A1A] text-white rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 roboto-condensed-light"
            rows={4}
            placeholder="Describe the medication"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="comment"
            className="block text-[#999] mb-1 roboto-condensed-light">
            Comment (optional)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3 py-2 bg-[#1A1A1A] text-white rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 roboto-condensed-light"
            rows={2}
            placeholder="Additional comments"
            disabled={isSubmitting}
          />
        </div>

        <div className="flex items-center justify-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full max-w-[200px] bg-lime-600 hover:bg-lime-700 px-6 py-3 rounded-lg roboto-condensed-regular flex items-center justify-center gap-2 text-lg transition-colors duration-200">
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>

      {/* Submitted Medications Table/List */}
      <h2 className="text-xl mb-4 roboto-condensed-bold text-center sm:text-left">
        Your Submitted Medications
      </h2>

      {medsLoading ? (
        <div className="text-center py-8 text-[#999] roboto-condensed-light">
          Loading your medications...
        </div>
      ) : medications.length === 0 ? (
        <div className="text-center py-8 text-[#999] roboto-condensed-light">
          You have not submitted any medications yet.
        </div>
      ) : (
        <>
          {/* Table for larger screens */}
          <div className="hidden sm:block overflow-x-auto rounded-lg border border-[#333333] bg-[#131313]">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[#999] bg-[#141414] border-b border-[#333333] roboto-condensed-bold">
                  <th className="px-6 py-4">Medication Name</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Submitted At</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {summaryMeds.map((med) => (
                    <motion.tr
                      key={med.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-b border-[#333333] hover:bg-[#242424] cursor-pointer"
                      onClick={() => setModalMed(med)}>
                      <td className="px-6 py-4 roboto-condensed-bold">
                        {med.medicationName}
                      </td>
                      <td className="px-6 py-4 roboto-condensed-light max-w-xs truncate">
                        {med.description}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={med.status} />
                      </td>
                      <td className="px-6 py-4 roboto-condensed-light">
                        {med.submittedAt?.toDate?.().toLocaleString() || "-"}
                      </td>
                      <td className="px-6 py-4 text-blue-400 underline">
                        View More
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Card list for smaller screens */}
          <div className="sm:hidden space-y-4">
            <AnimatePresence>
              {summaryMeds.map((med) => (
                <motion.div
                  key={med.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-[#131313] p-4 rounded-lg border border-[#333333] cursor-pointer"
                  onClick={() => setModalMed(med)}>
                  <h3 className="text-lg roboto-condensed-bold mb-1">
                    {med.medicationName}
                  </h3>
                  <p className="text-gray-400 roboto-condensed-light text-sm mb-2">
                    {med.description.length > 100
                      ? med.description.substring(0, 100) + "..."
                      : med.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <StatusBadge status={med.status} />
                    <span className="text-gray-500 text-xs roboto-condensed-light">
                      {med.submittedAt?.toDate?.().toLocaleDateString() || "-"}
                    </span>
                  </div>
                  <div className="text-blue-400 text-sm mt-2 text-right">
                    View Details
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* View All Link */}
      {hasMore && (
        <div
          className="mt-4 text-center sm:text-right text-blue-400 cursor-pointer roboto-condensed-bold hover:underline transition-colors duration-200"
          onClick={() => setViewAllOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setViewAllOpen(true);
          }}>
          View All Medications ({medications.length})
        </div>
      )}

      {/* Modal for detailed medication info or all medications */}
      {(modalMed || viewAllOpen) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 roboto-condensed-light">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="bg-[#141414] rounded-lg shadow-lg p-6 max-w-full sm:max-w-3xl w-full border border-[#333333] relative overflow-auto max-h-[90vh]" // Increased max-h to take more screen
            onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-3 right-3 text-[#999] hover:text-white text-4xl font-light py-1 px-4 rounded-full bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors duration-200"
              onClick={() => {
                setModalMed(null);
                setViewAllOpen(false);
              }}
              aria-label="Close modal">
              &times;
            </button>

            {modalMed ? (
              <>
                <h3 className="text-xl sm:text-2xl roboto-condensed-bold mb-4 text-center sm:text-left">
                  Medication Details
                </h3>
                <div className="space-y-3">
                  <p>
                    <strong>Medication Name:</strong> {modalMed.medicationName}
                  </p>
                  <p>
                    <strong>Description:</strong> {modalMed.description}
                  </p>
                  {modalMed.comment && (
                    <p>
                      <strong>Comment:</strong> {modalMed.comment}
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <strong>Status:</strong>{" "}
                    <StatusBadge status={modalMed.status} />
                  </p>
                  <p>
                    <strong>Submitted At:</strong>{" "}
                    {modalMed.submittedAt?.toDate?.().toLocaleString() || "-"}
                  </p>
                  {modalMed.status === "rejected" &&
                    modalMed.rejectionReason && (
                      <p className="text-red-400">
                        <strong>Rejection Reason:</strong>{" "}
                        {modalMed.rejectionReason}
                      </p>
                    )}
                  {modalMed.status !== "pending" && modalMed.reviewedAt && (
                    <p>
                      <strong>Reviewed At:</strong>{" "}
                      {modalMed.reviewedAt.toDate().toLocaleString() || "-"}
                    </p>
                  )}
                  {modalMed.status !== "pending" && modalMed.reviewedBy && (
                    <p>
                      <strong>Reviewed By:</strong> {modalMed.reviewedBy}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl sm:text-2xl roboto-condensed-bold mb-4 text-center sm:text-left">
                  All Submitted Medications
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-[#999] bg-[#141414] border-b border-[#333333] roboto-condensed-bold">
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3 hidden sm:table-cell">
                          Description
                        </th>{" "}
                        {/* Hidden on mobile */}
                        <th className="px-4 py-3 hidden md:table-cell">
                          Comment
                        </th>{" "}
                        {/* Hidden on mobile/tablet */}
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 hidden sm:table-cell">
                          Submitted At
                        </th>{" "}
                        {/* Hidden on mobile */}
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medications.map((med) => (
                        <tr
                          key={med.id}
                          className="border-b border-[#333333] hover:bg-[#242424] cursor-pointer transition-colors duration-200"
                          onClick={() => {
                            setModalMed(med);
                            setViewAllOpen(false); // Close the "View All" modal and open single
                          }}>
                          <td className="px-4 py-3 roboto-condensed-bold">
                            {med.medicationName}
                          </td>
                          <td className="px-4 py-3 roboto-condensed-light max-w-[150px] truncate hidden sm:table-cell">
                            {med.description}
                          </td>
                          <td className="px-4 py-3 roboto-condensed-light max-w-[100px] truncate hidden md:table-cell">
                            {med.comment || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={med.status} />
                          </td>
                          <td className="px-4 py-3 roboto-condensed-light hidden sm:table-cell">
                            {med.submittedAt?.toDate?.().toLocaleDateString() ||
                              "-"}
                          </td>
                          <td className="px-4 py-3 text-blue-400 underline hover:text-blue-300">
                            View
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
