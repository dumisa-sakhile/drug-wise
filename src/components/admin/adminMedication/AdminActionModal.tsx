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
        className="bg-zinc-950 rounded-2xl shadow-lg p-6 max-w-md w-full border border-zinc-800 relative overflow-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}>
        <motion.button
          className="absolute top-2 right-2 text-gray-400 hover:text-white text-3xl font-light p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 transition-colors duration-200"
          onClick={onCancel}
          aria-label="Close modal"
          initial={{ opacity: 0, rotate: -90 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}>
          <X />
        </motion.button>
        <motion.h3
          className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-100"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}>
          {adminStatus === "approved" ? (
            <>
              <Check className="text-lime-400" /> Approve Medication
            </>
          ) : (
            <>
              <AlertCircle className="text-rose-400" /> Reject Medication
            </>
          )}
        </motion.h3>
        {adminStatus === "rejected" && (
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}>
            <label className="block text-gray-100 font-semibold mb-2">
              Rejection Reason (required)
            </label>
            <textarea
              value={rejectionReason ?? ""}
              onChange={(e) => onRejectionReasonChange(e.target.value)}
              rows={3}
              className="w-full rounded-xl bg-zinc-900 text-white px-4 py-2 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-lime-500 font-light"
              placeholder="Provide reason for rejection..."
            />
          </motion.div>
        )}
        <motion.div
          className="flex justify-end gap-3 mt-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}>
          <motion.button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-zinc-800/10 text-gray-400 border border-zinc-800/20 hover:bg-zinc-800 transition-colors duration-200 font-light"
            variants={{
              hidden: { opacity: 0, scale: 0.95 },
              visible: { opacity: 1, scale: 1 },
            }}
            transition={{ delay: 0.5, duration: 0.4 }}>
            Cancel
          </motion.button>
          <motion.button
            onClick={() => onConfirm(rejectionReason)}
            disabled={
              isUpdating ||
              (adminStatus === "rejected" && !rejectionReason?.trim())
            }
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:scale-105 font-light ${
              adminStatus === "approved"
                ? "bg-gradient-to-r from-green-500 to-lime-500 hover:from-green-600 hover:to-lime-600 text-gray-900"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
            } ${
              isUpdating ||
              (adminStatus === "rejected" && !rejectionReason?.trim())
                ? "opacity-60 cursor-not-allowed"
                : ""
            }`}
            variants={{
              hidden: { opacity: 0, scale: 0.95 },
              visible: { opacity: 1, scale: 1 },
            }}
            transition={{ delay: 0.6, duration: 0.4 }}>
            {isUpdating ? (
              <>
                <svg
                  className={`animate-spin h-5 w-5 ${
                    adminStatus === "approved"
                      ? "text-gray-900"
                      : "text-rose-400"
                  }`}
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
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default AdminActionModal;
