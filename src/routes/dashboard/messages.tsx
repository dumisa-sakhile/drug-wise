import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { auth, db } from "@/config/firebase";
import {
  collection,
  query,
  getDocs,
  Timestamp,
  addDoc,
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

interface UserData {
  uid: string;
  name: string;
  surname: string;
  email: string;
  isAdmin?: boolean;
}

export const Route = createFileRoute("/dashboard/messages")({
  component: MessagesComponent,
});

function MessagesComponent() {
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setCurrentUserData(userDoc.data() as UserData);
          }
        } catch (error) {
          toast.error("Failed to load user data");
        }
      } else {
        setUserId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch received messages
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

  // Mark message as read
  const markAsRead = async (messageId: string) => {
    if (!messageId || isMarkingRead) return;
    setIsMarkingRead(true);
    try {
      await updateDoc(doc(db, "messages", messageId), { isRead: true });
      refetch();
    } catch (error) {
      toast.error("Failed to mark as read");
    } finally {
      setIsMarkingRead(false);
    }
  };

  if (!userId) {
    return (
      <div className="p-4 text-white text-center roboto-condensed-light">
        Please sign in to view messages
      </div>
    );
  }

  return (
    <div className="p-4 text-white max-w-4xl mx-auto w-full min-h-screen">
      <title>DrugWise - Messages</title>
      <h1 className="text-2xl roboto-condensed-bold mb-6 text-center sm:text-left">
        Your Messages
      </h1>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📭</div>
          <h2 className="text-xl roboto-condensed-bold mb-2">No Messages</h2>
          <p className="text-gray-400 roboto-condensed-light">
            When you receive messages, they'll appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Table for larger screens */}
          <div className="hidden sm:block overflow-x-auto rounded-lg border border-[#242424] bg-[#131313]">
            <table className="min-w-full">
              <thead>
                <tr className="text-left border-b border-[#242424]">
                  <th className="p-4 roboto-condensed-bold">From</th>
                  <th className="p-4 roboto-condensed-bold">Subject</th>
                  <th className="p-4 roboto-condensed-bold">Date</th>
                  <th className="p-4 roboto-condensed-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.tr
                      key={message.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`border-b border-[#242424] hover:bg-[#242424] cursor-pointer ${
                        !message.isRead ? "bg-[#242424]" : ""
                      }`}
                      onClick={() => {
                        setSelectedMessage(message);
                        if (!message.isRead) markAsRead(message.id);
                      }}>
                      <td className="p-4 roboto-condensed-light">
                        {message.senderName}
                      </td>
                      <td className="p-4 roboto-condensed-medium">
                        {message.subject}
                      </td>
                      <td className="p-4 roboto-condensed-light">
                        {message.sentAt?.toDate().toLocaleString()}
                      </td>
                      <td className="p-4">
                        {message.isRead ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-green-900 text-green-300 roboto-condensed-medium">
                            Read
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs bg-yellow-900 text-yellow-300 roboto-condensed-medium">
                            Unread
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Card list for smaller screens */}
          <div className="sm:hidden space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className={`bg-[#131313] p-4 rounded-lg border border-[#242424] cursor-pointer ${
                    !message.isRead ? "bg-[#242424]" : ""
                  }`}
                  onClick={() => {
                    setSelectedMessage(message);
                    if (!message.isRead) markAsRead(message.id);
                  }}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg roboto-condensed-medium pr-4">
                      {message.subject}
                    </h3>
                    {message.isRead ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-green-900 text-green-300 roboto-condensed-medium">
                        Read
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-yellow-900 text-yellow-300 roboto-condensed-medium">
                        Unread
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 roboto-condensed-light text-sm mb-2">
                    <span className="roboto-condensed-medium">From:</span>{" "}
                    {message.senderName}
                  </p>
                  <p className="text-gray-500 roboto-condensed-light text-xs">
                    <span className="roboto-condensed-medium">Date:</span>{" "}
                    {message.sentAt?.toDate().toLocaleDateString()}
                  </p>
                  <p className="text-blue-400 text-sm mt-2 text-right roboto-condensed-bold">
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
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="bg-[#131313] rounded-lg shadow-xl p-6 max-w-full sm:max-w-lg w-full border border-[#242424] relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl p-1 px-4 rounded-full bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors duration-200"
              onClick={() => setSelectedMessage(null)}
              aria-label="Close message">
              &times;
            </button>
            <h2 className="text-xl roboto-condensed-bold mb-2 text-center sm:text-left">
              {selectedMessage.subject}
            </h2>
            <div className="mb-4 whitespace-pre-wrap roboto-condensed-light">
              {selectedMessage.content}
            </div>
            <div className="text-sm text-gray-400 space-y-1 roboto-condensed-light">
              <p>
                <strong className="roboto-condensed-medium">From:</strong>{" "}
                {selectedMessage.senderName}
              </p>
              <p>
                <strong className="roboto-condensed-medium">Date:</strong>{" "}
                {selectedMessage.sentAt?.toDate().toLocaleString()}
              </p>
              <p>
                <strong className="roboto-condensed-medium">Status:</strong>{" "}
                {selectedMessage.isRead ? "Read" : "Unread"}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Compose Message (for admins only) */}
      {currentUserData?.isAdmin && (
        <ComposeMessage onSent={refetch} currentUserData={currentUserData} />
      )}
    </div>
  );
}

interface ComposeMessageProps {
  onSent: () => void;
  currentUserData: UserData;
}

function ComposeMessage({ onSent, currentUserData }: ComposeMessageProps) {
  const [recipientId, setRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const q = query(collection(db, "users"));
        const snapshot = await getDocs(q);
        setUsers(snapshot.docs.map((doc) => doc.data() as UserData));
      } catch (error) {
        toast.error("Failed to load recipients");
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientId || !subject.trim() || !content.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    setIsSending(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Not authenticated");

      await addDoc(collection(db, "messages"), {
        senderId: currentUser.uid,
        senderName: `${currentUserData.name} ${currentUserData.surname}`,
        recipientId,
        subject: subject.trim(),
        content: content.trim(),
        sentAt: Timestamp.now(),
        isRead: false,
      });

      toast.success("Message sent");
      setSubject("");
      setContent("");
      setRecipientId("");
      onSent();
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="roboto-condensed-light mt-8 p-4 border border-[#242424] rounded-lg bg-[#131313]">
      <h2 className="text-xl roboto-condensed-bold mb-4">Compose Message</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="recipient"
            className="block mb-1 roboto-condensed-light">
            Recipient
          </label>
          <select
            id="recipient"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            className="w-full p-2 bg-[#242424] border border-[#242424] rounded focus:outline-none focus:ring-2 focus:ring-blue-500 roboto-condensed-light"
            disabled={isLoadingUsers || isSending}
            required>
            <option value="">
              {isLoadingUsers ? "Loading recipients..." : "Select recipient"}
            </option>
            {users.map((user) => (
              <option key={user.uid} value={user.uid}>
                {user.name} {user.surname} ({user.email})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="subject"
            className="block mb-1 roboto-condensed-light">
            Subject
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            placeholder="Subject of the message"
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-2 bg-[#242424] border border-[#242424] rounded focus:outline-none focus:ring-2 focus:ring-blue-500 roboto-condensed-light capitalize"
            required
            disabled={isSending}
          />
        </div>
        <div>
          <label
            htmlFor="messageContent"
            className="block mb-1 roboto-condensed-light">
            Message
          </label>
          <textarea
            id="messageContent"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 bg-[#242424] border border-[#242424] rounded min-h-[150px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 roboto-condensed-light"
            placeholder="Type your message here..."
            required
            disabled={isSending}
          />
        </div>
        <div className="flex justify-center items-center">
          <button
            type="submit"
            className="w-full max-w-[200px] px-4 py-2 bg-lime-600 hover:bg-lime-700 rounded roboto-condensed-medium text-lg transition-colors duration-200"
            disabled={isSending}>
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default MessagesComponent;
