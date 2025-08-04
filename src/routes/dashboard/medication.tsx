import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import type { ChangeEvent, DragEvent } from "react";
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
import { put, del } from "@vercel/blob";
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
  Upload,
  File,
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
  reviewerName?: string;
  file: {
    url: string;
    name: string;
    type: string;
    uploadedAt: string;
    size: number;
  };
}

interface FormErrors {
  medicationName?: string;
  description?: string;
  file?: string;
}

interface EditFormData {
  medicationName: string;
  description: string;
  comment: string;
}

function Medication() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [medicationName, setMedicationName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [modalState, setModalState] = useState<{
    type: "details" | "viewAll" | "adminAction" | null;
    medication?: MedicationType | null;
    adminStatus?: "approved" | "rejected";
    rejectionReason?: string;
  }>({ type: null });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<EditFormData>({
    medicationName: "",
    description: "",
    comment: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [editFormErrors, setEditFormErrors] = useState<FormErrors>({});
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user?.uid ?? null);
    });
    return () => unsubscribe();
  }, []);

  // Validate form for main and edit forms
  const validateForm = (isEdit: boolean = false): boolean => {
    const errors: FormErrors = {};
    const data = isEdit ? editForm : { medicationName, description, file };

    if (!data.medicationName.trim()) {
      errors.medicationName = "Medication name is required";
    } else if (data.medicationName.trim().length < 2) {
      errors.medicationName = "Medication name must be at least 2 characters";
    }

    if (!data.description.trim()) {
      errors.description = "Description is required";
    } else if (data.description.trim().length < 10) {
      errors.description = "Description must be at least 10 characters";
    }

    if (!isEdit) {
      if (!file) {
        errors.file = "A medication file is required";
      } else {
        if (file.size > 3 * 1024 * 1024) {
          errors.file = "File size must be less than 3MB";
        } else if (
          !["image/jpeg", "image/png", "application/pdf"].includes(file.type)
        ) {
          errors.file = "Only JPEG, PNG, or PDF files are allowed";
        }
      }
    }

    if (isEdit) {
      setEditFormErrors(errors);
    } else {
      setFormErrors(errors);
    }
    return Object.keys(errors).length === 0;
  };

  // Revalidate edit form when editForm changes
  useEffect(() => {
    if (isEditing) {
      validateForm(true);
    }
  }, [editForm, isEditing]);

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
      if (!validateForm()) {
        throw new Error("Please fix the form errors before submitting");
      }

      const filePath = `medications/${Date.now()}_${file!.name}`;
      let blob;
      try {
        blob = await put(filePath, file!, {
          access: "public",
          token: import.meta.env.VITE_BLOB_READ_WRITE_TOKEN,
        });
      } catch (error: any) {
        throw new Error(
          `Failed to upload file: ${error.message || "Unknown error"}`
        );
      }

      const medsRef = collection(db, "medications");
      await addDoc(medsRef, {
        medicationName: medicationName.trim(),
        description: description.trim(),
        comment: comment.trim() || "",
        userId: currentUser,
        status: "pending",
        submittedAt: serverTimestamp(),
        file: {
          url: blob.url,
          name: file!.name,
          type: file!.type,
          uploadedAt: new Date().toISOString(),
          size: file!.size,
        },
      });
    },
    onSuccess: () => {
      toast.success("Medication submitted successfully!");
      setMedicationName("");
      setDescription("");
      setComment("");
      setFile(null);
      setFormErrors({});
      if (fileInputRef.current) fileInputRef.current.value = "";
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
      const medRef = doc(db, "medications", medId);
      const medSnap = await getDoc(medRef);
      if (!medSnap.exists()) {
        throw new Error("Medication not found");
      }
      const fileUrl = medSnap.data()?.file?.url;
      // Perform Firestore deletion first
      await deleteDoc(medRef);
      // Non-blocking Blob deletion
      if (fileUrl) {
        del(fileUrl, {
          token: import.meta.env.VITE_BLOB_READ_WRITE_TOKEN,
        }).catch((error: any) => {
          console.error(
            `Failed to delete Blob file: ${error.message || "Unknown error"}`
          );
          // Don't throw error to avoid affecting UI
        });
      }
    },
    onSuccess: () => {
      toast.success("Medication deleted successfully!");
      setModalState({ type: null });
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
      if (!validateForm(true)) {
        throw new Error("Please fix the form errors before updating");
      }
      const medRef = doc(db, "medications", medId);
      const medSnap = await getDoc(medRef);
      if (!medSnap.exists()) {
        throw new Error("Medication not found");
      }
      await updateDoc(medRef, {
        ...data,
        reviewedAt: serverTimestamp(),
        reviewedBy: auth.currentUser?.uid ?? "",
        reviewerName: auth.currentUser?.displayName ?? "Admin",
      });
    },
    onSuccess: () => {
      toast.success("Medication updated successfully!");
      setIsEditing(false);
      setEditForm({
        medicationName: "",
        description: "",
        comment: "",
      });
      setEditFormErrors({});
      queryClient.invalidateQueries({
        queryKey: ["userMedications", currentUser],
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update medication");
    },
  });

  const handleAdminAction = () => {
    if (!modalState.medication?.id || !modalState.adminStatus) return;
    updateMedication({
      medId: modalState.medication.id,
      data: {
        status: modalState.adminStatus,
        rejectionReason: modalState.rejectionReason,
      },
    });
    setModalState({ type: null });
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
    setEditForm({
      medicationName: med.medicationName,
      description: med.description,
      comment: med.comment ?? "",
    });
    setEditFormErrors({}); // Clear errors before entering edit mode
    setIsEditing(true);
  };

  const handleUpdateSubmit = () => {
    if (!modalState.medication?.id) return;
    if (!validateForm(true)) {
      toast.error("Please fix the form errors before updating");
      return;
    }
    updateMedication({
      medId: modalState.medication.id,
      data: {
        medicationName: editForm.medicationName.trim(),
        description: editForm.description.trim(),
        comment: editForm.comment.trim() || "",
        status: "pending",
      },
    });
    setIsEditing(false);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFormErrors((prev) => ({ ...prev, file: undefined }));
      validateForm();
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      setFile(selectedFile);
      setFormErrors((prev) => ({ ...prev, file: undefined }));
      validateForm();
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFormErrors((prev) => ({ ...prev, file: undefined }));
    validateForm();
  };

  const summaryLimit = 5;
  const summaryMeds = medications.slice(0, summaryLimit);
  const hasMore = medications.length > summaryLimit;
  const isAdmin = auth.currentUser?.uid !== currentUser;

  return (
    <div className="font-light max-w-5xl mx-auto md:px-4 py-8 min-h-screen text-white">
      <title>DrugWise - Medication Management</title>
      <h1 className="text-3xl font-bold mb-8 text-center sm:text-left bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
        {isAdmin ? "Medication Reviews" : "Submit New Medication"}
      </h1>

      {!isAdmin && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitMedication();
          }}
          className="bg-neutral-900/50 p-8 rounded-2xl border border-neutral-700/50 mb-10 max-w-3xl mx-auto shadow-xl backdrop-blur-sm transition-all duration-300 hover:shadow-2xl">
          <div className="space-y-6">
            <label className="block">
              <span className="text-neutral-200 font-semibold mb-2 block">
                Medication Name <span className="text-red-400">*</span>
              </span>
              <input
                type="text"
                value={medicationName}
                onChange={(e) => {
                  setMedicationName(e.target.value);
                  validateForm();
                }}
                className="w-full rounded-xl bg-neutral-800/50 text-white px-4 py-3 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter medication name (e.g., Ibuprofen)"
                disabled={isSubmitting}
                aria-invalid={!!formErrors.medicationName}
                aria-describedby="medicationName-error"
              />
              <AnimatePresence>
                {formErrors.medicationName && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-red-400 text-sm mt-1"
                    id="medicationName-error">
                    {formErrors.medicationName}
                  </motion.p>
                )}
              </AnimatePresence>
            </label>

            <label className="block">
              <span className="text-neutral-200 font-semibold mb-2 block">
                Description <span className="text-red-400">*</span>
              </span>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  validateForm();
                }}
                rows={4}
                placeholder="Describe the medication (e.g., dosage, purpose, side effects)"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-neutral-800/50 text-white px-4 py-3 border border-neutral-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                aria-invalid={!!formErrors.description}
                aria-describedby="description-error"
              />
              <AnimatePresence>
                {formErrors.description && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-red-400 text-sm mt-1"
                    id="description-error">
                    {formErrors.description}
                  </motion.p>
                )}
              </AnimatePresence>
            </label>

            <label className="block">
              <span className="text-neutral-200 font-semibold mb-2 block">
                Medication File <span className="text-red-400">*</span>
                <span className="text-neutral-400 text-sm ml-2">
                  (Max 3MB, JPEG, PNG, PDF)
                </span>
              </span>
              <div
                onDrop={(e) => !file && handleDrop(e)}
                onDragOver={(e) => !file && handleDragOver(e)}
                onDragLeave={() => !file && handleDragLeave()}
                className={`relative w-full rounded-xl border-2 border-dashed p-6 transition-all duration-200 ${
                  file
                    ? "border-neutral-700 bg-neutral-800/30 opacity-60 cursor-not-allowed"
                    : isDragging
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-neutral-600 bg-neutral-800/50"
                }`}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => handleFileChange(e)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isSubmitting || !!file}
                  ref={fileInputRef}
                  aria-invalid={!!formErrors.file}
                  aria-describedby="file-error"
                />
                <div className="flex flex-col items-center justify-center text-center">
                  <Upload
                    className={`h-8 w-8 mb-2 ${
                      file
                        ? "text-neutral-500"
                        : isDragging
                          ? "text-blue-500"
                          : "text-neutral-400"
                    }`}
                  />
                  <p className="text-neutral-300">
                    {file
                      ? "File selected. Remove to upload another."
                      : isDragging
                        ? "Drop your file here"
                        : "Drag & drop or click to upload"}
                  </p>
                  <p className="text-neutral-400 text-sm mt-1">
                    Supports JPEG, PNG, or PDF (max 3MB)
                  </p>
                </div>
              </div>
              {file && (
                <div className="mt-4 flex items-center gap-3">
                  {file.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <File className="w-12 h-12 text-neutral-400" />
                  )}
                  <div className="flex-1">
                    <p className="text-neutral-300 truncate">{file.name}</p>
                    <p className="text-neutral-400 text-sm">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile()}
                    className="text-red-400 hover:text-red-300"
                    aria-label="Remove file">
                    <X size={20} />
                  </button>
                </div>
              )}
              <AnimatePresence>
                {formErrors.file && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-red-400 text-sm mt-1"
                    id="file-error">
                    {formErrors.file}
                  </motion.p>
                )}
              </AnimatePresence>
            </label>

            <label className="block">
              <span className="text-neutral-200 font-semibold mb-2 block">
                Comment (optional)
              </span>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="Add any additional notes or context"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-neutral-800/50 text-white px-4 py-3 border border-neutral-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full rounded-xl bg-gradient-to-r from-green-500 to-lime-500 text-white font-semibold py-3 px-4 transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                isSubmitting
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:from-green-600 hover:to-lime-600"
              }`}>
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
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
                  Submitting...
                </div>
              ) : (
                "Submit Medication"
              )}
            </button>
          </div>
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
                        onClick={() =>
                          setModalState({ type: "details", medication: med })
                        }>
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
                    onClick={() =>
                      setModalState({ type: "details", medication: med })
                    }>
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
                onClick={() => setModalState({ type: "viewAll" })}
                className="mt-6 block mx-auto sm:mx-0 text-blue-400 font-semibold hover:text-blue-300 transition-colors duration-200 py-2 px-4 rounded-md border border-blue-400 hover:border-blue-300">
                View All Medications ({medications.length})
              </button>
            )}
          </>
        )}
      </section>

      {modalState.type && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6 font-light"
          onClick={() => {
            setModalState({ type: null });
            setIsEditing(false);
            setEditFormErrors({});
          }}>
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
              onClick={() => {
                setModalState({ type: null });
                setIsEditing(false);
                setEditFormErrors({});
              }}
              aria-label="Close modal">
              <X />
            </button>

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
                      Rejection Reason (optional)
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
                    disabled={isUpdating}
                    className={`px-4 py-2 rounded-xl ${
                      modalState.adminStatus === "approved"
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

            {modalState.type === "details" && modalState.medication && (
              <>
                <h3 className="text-xl sm:text-2xl font-bold mb-6 text-center sm:text-left bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
                  {isEditing ? "Edit Medication" : "Medication Details"}
                </h3>
                {isEditing ? (
                  <div className="space-y-6">
                    <label className="block">
                      <span className="text-neutral-200 font-semibold mb-2 block">
                        Medication Name <span className="text-red-400">*</span>
                      </span>
                      <input
                        type="text"
                        value={editForm.medicationName}
                        onChange={(e) => {
                          setEditForm({
                            ...editForm,
                            medicationName: e.target.value,
                          });
                        }}
                        className="w-full rounded-xl bg-neutral-800/50 text-white px-4 py-3 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter medication name (e.g., Ibuprofen)"
                        disabled={isUpdating}
                        aria-invalid={!!editFormErrors.medicationName}
                        aria-describedby="edit-medicationName-error"
                      />
                      <AnimatePresence>
                        {editFormErrors.medicationName && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-red-400 text-sm mt-1"
                            id="edit-medicationName-error">
                            {editFormErrors.medicationName}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </label>

                    <label className="block">
                      <span className="text-neutral-200 font-semibold mb-2 block">
                        Description <span className="text-red-400">*</span>
                      </span>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => {
                          setEditForm({
                            ...editForm,
                            description: e.target.value,
                          });
                        }}
                        rows={4}
                        className="w-full rounded-xl bg-neutral-800/50 text-white px-4 py-3 border border-neutral-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Describe the medication (e.g., dosage, purpose, side effects)"
                        disabled={isUpdating}
                        aria-invalid={!!editFormErrors.description}
                        aria-describedby="edit-description-error"
                      />
                      <AnimatePresence>
                        {editFormErrors.description && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-red-400 text-sm mt-1"
                            id="edit-description-error">
                            {editFormErrors.description}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </label>

                    <label className="block">
                      <span className="text-neutral-200 font-semibold mb-2 block">
                        Medication File
                      </span>
                      <div className="relative w-full rounded-xl border-2 border-dashed border-neutral-700 bg-neutral-800/30 p-6 transition-all duration-200 opacity-60 cursor-not-allowed">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,application/pdf"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-not-allowed"
                          disabled={true}
                        />
                        <div className="flex flex-col items-center justify-center text-center">
                          <Upload className="h-8 w-8 mb-2 text-neutral-500" />
                          <p className="text-neutral-300">
                            Files cannot be changed. To update the file, delete
                            this medication and submit a new one.
                          </p>
                        </div>
                      </div>
                      {modalState.medication.file && (
                        <div className="mt-4 flex items-center gap-3">
                          {modalState.medication.file.type.startsWith(
                            "image/"
                          ) ? (
                            <img
                              src={modalState.medication.file.url}
                              alt="Existing file preview"
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          ) : (
                            <File className="w-12 h-12 text-neutral-400" />
                          )}
                          <div className="flex-1">
                            <p className="text-neutral-300 truncate">
                              {modalState.medication.file.name}
                            </p>
                            <p className="text-neutral-400 text-sm">
                              {(
                                modalState.medication.file.size /
                                1024 /
                                1024
                              ).toFixed(2)}{" "}
                              MB
                            </p>
                          </div>
                        </div>
                      )}
                    </label>

                    <label className="block">
                      <span className="text-neutral-200 font-semibold mb-2 block">
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
                        className="w-full rounded-xl bg-neutral-800/50 text-white px-4 py-3 border border-neutral-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Add any additional notes or context"
                        disabled={isUpdating}
                      />
                    </label>

                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditFormErrors({});
                        }}
                        className="px-4 py-2 rounded-xl bg-neutral-500/10 text-neutral-400 border-neutral-500/20 hover:bg-neutral-700 transition-colors duration-200"
                        disabled={isUpdating}>
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateSubmit}
                        disabled={
                          isUpdating || Object.keys(editFormErrors).length > 0
                        }
                        className={`px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-lime-500 text-white transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                          isUpdating || Object.keys(editFormErrors).length > 0
                            ? "opacity-60 cursor-not-allowed"
                            : "hover:from-green-600 hover:to-lime-600"
                        }`}>
                        {isUpdating ? (
                          <div className="flex items-center justify-center gap-2">
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
                          </div>
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
                        <p>{modalState.medication.medicationName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-neutral-300">
                          Status:
                        </p>
                        <StatusBadge status={modalState.medication.status} />
                      </div>
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
                      {modalState.medication.reviewerName && (
                        <div>
                          <p className="font-semibold text-neutral-300">
                            Reviewed By:
                          </p>
                          <p>{modalState.medication.reviewerName ?? "-"}</p>
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
                        <p className="font-semibold text-neutral-300">
                          Comment:
                        </p>
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

                    <div className="mt-6 flex justify-end gap-3">
                      {(modalState.medication.status === "pending" ||
                        modalState.medication.status === "rejected") && (
                        <>
                          {!isEditing && (
                            <button
                              onClick={() =>
                                modalState.medication &&
                                handleEditClick(modalState.medication)
                              }
                              className="flex items-center gap-2 bg-lime-500/10 text-lime-400 border-lime-500/20 py-2 px-4 rounded-xl transition-colors duration-200 hover:bg-lime-500/20">
                              <Edit size={18} /> Edit
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (modalState.medication?.id) {
                                deleteMedication(modalState.medication.id);
                              }
                            }}
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
                        </>
                      )}
                      {isAdmin &&
                        modalState.medication.status === "pending" && (
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
                    </div>
                  </div>
                )}
              </>
            )}

            {modalState.type === "viewAll" && (
              <>
                <h3 className="text-xl sm:text-2xl font-bold mb-6 text-center sm:text-left bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
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
                            setModalState({ type: "details", medication: med });
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
