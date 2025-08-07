import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
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
  addDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { put, del } from "@vercel/blob";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Pill,
  X,
  ArrowRight,
  Trash2,
  Edit,
  Check,
  Upload,
  ChevronLeft,
  ChevronRight,
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
    type: "details" | "viewAll" | null;
    medication?: MedicationType | null;
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
  const [isImageExpanded, setIsImageExpanded] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [rowsPerPage, setRowsPerPage] = useState<number>(15);
  const [currentPage, setCurrentPage] = useState<number>(1);
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

    if (!isEdit && !file) {
      errors.file = "An image file is required";
    } else if (!isEdit && file) {
      if (file.size > 3 * 1024 * 1024) {
        errors.file = "Image size must be less than 3MB";
      } else if (!["image/jpeg", "image/png"].includes(file.type)) {
        errors.file = "Only JPEG or PNG images are allowed";
      }
    }

    if (isEdit) {
      setEditFormErrors(errors);
    } else {
      setFormErrors(errors);
    }
    return Object.keys(errors).length === 0;
  };

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

  // Memoized filter and search logic
  const filteredMedications = useMemo(() => {
    let result = medications;
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      result = result.filter(
        (m) =>
          (m.medicationName?.toLowerCase() || "").includes(searchLower) ||
          (m.description?.toLowerCase() || "").includes(searchLower) ||
          (m.comment?.toLowerCase() || "").includes(searchLower)
      );
    }
    if (filterStatus !== "all" && !searchTerm.trim()) {
      result = result.filter((m) => m.status === filterStatus);
    }
    return result;
  }, [medications, searchTerm, filterStatus]);

  // Memoized pagination logic
  const paginatedMedications = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredMedications.slice(start, start + rowsPerPage);
  }, [filteredMedications, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredMedications.length / rowsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, rowsPerPage]);

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
          `Failed to upload image: ${error.message || "Unknown error"}`
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
      await deleteDoc(medRef);
      if (fileUrl) {
        del(fileUrl, {
          token: import.meta.env.VITE_BLOB_READ_WRITE_TOKEN,
        }).catch((error: any) => {
          console.error(
            `Failed to delete image: ${error.message || "Unknown error"}`
          );
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

  const handleEditClick = (med: MedicationType) => {
    setEditForm({
      medicationName: med.medicationName,
      description: med.description,
      comment: med.comment ?? "",
    });
    setEditFormErrors({});
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setFilterStatus("all");
  };

  if (!currentUser) {
    return (
      <div className="p-6 text-gray-300 font-light min-h-screen flex items-center justify-center bg-zinc-950">
        Please sign in to view medications
      </div>
    );
  }

  return (
    <div className="font-light max-w-5xl mx-auto md:px-4 py-8 min-h-screen text-gray-100 bg-zinc-950">
      <title>DrugWise - Medication Management</title>
      <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center sm:text-left bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
        Submit New Medication
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitMedication();
        }}
        className="bg-zinc-900 p-8 rounded-xl border border-zinc-800 mb-10 max-w-3xl mx-auto shadow-xl">
        <div className="space-y-6">
          <label className="block">
            <span className="text-gray-200 font-semibold mb-2 block">
              Medication Name <span className="text-red-400">*</span>
            </span>
            <input
              type="text"
              value={medicationName}
              onChange={(e) => {
                setMedicationName(e.target.value);
                validateForm();
              }}
              className="w-full rounded-lg bg-zinc-900 text-base text-gray-100 px-4 py-2.5 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-lime-500 font-light"
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
            <span className="text-gray-200 font-semibold mb-2 block">
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
              className="w-full rounded-lg bg-zinc-900 text-base text-gray-100 px-4 py-2.5 border border-zinc-700 resize-none focus:outline-none focus:ring-2 focus:ring-lime-500 font-light"
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
            <span className="text-gray-200 font-semibold mb-2 block">
              Medication Image <span className="text-red-400">*</span>
              <span className="text-gray-400 text-sm ml-2">
                (Max 3MB, JPEG, PNG)
              </span>
            </span>
            <div
              onDrop={(e) => !file && handleDrop(e)}
              onDragOver={(e) => !file && handleDragOver(e)}
              onDragLeave={() => !file && handleDragLeave()}
              className={`relative w-full rounded-lg border-2 border-dashed p-6 transition-all duration-200 ${
                file
                  ? "border-zinc-700 bg-zinc-900 opacity-60 cursor-not-allowed"
                  : isDragging
                    ? "border-lime-500 bg-lime-500/10"
                    : "border-zinc-700 bg-zinc-900"
              }`}>
              <input
                type="file"
                accept="image/jpeg,image/png"
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
                      ? "text-gray-500"
                      : isDragging
                        ? "text-lime-500"
                        : "text-gray-400"
                  }`}
                />
                <p className="text-gray-300 font-light">
                  {file
                    ? "Image selected. Remove to upload another."
                    : isDragging
                      ? "Drop your image here"
                      : "Drag & drop or click to upload"}
                </p>
                <p className="text-gray-400 text-sm mt-1 font-light">
                  Supports JPEG or PNG (max 3MB)
                </p>
              </div>
            </div>
            {file && (
              <div className="mt-4 flex items-center gap-3">
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-lg shadow-md hover:scale-105 transition-transform duration-200 cursor-pointer"
                  onClick={() => setIsImageExpanded(true)}
                />
                <div className="flex-1">
                  <p className="text-gray-300 truncate font-light">
                    {file.name}
                  </p>
                  <p className="text-gray-400 text-sm font-light">
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
                  className="text-red-400 text-sm mt-1 font-light"
                  id="file-error">
                  {formErrors.file}
                </motion.p>
              )}
            </AnimatePresence>
          </label>

          <label className="block">
            <span className="text-gray-200 font-semibold mb-2 block">
              Comment (optional)
            </span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="Add any additional notes or context"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-zinc-900 text-base text-gray-100 px-4 py-2.5 border border-zinc-700 resize-none focus:outline-none focus:ring-2 focus:ring-lime-500 font-light"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full rounded-lg bg-gradient-to-r from-green-500 to-lime-500 text-white font-semibold py-2.5 px-4 transition-all duration-200 hover:shadow-lg ${
              isSubmitting
                ? "opacity-60 cursor-not-allowed"
                : "hover:from-green-600 hover:to-lime-600"
            }`}>
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-gray-100 border-t-lime-500 rounded-full"
                />
                Submitting...
              </div>
            ) : (
              "Submit Medication"
            )}
          </button>
        </div>
      </form>

      <section className="max-w-5xl mx-auto mt-12">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center sm:text-left bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
          Your Submitted Medications
        </h2>

        {medsLoading ? (
          <div className="flex justify-center items-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-gray-600 border-t-lime-500 rounded-full"
            />
          </div>
        ) : (
          <>
            {/* Mobile Filters */}
            <div className="px-4 sm:hidden mb-6">
              <div className="flex flex-col gap-4 items-center">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 text-base text-gray-100 rounded-lg shadow-sm border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-lime-500 font-light"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(
                      e.target.value as
                        | "all"
                        | "pending"
                        | "approved"
                        | "rejected"
                    )
                  }
                  className="w-full px-3 py-2.5 bg-zinc-900 text-base text-gray-100 rounded-lg shadow-sm border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-lime-500 font-light">
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <span className="text-gray-400 font-light text-sm">
                  Showing {filteredMedications.length} medications
                </span>
              </div>
            </div>

            {/* Desktop Table and Search Bar */}
            <div className="hidden sm:block overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl">
              <div className="flex flex-col sm:flex-row gap-4 items-center p-6 bg-zinc-900">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by name, description, or comment..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 text-base text-gray-100 rounded-full shadow-inner border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-lime-500 font-light"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(
                      e.target.value as
                        | "all"
                        | "pending"
                        | "approved"
                        | "rejected"
                    )
                  }
                  className="w-full sm:w-1/4 px-4 py-2.5 bg-zinc-950 text-base text-gray-100 rounded-full shadow-inner border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-lime-500 font-light">
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <span className="text-gray-400 font-light text-sm">
                  {filteredMedications.length} total
                </span>
              </div>

              <table className="min-w-full text-left text-gray-300 text-sm">
                <thead className="bg-zinc-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Medication</th>
                    <th className="px-6 py-4 font-semibold">Description</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Submitted At</th>
                    <th className="px-6 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredMedications.length === 0 ? (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="border-b border-zinc-800">
                        <td
                          colSpan={5}
                          className="px-6 py-8 text-center text-gray-500 font-light">
                          No medications found.
                        </td>
                      </motion.tr>
                    ) : (
                      paginatedMedications.map((med) => (
                        <motion.tr
                          key={med.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className={`border-b border-zinc-800 cursor-pointer transition-colors duration-200 hover:bg-zinc-800`}
                          onClick={() =>
                            setModalState({ type: "details", medication: med })
                          }>
                          <td
                            className="px-6 py-4 font-light max-w-[150px] truncate"
                            title={med.medicationName}>
                            {med.medicationName}
                          </td>
                          <td
                            className="px-6 py-4 font-light max-w-[250px] truncate"
                            title={med.description}>
                            {med.description}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={med.status} />
                          </td>
                          <td className="px-6 py-4 font-light whitespace-nowrap">
                            {med.submittedAt?.toDate?.().toLocaleDateString() ??
                              "-"}
                          </td>
                          <td className="px-6 py-4 text-lime-400 hover:text-lime-300 flex items-center gap-1 font-light">
                            View <ArrowRight size={16} />
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="px-4 sm:hidden space-y-4">
              {filteredMedications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-12 flex flex-col items-center justify-center text-gray-500">
                  <Pill className="text-6xl mb-4 select-none" />
                  <h2 className="text-xl font-bold mb-2 text-gray-200">
                    No Medications Found
                  </h2>
                  <p className="font-light max-w-md text-gray-400">
                    No medications found matching your criteria.
                  </p>
                </motion.div>
              ) : (
                <AnimatePresence>
                  {paginatedMedications.map((med, index) => (
                    <motion.div
                      key={med.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 cursor-pointer shadow-md hover:bg-zinc-800 transition-colors duration-200"
                      onClick={() =>
                        setModalState({ type: "details", medication: med })
                      }>
                      <div className="flex justify-between items-start mb-2">
                        <h3
                          className="text-lg font-medium truncate max-w-[75%]"
                          title={med.medicationName}>
                          {med.medicationName}
                        </h3>
                        <StatusBadge status={med.status} />
                      </div>
                      <p className="text-gray-400 font-light text-sm mb-2 truncate">
                        <span className="font-medium">Description:</span>{" "}
                        {med.description}
                      </p>
                      <p className="text-gray-500 font-light text-xs">
                        <span className="font-medium">Date:</span>{" "}
                        {med.submittedAt?.toDate?.().toLocaleDateString() ??
                          "-"}
                      </p>
                      <p className="text-lime-400 text-sm mt-2 text-right font-bold">
                        View Details
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Pagination */}
            {!(medsLoading || filteredMedications.length === 0) && (
              <div className="flex items-center justify-between mt-6 px-4 text-gray-400 font-light">
                <div className="text-sm">
                  <select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    className="bg-zinc-900 text-gray-100 rounded px-3 py-1 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-lime-500">
                    {[5, 10, 15, 25, 50].map((n) => (
                      <option key={n} value={n}>
                        {n} per page
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="p-2 rounded-full hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <ChevronLeft size="16" />
                  </button>
                  <span className="text-sm text-gray-300 font-medium">
                    Page {currentPage} of {totalPages || 1}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="p-2 rounded-full hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <ChevronRight size="16" />
                  </button>
                </div>
              </div>
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
            setIsImageExpanded(false);
          }}>
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="bg-zinc-900 rounded-xl shadow-2xl p-6 max-w-full sm:max-w-3xl w-full border border-zinc-800 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full transition-colors duration-200"
              onClick={() => {
                setModalState({ type: null });
                setIsEditing(false);
                setEditFormErrors({});
                setIsImageExpanded(false);
              }}
              aria-label="Close modal">
              <X size={24} />
            </button>

            {modalState.type === "details" && modalState.medication && (
              <>
                <h3 className="text-xl sm:text-2xl font-bold mb-6 text-center sm:text-left bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
                  {isEditing ? "Edit Medication" : "Medication Details"}
                </h3>
                {isEditing ? (
                  <div className="space-y-6">
                    <label className="block">
                      <span className="text-gray-200 font-semibold mb-2 block">
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
                        className="w-full rounded-lg bg-zinc-900 text-base text-gray-100 px-4 py-2.5 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-lime-500 font-light"
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
                            className="text-red-400 text-sm mt-1 font-light"
                            id="edit-medicationName-error">
                            {editFormErrors.medicationName}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </label>

                    <label className="block">
                      <span className="text-gray-200 font-semibold mb-2 block">
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
                        className="w-full rounded-lg bg-zinc-900 text-base text-gray-100 px-4 py-2.5 border border-zinc-700 resize-none focus:outline-none focus:ring-2 focus:ring-lime-500 font-light"
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
                            className="text-red-400 text-sm mt-1 font-light"
                            id="edit-description-error">
                            {editFormErrors.description}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </label>

                    <label className="block">
                      <span className="text-gray-200 font-semibold mb-2 block">
                        Medication Image
                      </span>
                      <div className="relative w-full rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900 p-6 transition-all duration-200 opacity-60 cursor-not-allowed">
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-not-allowed"
                          disabled={true}
                        />
                        <div className="flex flex-col items-center justify-center text-center">
                          <Upload className="h-8 w-8 mb-2 text-gray-500" />
                          <p className="text-gray-300 font-light">
                            Images cannot be changed. To update the image,
                            delete this medication and submit a new one.
                          </p>
                        </div>
                      </div>
                      {modalState.medication.file && (
                        <div className="mt-4 flex items-center gap-3">
                          <img
                            src={modalState.medication.file.url}
                            alt="Existing file preview"
                            className="w-24 h-24 object-cover rounded-lg shadow-md hover:scale-105 transition-transform duration-200 cursor-pointer"
                            onClick={() => setIsImageExpanded(true)}
                          />
                          <div className="flex-1">
                            <p className="text-gray-300 truncate font-light">
                              {modalState.medication.file.name}
                            </p>
                            <p className="text-gray-400 text-sm font-light">
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
                      <span className="text-gray-200 font-semibold mb-2 block">
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
                        className="w-full rounded-lg bg-zinc-900 text-base text-gray-100 px-4 py-2.5 border border-zinc-700 resize-none focus:outline-none focus:ring-2 focus:ring-lime-500 font-light"
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
                        className="px-4 py-2 rounded-lg bg-zinc-800 text-gray-400 border border-zinc-700 hover:bg-zinc-700 transition-colors duration-200 font-light"
                        disabled={isUpdating}>
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateSubmit}
                        disabled={
                          isUpdating || Object.keys(editFormErrors).length > 0
                        }
                        className={`px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-lime-500 text-white transition-all duration-200 hover:shadow-lg ${
                          isUpdating || Object.keys(editFormErrors).length > 0
                            ? "opacity-60 cursor-not-allowed"
                            : "hover:from-green-600 hover:to-lime-600"
                        }`}>
                        {isUpdating ? (
                          <div className="flex items-center justify-center gap-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                              className="w-5 h-5 border-2 border-gray-100 border-t-lime-500 rounded-full"
                            />
                            Updating...
                          </div>
                        ) : (
                          "Update Medication"
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-gray-200 text-sm sm:text-base font-light">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold text-gray-300">
                          Medication Name:
                        </p>
                        <p>{modalState.medication.medicationName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-300">Status:</p>
                        <StatusBadge status={modalState.medication.status} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-300">
                          Submitted At:
                        </p>
                        <p>
                          {modalState.medication.submittedAt
                            ?.toDate?.()
                            .toLocaleString() ?? "-"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="font-semibold text-gray-300">
                        Description:
                      </p>
                      <p className="whitespace-pre-line">
                        {modalState.medication.description}
                      </p>
                    </div>

                    {modalState.medication.comment && (
                      <div>
                        <p className="font-semibold text-gray-300">Comment:</p>
                        <p className="whitespace-pre-line">
                          {modalState.medication.comment}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="font-semibold text-gray-300">
                        Uploaded Image:
                      </p>
                      {modalState.medication.file ? (
                        <div className="my-2">
                          <img
                            src={modalState.medication.file.url}
                            alt={modalState.medication.file.name}
                            className="w-32 h-32 object-cover rounded-lg shadow-md hover:scale-105 transition-transform duration-200 cursor-pointer"
                            onClick={() => setIsImageExpanded(true)}
                          />
                          <span className="text-gray-500 text-xs ml-2 font-light">
                            Uploaded:{" "}
                            {new Date(
                              modalState.medication.file.uploadedAt
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <p>No image uploaded.</p>
                      )}
                    </div>

                    {modalState.medication.status === "rejected" &&
                      modalState.medication.rejectionReason && (
                        <div className="bg-red-900/20 p-4 rounded-lg">
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
                              className="flex items-center gap-2 bg-lime-900/20 text-lime-400 border border-lime-900/50 py-2 px-4 rounded-lg transition-colors duration-200 hover:bg-lime-900/30 font-light">
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
                            className={`flex items-center gap-2 bg-red-900/20 text-red-400 border border-red-900/50 py-2 px-4 rounded-lg transition-colors duration-200 hover:bg-red-900/30 font-light ${
                              isDeleting ? "opacity-60 cursor-not-allowed" : ""
                            }`}>
                            {isDeleting ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: "linear",
                                  }}
                                  className="w-5 h-5 border-2 border-gray-100 border-t-red-500 rounded-full"
                                />
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
                <div className="overflow-x-auto rounded-lg border border-zinc-800">
                  <table className="min-w-full text-sm text-gray-300">
                    <thead className="bg-zinc-800">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Name</th>
                        <th className="px-4 py-3 font-semibold hidden sm:table-cell">
                          Description
                        </th>
                        <th className="px-4 py-3 font-semibold hidden md:table-cell">
                          Comment
                        </th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold hidden sm:table-cell">
                          Submitted At
                        </th>
                        <th className="px-4 py-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedMedications.map((med) => (
                        <motion.tr
                          key={med.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="border-b border-zinc-800 hover:bg-zinc-800 cursor-pointer transition-colors duration-200"
                          onClick={() => {
                            setModalState({ type: "details", medication: med });
                          }}>
                          <td
                            className="px-4 py-3 font-light max-w-[150px] truncate"
                            title={med.medicationName}>
                            {med.medicationName}
                          </td>
                          <td
                            className="px-4 py-3 font-light max-w-[250px] truncate hidden sm:table-cell"
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
                          <td className="px-4 py-3 text-lime-400 hover:text-lime-300 flex items-center gap-1 font-light">
                            View <ArrowRight size={16} />
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}

      {isImageExpanded && modalState.medication?.file && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-60 p-6"
          onClick={() => setIsImageExpanded(false)}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}>
            <img
              src={modalState.medication.file.url}
              alt={modalState.medication.file.name}
              className="w-full h-auto object-contain rounded-lg shadow-xl max-w-[90vw] max-h-[90vh]"
            />
            <button
              className="absolute top-2 right-2 text-gray-200 hover:text-white p-2 rounded-full bg-zinc-700 hover:bg-zinc-600 transition-colors duration-200"
              onClick={() => setIsImageExpanded(false)}
              aria-label="Close image">
              <X size={24} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: MedicationType["status"] }) {
  const baseClasses =
    "px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap";
  switch (status) {
    case "approved":
      return (
        <span
          className={`${baseClasses} bg-green-900 text-green-300 flex items-center gap-1`}>
          <Check size={14} /> Approved
        </span>
      );
    case "rejected":
      return (
        <span
          className={`${baseClasses} bg-red-900 text-red-300 flex items-center gap-1`}>
          <X size={14} /> Rejected
        </span>
      );
    case "pending":
    default:
      return (
        <span className={`${baseClasses} bg-yellow-900 text-yellow-300`}>
          Pending Review
        </span>
      );
  }
}

export default Medication;
