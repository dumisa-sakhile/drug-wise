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
        className="bg-zinc-950 rounded-2xl shadow-lg p-6 w-full max-w-md border border-zinc-800 relative overflow-auto max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}>
        <motion.button
          className="absolute top-2 right-2 text-gray-400 hover:text-white text-3xl font-light p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 transition-colors duration-200"
          onClick={onClose}
          aria-label="Close modal"
          initial={{ opacity: 0, rotate: -90 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}>
          <X />
        </motion.button>
        <motion.h2
          className="text-2xl sm:text-2xl font-semibold mb-6 text-center sm:text-left bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}>
          {message.senderName === adminName ? "Edit Message" : "View Message"}
        </motion.h2>
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}>
          <label className="block text-gray-100 font-semibold mb-2">
            Subject
          </label>
          {message.senderName === adminName ? (
            <input
              type="text"
              value={message.subject}
              onChange={(e) =>
                setMessage({ ...message, subject: e.target.value })
              }
              className="w-full px-4 py-3 bg-zinc-900/50 text-white rounded-xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-lime-500 font-light"
            />
          ) : (
            <p className="w-full px-4 py-3 bg-zinc-900/50 text-white rounded-xl font-light">
              {message.subject}
            </p>
          )}
        </motion.div>
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}>
          <label className="block text-gray-100 font-semibold mb-2">
            Message
          </label>
          {message.senderName === adminName ? (
            <textarea
              value={message.content}
              onChange={(e) =>
                setMessage({ ...message, content: e.target.value })
              }
              className="w-full h-40 px-4 py-3 bg-zinc-900/50 text-white rounded-xl resize-none border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-lime-500 font-light"
            />
          ) : (
            <p className="w-full h-40 px-4 py-3 bg-zinc-900/50 text-white rounded-xl font-light whitespace-pre-wrap">
              {message.content}
            </p>
          )}
        </motion.div>
        <motion.div
          className="flex justify-end gap-3 mt-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}>
          <motion.button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800/10 text-gray-400 border border-zinc-800/20 hover:bg-zinc-800 transition-colors duration-200 font-light"
            variants={{
              hidden: { opacity: 0, scale: 0.95 },
              visible: { opacity: 1, scale: 1 },
            }}
            transition={{ delay: 0.6, duration: 0.4 }}>
            Close
          </motion.button>
          {message.senderName === adminName && (
            <>
              <motion.button
                type="button"
                className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors duration-200 flex items-center gap-2 font-light"
                onClick={() => deleteMutation.mutate(message.id)}
                disabled={deleteMutation.isPending}
                variants={{
                  hidden: { opacity: 0, scale: 0.95 },
                  visible: { opacity: 1, scale: 1 },
                }}
                transition={{ delay: 0.7, duration: 0.4 }}>
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
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-lime-500 hover:from-green-600 hover:to-lime-600 text-gray-900 flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed font-light"
                onClick={() => updateMutation.mutate(message)}
                disabled={updateMutation.isPending}
                variants={{
                  hidden: { opacity: 0, scale: 0.95 },
                  visible: { opacity: 1, scale: 1 },
                }}
                transition={{ delay: 0.8, duration: 0.4 }}>
                {updateMutation.isPending ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-gray-900"
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
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default MessageModal;
