import { Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AppUser } from "./types";

interface MessageFormProps {
  selectedUser: AppUser | null;
  setSelectedUser: (user: AppUser | null) => void;
  subject: string;
  setSubject: (subject: string) => void;
  content: string;
  setContent: (content: string) => void;
  users: AppUser[];
  validationErrors: { subject?: string; content?: string; user?: string };
  sendMutation: { mutate: () => void; isPending: boolean };
}

function MessageForm({
  selectedUser,
  setSelectedUser,
  subject,
  setSubject,
  content,
  setContent,
  users,
  validationErrors,
  sendMutation,
}: MessageFormProps) {
  const filteredUsers = users.filter((user) =>
    `${user.name} ${user.surname} ${user.email}`.toLowerCase().includes("")
  );

  return (
    <motion.div
      className="flex-1 bg-zinc-900 rounded-xl p-6 border border-zinc-800 shadow-inner flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="space-y-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1 } },
        }}
      >
        <motion.div
          className="mb-4"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.4 }}
        >
          <label className="block text-gray-100 font-semibold mb-2">
            To <span className="text-red-300">*</span>
          </label>
          <select
            value={selectedUser?.uid || ""}
            onChange={(e) => {
              const user = users.find((u) => u.uid === e.target.value);
              setSelectedUser(user || null);
            }}
            className={`w-full px-4 py-3 bg-zinc-900 text-white rounded-xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-lime-500 font-light ${
              validationErrors.user ? "border-red-300" : ""
            }`}
          >
            <option value="" disabled>
              Select a user
            </option>
            {filteredUsers.map((u) => (
              <option key={u.uid} value={u.uid}>
                {u.name} {u.surname} ({u.email})
              </option>
            ))}
          </select>
          <AnimatePresence>
            {validationErrors.user && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-red-300 text-sm mt-1 font-light"
                id="user-error"
              >
                {validationErrors.user}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
        <motion.div
          className="mb-4"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.4 }}
        >
          <label className="block text-gray-100 font-semibold mb-2">
            Subject <span className="text-red-300">*</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={`w-full px-4 py-3 bg-zinc-900/50 text-white rounded-xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-lime-500 font-light ${
              validationErrors.subject ? "border-red-300" : ""
            }`}
            placeholder="Enter subject"
          />
          <AnimatePresence>
            {validationErrors.subject && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-red-300 text-sm mt-1 font-light"
                id="subject-error"
              >
                {validationErrors.subject}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
        <motion.div
          className="mb-4 flex-1 flex flex-col"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.4 }}
        >
          <label className="block text-gray-100 font-semibold mb-2">
            Message <span className="text-red-300">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`w-full h-40 px-4 py-3 bg-zinc-900/50 text-white rounded-xl resize-none border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-lime-500 font-light ${
              validationErrors.content ? "border-red-300" : ""
            }`}
            placeholder="Type your message..."
          />
          <AnimatePresence>
            {validationErrors.content && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-red-300 text-sm mt-1 font-light"
                id="content-error"
              >
                {validationErrors.content}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
        <motion.button
          className="mt-2 bg-gradient-to-r from-green-500 to-lime-500 hover:from-green-600 hover:to-lime-600 text-gray-900 px-4 py-2 rounded-xl font-light flex items-center gap-2 self-end transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={() => sendMutation.mutate()}
          disabled={sendMutation.isPending}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.4 }}
        >
          <Send size={16} />
          {sendMutation.isPending ? "Sending..." : "Send Message"}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export default MessageForm;
