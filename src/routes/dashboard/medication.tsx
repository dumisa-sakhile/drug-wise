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

  // Summary: show first 5 medications
  const summaryLimit = 5;
  const summaryMeds = medications.slice(0, summaryLimit);
  const hasMore = medications.length > summaryLimit;

  return (
    <div className="p-4 text-white max-w-4xl mx-auto">
      <h1 className="text-xl mb-6 roboto-condensed-bold">Submit Medication</h1>

      {/* Submission Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitMedication();
        }}
        className="bg-[#131313] p-6 rounded-lg border border-[#333333] mb-8">
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
            className="w-full px-3 py-2 bg-[#1A1A1A] text-white rounded focus:outline-none roboto-condensed-light"
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
            className="w-full px-3 py-2 bg-[#1A1A1A] text-white rounded resize-none focus:outline-none roboto-condensed-light"
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
            className="w-full px-3 py-2 bg-[#1A1A1A] text-white rounded resize-none focus:outline-none roboto-condensed-light"
            rows={2}
            placeholder="Additional comments"
            disabled={isSubmitting}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-lime-600 hover:bg-lime-700 px-6 py-2 rounded roboto-condensed-regular flex items-center justify-center gap-2">
          {isSubmitting ? "Submitting..." : "Submit Medication"}
        </button>
      </form>

      {/* Summary Table */}
      <h2 className="text-lg mb-4 roboto-condensed-bold">
        Your Submitted Medications
      </h2>

      <div className="overflow-x-auto rounded-lg border border-[#333333] bg-[#131313]">
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
              {medsLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-[#999] roboto-condensed-light">
                    Loading your medications...
                  </td>
                </tr>
              ) : medications.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-[#999] roboto-condensed-light">
                    You have not submitted any medications yet.
                  </td>
                </tr>
              ) : (
                summaryMeds.map((med) => (
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
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* View All Link */}
      {hasMore && (
        <div
          className="mt-2 text-right text-blue-400 cursor-pointer roboto-condensed-bold"
          onClick={() => setViewAllOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setViewAllOpen(true);
          }}>
          View All
        </div>
      )}

      {/* Modal for detailed medication info */}
      {(modalMed || viewAllOpen) && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 roboto-condensed-light"
          onClick={() => {
            setModalMed(null);
            setViewAllOpen(false);
          }}
          role="dialog"
          aria-modal="true">
          <div
            className="bg-[#141414] rounded-lg shadow-lg p-6 max-w-3xl w-full border border-[#333333] overflow-auto max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-3 right-3 text-[#999] hover:text-white text-xl font-bold"
              onClick={() => {
                setModalMed(null);
                setViewAllOpen(false);
              }}
              aria-label="Close modal">
              &times;
            </button>

            {modalMed ? (
              <>
                <h3 className="text-xl roboto-condensed-bold mb-4">
                  {modalMed.medicationName}
                </h3>
                <p className="mb-2">
                  <strong>Description:</strong> {modalMed.description}
                </p>
                {modalMed.comment && (
                  <p className="mb-2">
                    <strong>Comment:</strong> {modalMed.comment}
                  </p>
                )}
                <p className="mb-2">
                  <strong>Status:</strong>{" "}
                  <StatusBadge status={modalMed.status} />
                </p>
                <p className="mb-2">
                  <strong>Submitted At:</strong>{" "}
                  {modalMed.submittedAt?.toDate?.().toLocaleString() || "-"}
                </p>
                {modalMed.status === "rejected" && modalMed.rejectionReason && (
                  <p className="mb-2 text-red-400">
                    <strong>Rejection Reason:</strong>{" "}
                    {modalMed.rejectionReason}
                  </p>
                )}
              </>
            ) : (
              <>
                <h3 className="text-xl roboto-condensed-bold mb-4">
                  All Submitted Medications
                </h3>
                <div className="overflow-auto max-h-[60vh]">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-[#999] bg-[#141414] border-b border-[#333333] roboto-condensed-bold">
                        <th className="px-6 py-4">Medication Name</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4">Comment</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Submitted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medications.map((med) => (
                        <tr
                          key={med.id}
                          className="border-b border-[#333333] hover:bg-[#242424] cursor-pointer"
                          onClick={() => setModalMed(med)}>
                          <td className="px-6 py-4 roboto-condensed-bold">
                            {med.medicationName}
                          </td>
                          <td className="px-6 py-4 roboto-condensed-light max-w-xs truncate">
                            {med.description}
                          </td>
                          <td className="px-6 py-4 roboto-condensed-light max-w-xs truncate">
                            {med.comment || "-"}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={med.status} />
                          </td>
                          <td className="px-6 py-4 roboto-condensed-light">
                            {med.submittedAt?.toDate?.().toLocaleString() ||
                              "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Medication;