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
    <div className="flex-1 bg-neutral-800 rounded-xl p-6 border border-neutral-700 shadow-inner flex flex-col">
      <div className="mb-4">
        <label className="block text-neutral-200 font-semibold mb-2">
          To <span className="text-red-400">*</span>
        </label>
        <select
          value={selectedUser?.uid || ""}
          onChange={(e) => {
            const user = users.find((u) => u.uid === e.target.value);
            setSelectedUser(user || null);
          }}
          className={`w-full px-4 py-3 bg-neutral-900 text-white rounded-xl border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-light ${
            validationErrors.user ? "border-red-400" : ""
          }`}>
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
              className="text-red-400 text-sm mt-1"
              id="user-error">
              {validationErrors.user}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <div className="mb-4">
        <label className="block text-neutral-200 font-semibold mb-2">
          Subject <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={`w-full px-4 py-3 bg-neutral-800/50 text-white rounded-xl border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-light ${
            validationErrors.subject ? "border-red-400" : ""
          }`}
          placeholder="Enter subject"
        />
        <AnimatePresence>
          {validationErrors.subject && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-red-400 text-sm mt-1"
              id="subject-error">
              {validationErrors.subject}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <div className="mb-4 flex-1 flex flex-col">
        <label className="block text-neutral-200 font-semibold mb-2">
          Message <span className="text-red-400">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={`w-full h-40 px-4 py-3 bg-neutral-800/50 text-white rounded-xl resize-none border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-light ${
            validationErrors.content ? "border-red-400" : ""
          }`}
          placeholder="Type your message..."
        />
        <AnimatePresence>
          {validationErrors.content && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-red-400 text-sm mt-1"
              id="content-error">
              {validationErrors.content}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <button
        className="mt-2 bg-gradient-to-r from-green-500 to-lime-500 hover:from-green-600 hover:to-lime-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 self-end transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
        onClick={() => sendMutation.mutate()}
        disabled={sendMutation.isPending}>
        <Send size={16} />
        {sendMutation.isPending ? "Sending..." : "Send Message"}
      </button>
    </div>
  );
}

export default MessageForm;
