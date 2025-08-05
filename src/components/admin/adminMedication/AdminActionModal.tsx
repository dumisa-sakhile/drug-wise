import { motion } from "framer-motion";
import { Check, AlertCircle, X } from "lucide-react";

interface AdminActionModalProps {
  adminStatus: "approved" | "rejected";
  isUpdating: boolean;
  rejectionReason?: string;
  onConfirm: (rejectionReason?: string) => void;
  onCancel: () => void;
  onRejectionReasonChange: (reason: string) => void;
}

function AdminActionModal({
  adminStatus,
  isUpdating,
  rejectionReason,
  onConfirm,
  onCancel,
  onRejectionReasonChange,
}: AdminActionModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6 font-light"
      onClick={onCancel}>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="bg-neutral-800 rounded-2xl shadow-lg p-6 max-w-md w-full border border-neutral-700 relative overflow-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}>
        <button
          className="absolute top-2 right-2 text-neutral-400 hover:text-white text-3xl font-light p-2 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors duration-200"
          onClick={onCancel}
          aria-label="Close modal">
          <X />
        </button>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          {adminStatus === "approved" ? (
            <>
              <Check className="text-green-400" /> Approve Medication
            </>
          ) : (
            <>
              <AlertCircle className="text-red-400" /> Reject Medication
            </>
          )}
        </h3>
        {adminStatus === "rejected" && (
          <div className="mb-4">
            <label className="block text-neutral-300 mb-2">
              Rejection Reason (required)
            </label>
            <textarea
              value={rejectionReason ?? ""}
              onChange={(e) => onRejectionReasonChange(e.target.value)}
              rows={3}
              className="w-full rounded-xl bg-neutral-900 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Provide reason for rejection..."
            />
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-neutral-500/10 text-neutral-400 border-neutral-500/20 hover:bg-neutral-700 transition-colors duration-200">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(rejectionReason)}
            disabled={
              isUpdating ||
              (adminStatus === "rejected" && !rejectionReason?.trim())
            }
            className={`px-4 py-2 rounded-xl ${
              adminStatus === "approved"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            } text-white transition-colors duration-200 flex items-center gap-2 ${
              isUpdating ||
              (adminStatus === "rejected" && !rejectionReason?.trim())
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
                {adminStatus === "approved" ? (
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
  );
}

export default AdminActionModal;
