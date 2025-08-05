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
      <div className="overflow-x-auto rounded-xl border border-neutral-700 bg-neutral-800 shadow-inner">
        <table className="min-w-full text-left text-neutral-300 text-sm">
          <thead className="bg-neutral-700/50">
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
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-neutral-500 font-light">
                    Loading messages...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-red-400 font-light">
                    Error: {error.message || "Failed to load messages"}
                  </td>
                </tr>
              ) : messages.length > 0 ? (
                messages.map((msg) => {
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
                      transition={{ duration: 0.25 }}
                      className="border-b border-neutral-700 hover:bg-neutral-700 cursor-pointer transition-colors duration-200"
                      onClick={() => onViewMessage(msg)}>
                      <td className="px-6 py-4 font-semibold">
                        {recipient
                          ? `${recipient.name} ${recipient.surname}`
                          : msg.recipientId}
                      </td>
                      <td className="px-6 py-4 font-semibold">{msg.subject}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {msg.sentAt?.toDate()?.toLocaleString() || "-"}
                      </td>
                      <td className="px-6 py-4">
                        {msg.isRead ? (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-900/30 text-green-400">
                            Read
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-900/30 text-yellow-400">
                            Unread
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isAdminMessage ? "Admin" : "System"}
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-neutral-500 font-light">
                    No sent messages found
                  </td>
                </tr>
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
