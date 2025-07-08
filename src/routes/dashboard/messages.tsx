import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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

  if (!userId) {
    return (
      <div className="p-6 text-white text-center font-light min-h-screen flex items-center justify-center">
        Please sign in to view messages
      </div>
    );
  }

  function StatusBadge({ isRead }: { isRead: boolean }) {
    const base =
      "px-2 py-1 rounded-full text-xs font-semibold font-regular";
    return isRead ? (
      <span className={`${base} bg-lime-700 text-green-300`}>Read</span>
    ) : (
      <span className={`${base} bg-yellow-700 text-yellow-300`}>Unread</span>
    );
  }

  return (
    <div className="font-light max-w-5xl mx-auto md:px-4 py-8 min-h-screen text-white  rounded-xl">
      <title>DrugWise - Messages</title>
      <h1 className="text-3xl font-bold mb-8 text-center sm:text-left">
        Your Messages
      </h1>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-600" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12 flex flex-col items-center justify-center text-neutral-500">
          <div className="text-6xl mb-4 select-none">📭</div>
          <h2 className="text-xl font-bold mb-2">No Messages</h2>
          <p className="font-light max-w-md">
            When you receive messages, they will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-neutral-700 bg-neutral-800 shadow-inner">
            <table className="min-w-full text-left text-neutral-300 text-sm">
              <thead className="bg-neutral-700/50">
                <tr>
                  <th className="px-6 py-4 font-semibold 
                  ">
                    From
                  </th>
                  <th className="px-6 py-4 font-semibold 
                  ">
                    Subject
                  </th>
                  <th className="px-6 py-4 font-semibold 
                  ">
                    Date
                  </th>
                  <th className="px-6 py-4 font-semibold ">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.tr
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className={`border-b border-neutral-700 hover:bg-neutral-700 cursor-pointer ${
                        !message.isRead ? "bg-neutral-700" : ""
                      }`}
                      onClick={() => {
                        setSelectedMessage(message);
                        if (!message.isRead) markAsRead(message.id);
                      }}>
                      <td className="px-6 py-4 font-light">
                        {message.senderName}
                      </td>
                      <td className="px-6 py-4 font-medium truncate max-w-xl">
                        {message.subject}
                      </td>
                      <td className="px-6 py-4 font-light whitespace-nowrap">
                        {message.sentAt?.toDate().toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge isRead={message.isRead} />
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-6">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className={`bg-neutral-800 p-5 rounded-xl border border-neutral-700 cursor-pointer shadow-md hover:scale-[1.03] transition-transform duration-200 ${
                    !message.isRead ? "bg-neutral-700" : ""
                  }`}
                  onClick={() => {
                    setSelectedMessage(message);
                    if (!message.isRead) markAsRead(message.id);
                  }}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium truncate max-w-[75%]">
                      {message.subject}
                    </h3>
                    <StatusBadge isRead={message.isRead} />
                  </div>
                  <p className="text-neutral-400 font-light text-sm mb-2 truncate">
                    <span className="font-medium">From:</span>{" "}
                    {message.senderName}
                  </p>
                  <p className="text-neutral-500 font-light text-xs">
                    <span className="font-medium">Date:</span>{" "}
                    {message.sentAt?.toDate().toLocaleDateString()}
                  </p>
                  <p className="text-blue-400 text-sm mt-2 text-right font-bold underline">
                    View Message
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
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
            className="bg-neutral-800 rounded-xl shadow-lg p-6 max-w-full sm:max-w-lg w-full border border-neutral-700 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-4 right-4 text-neutral-400 hover:text-white text-3xl font-light p-1 px-4 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors duration-200"
              onClick={() => setSelectedMessage(null)}
              aria-label="Close message">
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4 text-center sm:text-left text-blue-300">
              {selectedMessage.subject}
            </h2>
            <div className="mb-6 whitespace-pre-wrap font-light text-neutral-200">
              {selectedMessage.content}
            </div>
            <div className="text-sm text-neutral-400 space-y-1 font-light">
              <p>
                <strong className="font-medium">From:</strong>{" "}
                {selectedMessage.senderName}
              </p>
              <p>
                <strong className="font-medium">Date:</strong>{" "}
                {selectedMessage.sentAt?.toDate().toLocaleString()}
              </p>
              <p>
                <strong className="font-medium">Status:</strong>{" "}
                {selectedMessage.isRead ? "Read" : "Unread"}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default MessagesComponent;