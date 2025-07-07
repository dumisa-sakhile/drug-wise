// src/routes/dashboard/medication.tsx

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
import {
  Pill,
  X,
  ArrowRight,
} from "lucide-react"; // Importing icons from lucide-react

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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user?.uid || null);
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

  function StatusBadge({ status }: { status: MedicationType["status"] }) {
    const baseClasses =
      "px-2 py-1 rounded-full text-xs font-semibold roboto-condensed-regular";
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
          <span className={`${baseClasses} bg-yellow-700 text-yellow-300`}>
            Pending
          </span>
        );
    }
  }

  const summaryLimit = 5;
  const summaryMeds = medications.slice(0, summaryLimit);
  const hasMore = medications.length > summaryLimit;

  return (
    <div className="roboto-condensed-light max-w-5xl mx-auto md:px-4 py-8 min-h-screen text-white ">
      <title>DrugWise - Submit Medication</title>
      <h1 className="text-3xl font-bold mb-8 text-center sm:text-left">
        Submit New Medication
      </h1>
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
     
      <section className="max-w-5xl mx-auto mt-12">
        <h2 className="text-2xl font-bold mb-6 text-center sm:text-left flex items-center gap-2 justify-center sm:justify-start">
           Your Submitted
          Medications
        </h2>

        {medsLoading ? (
          <div className="space-y-4">
            <div className="h-24 bg-neutral-800 rounded-xl animate-pulse"></div>
            <div className="h-24 bg-neutral-800 rounded-xl animate-pulse"></div>
            <div className="h-24 bg-neutral-800 rounded-xl animate-pulse"></div>
          </div>
        ) : medications.length === 0 ? (
          <div className="text-neutral-500 text-center py-10 flex flex-col items-center justify-center">
            <Pill className="text-6xl mb-4 text-neutral-600" />
            <p className="text-lg">
              You haven't submitted any medications yet.
            </p>
            <p className="text-sm mt-2">
              Start by using the form above to submit your first medication.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto rounded-xl border border-neutral-700 bg-neutral-800 shadow-inner">
              <table className="min-w-full text-left text-neutral-300 text-sm">
                <thead className="bg-neutral-700/50">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Medication Name</th>
                    <th className="px-6 py-4 font-semibold">Description</th>
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
                        <td
                          className="px-6 py-4 max-w-xs truncate"
                          title={med.description}>
                          {med.description}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={med.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {med.submittedAt?.toDate?.().toLocaleString() || "-"}
                        </td>
                        <td className="px-6 py-4 text-blue-400 hover:text-blue-300 flex items-center gap-1">
                          View Details <ArrowRight />
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-6">
              <AnimatePresence>
                {summaryMeds.map((med) => (
                  <motion.div
                    key={med.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className={`bg-neutral-800 p-5 rounded-xl border border-neutral-700 cursor-pointer shadow-md  hover:scale-105 transition-transform duration-200 `}
                    onClick={() => setModalMed(med)}>
                    <h3 className="text-lg font-semibold truncate">
                      {med.medicationName}
                    </h3>
                    <p
                      className="text-neutral-400 mt-2 line-clamp-3 break-words"
                      title={med.description}>
                      {med.description}
                    </p>
                    <div className="flex justify-between items-center mt-4">
                      <StatusBadge status={med.status} />
                      <time className="text-neutral-500 text-xs whitespace-nowrap">
                        {med.submittedAt?.toDate?.().toLocaleDateString() ||
                          "-"}
                      </time>
                    </div>
                    <div className="text-blue-400 mt-3 text-right flex items-center justify-end gap-1 hover:text-blue-300">
                      View Details <ArrowRight />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}

        {hasMore && (
          <button
            onClick={() => setViewAllOpen(true)}
            className="mt-6 block mx-auto sm:mx-0 text-blue-400 font-semibold hover:text-blue-300 transition-colors duration-200 py-2 px-4 rounded-md border border-blue-400 hover:border-blue-300">
            View All Medications ({medications.length})
          </button>
        )}
      </section>
      {/* --- Modals --- */}
      {(modalMed || viewAllOpen) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6 roboto-condensed-light"
          onClick={() => {
            setModalMed(null);
            setViewAllOpen(false);
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
              }}
              aria-label="Close modal">
              <X />
            </button>

            {modalMed ? (
              <>
                <h3 className="text-xl sm:text-2xl roboto-condensed-bold mb-6 text-center sm:text-left text-blue-300">
                  Medication Details
                </h3>
                <div className="space-y-4 text-neutral-200 text-sm sm:text-base">
                  <p>
                    <strong className="text-neutral-100">
                      Medication Name:
                    </strong>{" "}
                    {modalMed.medicationName}
                  </p>
                  <p>
                    <strong className="text-neutral-100">Description:</strong>{" "}
                    {modalMed.description}
                  </p>
                  {modalMed.comment && (
                    <p>
                      <strong className="text-neutral-100">Comment:</strong>{" "}
                      {modalMed.comment}
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <strong className="text-neutral-100">Status:</strong>{" "}
                    <StatusBadge status={modalMed.status} />
                  </p>
                  <p>
                    <strong className="text-neutral-100">Submitted At:</strong>{" "}
                    {modalMed.submittedAt?.toDate?.().toLocaleString() || "-"}
                  </p>
                  {modalMed.status === "rejected" &&
                    modalMed.rejectionReason && (
                      <p className="text-red-400">
                        <strong className="text-red-300">
                          Rejection Reason:
                        </strong>{" "}
                        {modalMed.rejectionReason}
                      </p>
                    )}
                  {modalMed.status !== "pending" && modalMed.reviewedAt && (
                    <p>
                      <strong className="text-neutral-100">Reviewed At:</strong>{" "}
                      {modalMed.reviewedAt.toDate().toLocaleString() || "-"}
                    </p>
                  )}
                  {modalMed.status !== "pending" && modalMed.reviewedBy && (
                    <p>
                      <strong className="text-neutral-100">Reviewed By:</strong>{" "}
                      {modalMed.reviewedBy}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl sm:text-2xl roboto-condensed-bold mb-6 text-center sm:text-left text-blue-300">
                  All Submitted Medications
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-neutral-300">
                    <thead>
                      <tr className="text-left bg-neutral-700/50 border-b border-neutral-700 roboto-condensed-bold">
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
                          <td className="px-4 py-3 roboto-condensed-bold whitespace-nowrap">
                            {med.medicationName}
                          </td>
                          <td
                            className="px-4 py-3 roboto-condensed-light max-w-[150px] truncate hidden sm:table-cell"
                            title={med.description}>
                            {med.description}
                          </td>
                          <td
                            className="px-4 py-3 roboto-condensed-light max-w-[100px] truncate hidden md:table-cell"
                            title={med.comment || ""}>
                            {med.comment || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={med.status} />
                          </td>
                          <td className="px-4 py-3 roboto-condensed-light hidden sm:table-cell whitespace-nowrap">
                            {med.submittedAt?.toDate?.().toLocaleDateString() ||
                              "-"}
                          </td>
                          <td className="px-4 py-3 text-blue-400 hover:text-blue-300 flex items-center gap-1">
                            View <ArrowRight />
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