import { motion, AnimatePresence } from "framer-motion";
import type { AppUser, Message } from "./types";
import PaginationControls from "./PaginationControls";

interface MessagesTableProps {
  messages: Message[];
  users: AppUser[];
  adminName: string;
  isLoading: boolean;
  error: Error | null;
  onViewMessage: (message: Message) => void;
  rowsPerPage: number;
  setRowsPerPage: (rows: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
}

function MessagesTable({
  messages,
  users,
  adminName,
  isLoading,
  error,
  onViewMessage,
  rowsPerPage,
  setRowsPerPage,
  currentPage,
  setCurrentPage,
  totalPages,
}: MessagesTableProps) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900 shadow-inner">
        <table className="min-w-full text-left text-gray-300 text-sm divide-y divide-zinc-800">
          <thead className="bg-zinc-900/50">
            <tr>
              <th className="px-6 py-4 font-semibold">To</th>
              <th className="px-6 py-4 font-semibold">Subject</th>
              <th className="px-6 py-4 font-semibold">Sent At</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Type</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {isLoading ? (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-400 font-light">
                    Loading messages...
                  </td>
                </motion.tr>
              ) : error ? (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-red-300 font-light">
                    Error: {error.message || "Failed to load messages"}
                  </td>
                </motion.tr>
              ) : messages.length > 0 ? (
                messages.map((msg, index) => {
                  const recipient = users.find(
                    (u) => u.uid === msg.recipientId
                  );
                  const isAdminMessage = msg.senderName === adminName;
                  return (
                    <motion.tr
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25, delay: index * 0.05 }}
                      className="border-b border-zinc-800 hover:bg-zinc-800 cursor-pointer transition-colors duration-200"
                      onClick={() => onViewMessage(msg)}>
                      <td className="px-6 py-4 font-semibold">
                        {recipient
                          ? `${recipient.name} ${recipient.surname}`
                          : msg.recipientId}
                      </td>
                      <td className="px-6 py-4 font-semibold">{msg.subject}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-light">
                        {msg.sentAt?.toDate()?.toLocaleString() || "-"}
                      </td>
                      <td className="px-6 py-4 font-light">
                        {msg.isRead ? (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                            Read
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400">
                            Unread
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-light">
                        {isAdminMessage ? "Admin" : "System"}
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-400 font-light">
                    No sent messages found
                  </td>
                </motion.tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      <PaginationControls
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />
    </div>
  );
}

export default MessagesTable;
