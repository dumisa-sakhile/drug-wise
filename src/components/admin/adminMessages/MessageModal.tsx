import { motion } from "framer-motion";
import { X, Check, Trash2 } from "lucide-react";
import type { Message } from "./types";

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message | null;
  adminName: string;
  setMessage: (message: Message | null) => void;
  updateMutation: { mutate: (message: Message) => void; isPending: boolean };
  deleteMutation: { mutate: (messageId: string) => void; isPending: boolean };
}

function MessageModal({
  isOpen,
  onClose,
  message,
  adminName,
  setMessage,
  updateMutation,
  deleteMutation,
}: MessageModalProps) {
  if (!isOpen || !message) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="bg-neutral-800 rounded-2xl shadow-lg p-6 w-full max-w-md border border-neutral-700 relative overflow-auto max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}>
        <button
          className="absolute top-2 right-2 text-neutral-400 hover:text-white text-3xl font-light p-2 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors duration-200"
          onClick={onClose}
          aria-label="Close modal">
          <X />
        </button>
        <h2 className="text-2xl sm:text-2xl font-bold mb-6 text-center sm:text-left bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
          {message.senderName === adminName ? "Edit Message" : "View Message"}
        </h2>
        <div className="mb-4">
          <label className="block text-neutral-200 font-semibold mb-2">
            Subject
          </label>
          {message.senderName === adminName ? (
            <input
              type="text"
              value={message.subject}
              onChange={(e) =>
                setMessage({ ...message, subject: e.target.value })
              }
              className="w-full px-4 py-3 bg-neutral-800/50 text-white rounded-xl border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-light"
            />
          ) : (
            <p className="w-full px-4 py-3 bg-neutral-800/50 text-white rounded-xl font-light">
              {message.subject}
            </p>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-neutral-200 font-semibold mb-2">
            Message
          </label>
          {message.senderName === adminName ? (
            <textarea
              value={message.content}
              onChange={(e) =>
                setMessage({ ...message, content: e.target.value })
              }
              className="w-full h-40 px-4 py-3 bg-neutral-800/50 text-white rounded-xl resize-none border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-light"
            />
          ) : (
            <p className="w-full h-40 px-4 py-3 bg-neutral-800/50 text-white rounded-xl font-light whitespace-pre-wrap">
              {message.content}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <motion.button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-500/10 text-neutral-400 border-neutral-500/20 hover:bg-neutral-700 transition-colors duration-200"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}>
            Close
          </motion.button>
          {message.senderName === adminName && (
            <>
              <motion.button
                type="button"
                className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 transition-colors duration-200 flex items-center gap-2"
                onClick={() => deleteMutation.mutate(message.id)}
                disabled={deleteMutation.isPending}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}>
                {deleteMutation.isPending ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-rose-400"
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
                    <Trash2 size={18} />
                    Delete
                  </>
                )}
              </motion.button>
              <motion.button
                type="button"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-lime-500 hover:from-green-600 hover:to-lime-600 text-white flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={() => updateMutation.mutate(message)}
                disabled={updateMutation.isPending}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}>
                {updateMutation.isPending ? (
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
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Save Changes
                  </>
                )}
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default MessageModal;
