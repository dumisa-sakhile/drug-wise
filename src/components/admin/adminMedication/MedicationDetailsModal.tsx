import { motion } from "framer-motion";
import { X, Check, AlertCircle, RotateCcw, Trash2 } from "lucide-react";

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
  reviewerName?: string;
  file?: {
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
}

interface MedicationDetailsModalProps {
  medication: MedicationType;
  users: Record<string, User>;
  isReverting: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRevert: () => void;
  onDelete: () => void;
  onImageClick: () => void;
}

function StatusBadge({ status }: { status: MedicationType["status"] }) {
  const baseClasses =
    "px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap";
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

function MedicationDetailsModal({
  medication,
  users,
  isReverting,
  isDeleting,
  onClose,
  onApprove,
  onReject,
  onRevert,
  onDelete,
  onImageClick,
}: MedicationDetailsModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6 font-light"
      onClick={onClose}>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="bg-neutral-800 rounded-2xl shadow-lg p-6 max-w-3xl w-full border border-neutral-700 relative overflow-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}>
        <button
          className="absolute top-2 right-2 text-neutral-400 hover:text-white text-3xl font-light p-2 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors duration-200"
          onClick={onClose}
          aria-label="Close modal">
          <X />
        </button>
        <h3 className="text-2xl font-bold mb-6 text-left bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
          Medication Details
        </h3>
        <div className="space-y-4 text-neutral-200 text-base">
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-neutral-300">Medication Name:</p>
              <p>{medication.medicationName}</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-neutral-300">Status:</p>
              <StatusBadge status={medication.status} />
            </div>
            <div>
              <p className="font-semibold text-neutral-300">Submitted By:</p>
              <p>
                {users[medication.userId]?.name +
                  " " +
                  (users[medication.userId]?.surname || "") ||
                  medication.userId}
              </p>
            </div>
            {medication.reviewerName && (
              <div>
                <p className="font-semibold text-neutral-300">Reviewed By:</p>
                <p>{medication.reviewerName}</p>
              </div>
            )}
            <div>
              <p className="font-semibold text-neutral-300">Submitted At:</p>
              <p>
                {medication.submittedAt?.toDate?.().toLocaleString() ?? "-"}
              </p>
            </div>
            {medication.reviewedAt && (
              <div>
                <p className="font-semibold text-neutral-300">Reviewed At:</p>
                <p>{medication.reviewedAt.toDate().toLocaleString()}</p>
              </div>
            )}
            <div>
              <p className="font-semibold text-neutral-300">Description:</p>
              <p className="whitespace-pre-line">{medication.description}</p>
            </div>
            {medication.comment && (
              <div>
                <p className="font-semibold text-neutral-300">Comment:</p>
                <p className="whitespace-pre-line">{medication.comment}</p>
              </div>
            )}
            <div>
              <p className="font-semibold text-neutral-300">Uploaded Image:</p>
              {medication.file ? (
                <div className="my-2">
                  <img
                    src={medication.file.url}
                    alt={medication.file.name}
                    className="w-32 h-32 object-cover rounded-lg shadow-md hover:scale-105 transition-transform duration-200 cursor-pointer"
                    onClick={onImageClick}
                  />
                  <span className="text-neutral-500 text-xs ml-2">
                    Uploaded:{" "}
                    {new Date(medication.file.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              ) : (
                <p>No image uploaded.</p>
              )}
            </div>
            {medication.status === "rejected" && medication.rejectionReason && (
              <div className="bg-red-900/20 p-4 rounded-xl">
                <p className="font-semibold text-red-300">Rejection Reason:</p>
                <p className="text-red-200 whitespace-pre-line">
                  {medication.rejectionReason}
                </p>
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end gap-3 flex-wrap">
            {medication.status === "pending" && (
              <>
                <button
                  onClick={onApprove}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-xl transition-colors duration-200">
                  <Check size={18} /> Approve
                </button>
                <button
                  onClick={onReject}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-xl transition-colors duration-200">
                  <AlertCircle size={18} /> Reject
                </button>
              </>
            )}
            {(medication.status === "approved" ||
              medication.status === "rejected") && (
              <button
                onClick={onRevert}
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
              onClick={onDelete}
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
      </motion.div>
    </motion.div>
  );
}

export default MedicationDetailsModal;
