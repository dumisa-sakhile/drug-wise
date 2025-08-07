import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { auth, db } from "@/config/firebase";
import {
  collection,
  query,
  getDocs,
  Timestamp,
  updateDoc,
  doc,
  // getDoc,
  where,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

// --- Type Definitions (No changes) ---
interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  subject: string;
  content: string;
  sentAt: Timestamp;
  isRead: boolean;
}

// --- Route Definition (No changes) ---
export const Route = createFileRoute("/dashboard/messages")({
  component: MessagesComponent,
});

// --- Main Messages Component ---
function MessagesComponent() {
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "read" | "unread">(
    "all"
  );
  const [rowsPerPage, setRowsPerPage] = useState<number>(15);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Auth state listener to get the current user's ID
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch messages for the current user using React Query
  const {
    data: messages = [],
    isLoading,
    refetch,
  } = useQuery<Message[]>({
    queryKey: ["messages", userId],
    queryFn: async () => {
      if (!userId) return [];
      const q = query(
        collection(db, "messages"),
        where("recipientId", "==", userId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Message, "id">),
      }));
    },
    enabled: !!userId,
  });

  // Memoized filter and search logic
  const filteredMessages = useMemo(() => {
    let result = messages;
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      result = result.filter(
        (m) =>
          (m.senderName?.toLowerCase() || "").includes(searchLower) ||
          (m.subject?.toLowerCase() || "").includes(searchLower) ||
          (m.content?.toLowerCase() || "").includes(searchLower)
      );
    }
    if (filterStatus !== "all" && !searchTerm.trim()) {
      result = result.filter((m) =>
        filterStatus === "read" ? m.isRead : !m.isRead
      );
    }
    return result;
  }, [messages, searchTerm, filterStatus]);

  // Memoized pagination logic
  const paginatedMessages = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredMessages.slice(start, start + rowsPerPage);
  }, [filteredMessages, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredMessages.length / rowsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, rowsPerPage]);

  const markAsRead = async (messageId: string) => {
    if (!messageId || isMarkingRead) return;
    setIsMarkingRead(true);
    try {
      await updateDoc(doc(db, "messages", messageId), { isRead: true });
      refetch();
    } catch {
      toast.error("Failed to mark as read");
    } finally {
      setIsMarkingRead(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setFilterStatus("all"); // Clear status filter on search
  };

  if (!userId) {
    return (
      <div className="p-6 text-gray-300 font-light min-h-screen flex items-center justify-center bg-zinc-950">
        Please sign in to view messages
      </div>
    );
  }

  // Helper component for status badges
  function StatusBadge({ isRead }: { isRead: boolean }) {
    const base = "px-2 py-1 rounded-full text-xs font-semibold";
    return isRead ? (
      <span className={`${base} bg-green-900 text-green-300`}>Read</span>
    ) : (
      <span className={`${base} bg-yellow-900 text-yellow-300`}>Unread</span>
    );
  }

  return (
    <div className="font-light max-w-5xl mx-auto md:px-4 py-8 min-h-screen text-gray-100 bg-zinc-950">
      <title>DrugWise - Messages</title>
      <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center sm:text-left bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
        Your Messages
      </h1>

      {isLoading ? (
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
                  setFilterStatus(e.target.value as "all" | "read" | "unread")
                }
                className="w-full px-3 py-2.5 bg-zinc-900 text-base text-gray-100 rounded-lg shadow-sm border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-lime-500 font-light">
                <option value="all">All Status</option>
                <option value="read">Read</option>
                <option value="unread">Unread</option>
              </select>
              <span className="text-gray-400 font-light text-sm">
                Showing {filteredMessages.length} messages
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
                  placeholder="Search by sender, subject, or content..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 text-base text-gray-100 rounded-full shadow-inner border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-lime-500 font-light"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as "all" | "read" | "unread")
                }
                className="w-full sm:w-1/4 px-4 py-2.5 bg-zinc-950 text-base text-gray-100 rounded-full shadow-inner border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-lime-500 font-light">
                <option value="all">All</option>
                <option value="read">Read</option>
                <option value="unread">Unread</option>
              </select>
              <span className="text-gray-400 font-light text-sm">
                {filteredMessages.length} total
              </span>
            </div>

            <table className="min-w-full text-left text-gray-300 text-sm">
              <thead className="bg-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">From</th>
                  <th className="px-6 py-4 font-semibold">Subject</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredMessages.length === 0 ? (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="border-b border-zinc-800">
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-gray-500 font-light">
                        No messages found.
                      </td>
                    </motion.tr>
                  ) : (
                    paginatedMessages.map((message) => (
                      <motion.tr
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className={`border-b border-zinc-800 cursor-pointer transition-colors duration-200 ${
                          !message.isRead
                            ? "bg-zinc-800 text-gray-50"
                            : "hover:bg-zinc-800"
                        }`}
                        onClick={() => {
                          setSelectedMessage(message);
                          if (!message.isRead) markAsRead(message.id);
                        }}>
                        <td className="px-6 py-4 font-light">
                          {message.senderName || "Unknown Sender"}
                        </td>
                        <td className="px-6 py-4 font-medium truncate max-w-sm">
                          {message.subject || "No Subject"}
                        </td>
                        <td className="px-6 py-4 font-light whitespace-nowrap">
                          {message.sentAt?.toDate().toLocaleDateString() || "-"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge isRead={message.isRead} />
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
            {filteredMessages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center py-12 flex flex-col items-center justify-center text-gray-500">
                <div className="text-6xl mb-4 select-none">📭</div>
                <h2 className="text-xl font-bold mb-2 text-gray-200">
                  No Messages Found
                </h2>
                <p className="font-light max-w-md text-gray-400">
                  No messages found matching your criteria.
                </p>
              </motion.div>
            ) : (
              <AnimatePresence>
                {paginatedMessages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`bg-zinc-900 p-5 rounded-xl border border-zinc-800 cursor-pointer shadow-md transition-colors duration-200 ${
                      !message.isRead
                        ? "bg-zinc-800 text-gray-50"
                        : "hover:bg-zinc-800"
                    }`}
                    onClick={() => {
                      setSelectedMessage(message);
                      if (!message.isRead) markAsRead(message.id);
                    }}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium truncate max-w-[75%]">
                        {message.subject || "No Subject"}
                      </h3>
                      <StatusBadge isRead={message.isRead} />
                    </div>
                    <p className="text-gray-400 font-light text-sm mb-2 truncate">
                      <span className="font-medium">From:</span>{" "}
                      {message.senderName || "Unknown Sender"}
                    </p>
                    <p className="text-gray-500 font-light text-xs">
                      <span className="font-medium">Date:</span>{" "}
                      {message.sentAt?.toDate().toLocaleDateString() || "-"}
                    </p>
                    <p className="text-lime-400 text-sm mt-2 text-right font-bold">
                      View Message
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Pagination */}
          {!(isLoading || filteredMessages.length === 0) && (
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

      {/* Message Detail Modal */}
      {selectedMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6 font-light"
          onClick={() => setSelectedMessage(null)}>
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="bg-zinc-900 rounded-xl shadow-2xl p-6 max-w-full sm:max-w-lg w-full border border-zinc-800 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full transition-colors duration-200"
              onClick={() => setSelectedMessage(null)}
              aria-label="Close message">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-x">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
              {selectedMessage.subject || "No Subject"}
            </h2>
            <div className="mb-6 whitespace-pre-wrap font-light text-gray-200 leading-relaxed">
              {selectedMessage.content || "No Content"}
            </div>
            <div className="text-sm text-gray-400 space-y-1 font-light">
              <p>
                <strong className="font-medium">From:</strong>{" "}
                {selectedMessage.senderName || "Unknown Sender"}
              </p>
              <p>
                <strong className="font-medium">Date:</strong>{" "}
                {selectedMessage.sentAt?.toDate().toLocaleString() || "-"}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default MessagesComponent;
