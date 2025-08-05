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
  getDoc,
  where,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

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

export const Route = createFileRoute("/dashboard/messages")({
  component: MessagesComponent,
});

function MessagesComponent() {
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "read" | "unread">("all");
  const [rowsPerPage, setRowsPerPage] = useState<number>(15);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            // If you need to use user data in the future, you can uncomment the line below
            // const currentUserData = userDoc.data() as UserData;
          }
        } catch {
          toast.error("Failed to load user data");
        }
      } else {
        setUserId(null);
      }
    });
    return () => unsubscribe();
  }, []);

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

  const filteredMessages = useMemo(() => {
    let result = messages;
    // Log messages with missing fields for debugging
    messages.forEach((m) => {
      if (!m.senderName || !m.subject || !m.content) {
        console.warn(`Message ${m.id} has missing fields:`, {
          senderName: m.senderName,
          subject: m.subject,
          content: m.content,
        });
      }
    });
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
      <div className="p-6 text-white text-center font-light min-h-screen flex items-center justify-center">
        Please sign in to view messages
      </div>
    );
  }

  function StatusBadge({ isRead }: { isRead: boolean }) {
    const base = "px-2 py-1 rounded-full text-xs font-semibold font-regular";
    return isRead ? (
      <span className={`${base} bg-lime-700 text-green-300`}>Read</span>
    ) : (
      <span className={`${base} bg-yellow-700 text-yellow-300`}>Unread</span>
    );
  }

  return (
    <div className="font-light max-w-5xl mx-auto md:px-4 py-8 min-h-screen text-white rounded-xl">
      <title>DrugWise - Messages</title>
      <h1 className="text-3xl font-bold mb-8 text-center sm:text-left bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
        Your Messages
      </h1>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-600" />
        </div>
      ) : (
        <>
          {/* Mobile Filters */}
          <div className="sm:hidden  mb-6">
            <div className="flex flex-col gap-4 items-center">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search by sender, subject, or content..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 text-base text-white rounded-lg shadow-sm border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-light"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as "all" | "read" | "unread")}
                className="w-full px-3 py-2.5 bg-neutral-900 text-base text-white rounded-lg shadow-sm border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-light"
              >
                <option value="all">All Status</option>
                <option value="read">Read</option>
                <option value="unread">Unread</option>
              </select>
              <span className="text-neutral-300 font-semibold">
                {filteredMessages.length} total
              </span>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-neutral-700 bg-neutral-800 shadow-inner">
            <table className="min-w-full text-left text-neutral-300 text-sm divide-y divide-neutral-700">
              <thead className="bg-neutral-700/50">
                <tr>
                  <th colSpan={4} className="px-6 py-4 font-semibold">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                      <div className="relative w-full sm:w-3/4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                        <input
                          type="text"
                          placeholder="Search by sender, subject, or content..."
                          value={searchTerm}
                          onChange={handleSearchChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 text-base text-white rounded-lg shadow-sm border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-light"
                        />
                      </div>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as "all" | "read" | "unread")}
                        className="w-full sm:w-1/4 px-3 py-2.5 bg-neutral-900 text-base text-white rounded-lg shadow-sm border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-light"
                      >
                        <option value="all">All Status</option>
                        <option value="read">Read</option>
                        <option value="unread">Unread</option>
                      </select>
                      <span className="text-neutral-300 font-semibold">
                        {filteredMessages.length} total
                      </span>
                    </div>
                  </th>
                </tr>
                <tr>
                  <th className="px-6 py-4 font-semibold">From</th>
                  <th className="px-6 py-4 font-semibold">Subject</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredMessages.length === 0 ? (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="border-b border-neutral-700"
                    >
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-neutral-500 font-light"
                      >
                        No messages found matching the search criteria.
                      </td>
                    </motion.tr>
                  ) : (
                    paginatedMessages.map((message, index) => (
                      <motion.tr
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={`border-b border-neutral-700 hover:bg-neutral-700 cursor-pointer ${
                          !message.isRead ? "bg-neutral-700" : ""
                        }`}
                        onClick={() => {
                          setSelectedMessage(message);
                          if (!message.isRead) markAsRead(message.id);
                        }}
                      >
                        <td className="px-6 py-4 font-light">
                          {message.senderName || "Unknown Sender"}
                        </td>
                        <td className="px-6 py-4 font-medium truncate max-w-xl">
                          {message.subject || "No Subject"}
                        </td>
                        <td className="px-6 py-4 font-light whitespace-nowrap">
                          {message.sentAt?.toDate().toLocaleString() || "-"}
                        </td>
                        <td className="px-6 py-4">
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
          <div className="sm:hidden space-y-6">
            {filteredMessages.length === 0 ? (
              <div
                style={{ transform: "translateZ(0)" }}
                className="text-center py-12 flex flex-col items-center justify-center text-neutral-500 will-change-transform"
              >
                <div className="text-6xl mb-4 select-none">📭</div>
                <h2 className="text-xl font-bold mb-2">No Messages Found</h2>
                <p className="font-light max-w-md">
                  No messages found matching the search criteria.
                </p>
              </div>
            ) : (
              paginatedMessages.map((message) => (
                <div
                  key={message.id}
                  style={{ transform: "translateZ(0)" }}
                  className={`bg-neutral-800 p-5 rounded-xl border border-neutral-700 cursor-pointer shadow-md hover:bg-neutral-700 transition-colors duration-200 will-change-transform ${
                    !message.isRead ? "bg-neutral-700" : ""
                  }`}
                  onClick={() => {
                    setSelectedMessage(message);
                    if (!message.isRead) markAsRead(message.id);
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium truncate max-w-[75%]">
                      {message.subject || "No Subject"}
                    </h3>
                    <StatusBadge isRead={message.isRead} />
                  </div>
                  <p className="text-neutral-400 font-light text-sm mb-2 truncate">
                    <span className="font-medium">From:</span>{" "}
                    {message.senderName || "Unknown Sender"}
                  </p>
                  <p className="text-neutral-500 font-light text-xs">
                    <span className="font-medium">Date:</span>{" "}
                    {message.sentAt?.toDate().toLocaleDateString() || "-"}
                  </p>
                  <p className="text-blue-400 text-sm mt-2 text-right font-bold">
                    View Message
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {!(isLoading || filteredMessages.length === 0) && (
            <div className="flex items-center justify-between mt-4 text-[#999] font-light">
              <div className="text-sm">
                Rows per page
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="ml-2 px-2 py-1 bg-[#1A1A1A] text-white rounded focus:outline-none"
                >
                  {[5, 10, 15, 25, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-2 py-1 rounded hover:bg-[#1A1A1A] disabled:opacity-50"
                >
                  <ChevronLeft size="16" />
                </button>
                <span className="text-sm">
                  {currentPage} / {totalPages || 1}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-2 py-1 rounded hover:bg-[#1A1A1A] disabled:opacity-50"
                >
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
          onClick={() => setSelectedMessage(null)}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="bg-neutral-800 rounded-xl shadow-lg p-6 max-w-full sm:max-w-lg w-full border border-neutral-700 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-neutral-400 hover:text-white text-3xl font-light p-1 px-4 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors duration-200"
              onClick={() => setSelectedMessage(null)}
              aria-label="Close message"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4 text-center sm:text-left bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
              {selectedMessage.subject || "No Subject"}
            </h2>
            <div className="mb-6 whitespace-pre-wrap font-light text-neutral-200">
              {selectedMessage.content || "No Content"}
            </div>
            <div className="text-sm text-neutral-400 space-y-1 font-light">
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