import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { db, auth } from "@/config/firebase";
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { Send, Search, Check, X, Trash2, Eye } from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";

export const Route = createFileRoute("/dashboard/admin/messages")({
  component: AdminMessages,
});

interface AppUser {
  id: string;
  uid: string;
  name: string;
  surname: string;
  email: string;
  isAdmin: boolean;
  joinedAt: Timestamp;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  subject: string;
  content: string;
  sentAt: Timestamp;
  isRead: boolean;
  isWelcomeMessage: boolean;
}

function AdminMessages() {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [view, setView] = useState<"compose" | "sent">("compose");
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "admin" | "system">("all");
  const [validationErrors, setValidationErrors] = useState<{
    subject?: string;
    content?: string;
    user?: string;
  }>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const { data: currentUserData, isLoading: loadingCurrentUserData } =
    useQuery<AppUser | null>({
      queryKey: ["currentUserData", currentUser?.uid],
      queryFn: async () => {
        if (!currentUser?.uid) return null;
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        const data = docSnap.data();
        return {
          id: docSnap.id,
          uid: data.uid,
          name: data.name,
          surname: data.surname,
          email: data.email,
          isAdmin: data.isAdmin ?? false,
          joinedAt: data.joinedAt,
        } as AppUser;
      },
      enabled: !!currentUser?.uid,
    });

  const adminName = currentUserData
    ? `${currentUserData.name} ${currentUserData.surname}`
    : "";

  const {
    data: allMessages = [],
    isLoading: loadingMessages,
    error: messagesError,
  } = useQuery<Message[]>({
    queryKey: ["allMessages"],
    queryFn: async () => {
      const q = query(collection(db, "messages"), orderBy("sentAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Message, "id">),
      }));
    },
    enabled: !!currentUser?.uid && currentUserData?.isAdmin,
  });

  const filteredMessages = allMessages
    .filter((msg) => msg.senderId === currentUser?.uid)
    .filter((msg) => {
      if (filter === "all") return true;
      if (filter === "admin") return msg.senderName === adminName;
      return msg.senderName !== adminName;
    });

  const {
    data: users = [],
    isLoading: loadingUsers,
    error: usersError,
  } = useQuery<AppUser[]>({
    queryKey: ["messageUsers"],
    queryFn: async () => {
      const usersRef = collection(db, "users");
      const q = query(usersRef, orderBy("joinedAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: data.uid,
          name: data.name,
          surname: data.surname,
          email: data.email,
          isAdmin: data.isAdmin ?? false,
          joinedAt: data.joinedAt,
        } as AppUser;
      });
    },
    enabled: !!currentUserData?.isAdmin,
  });

  const filteredUsers = users.filter((user) =>
    `${user.name} ${user.surname} ${user.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const validateMessage = () => {
    const errors: { subject?: string; content?: string; user?: string } = {};
    if (!selectedUser) {
      errors.user = "Please select a recipient";
    }
    if (!subject.trim()) {
      errors.subject = "Subject is required";
    } else if (subject.length > 100) {
      errors.subject = "Subject must be 100 characters or less";
    }
    if (!content.trim()) {
      errors.content = "Message content is required";
    } else if (content.length > 1000) {
      errors.content = "Message must be 1000 characters or less";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!validateMessage()) {
        throw new Error("Please fix validation errors");
      }
      if (!currentUser?.uid || !currentUserData) {
        throw new Error("Not authenticated");
      }

      const messageData = {
        senderId: currentUser.uid,
        senderName: adminName,
        recipientId: selectedUser!.uid,
        subject: subject.trim(),
        content: content.trim(),
        sentAt: Timestamp.now(),
        isRead: false,
        isWelcomeMessage: false,
      };

      const docRef = await addDoc(collection(db, "messages"), messageData);
      return { id: docRef.id, ...messageData };
    },
    onSuccess: () => {
      toast.success("Message sent successfully!");
      setSubject("");
      setContent("");
      setSelectedUser(null);
      setValidationErrors({});
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to send message");
    },
  });

  const updateMessageMutation = useMutation({
    mutationFn: async (updatedMessage: Message) => {
      if (updatedMessage.senderName !== adminName) {
        throw new Error("System messages cannot be edited");
      }
      const messageRef = doc(db, "messages", updatedMessage.id);
      await updateDoc(messageRef, {
        subject: updatedMessage.subject,
        content: updatedMessage.content,
        isRead: false,
      });
      return updatedMessage;
    },
    onSuccess: () => {
      toast.success("Message updated successfully!");
      setIsPopupOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update message");
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const messageRef = doc(db, "messages", messageId);
      const messageSnap = await getDoc(messageRef);
      if (!messageSnap.exists()) {
        throw new Error("Message not found");
      }
      const messageData = messageSnap.data() as Message;
      if (messageData.senderName !== adminName) {
        throw new Error("System messages cannot be deleted");
      }
      await deleteDoc(messageRef);
    },
    onSuccess: () => {
      toast.success("Message deleted successfully!");
      setIsPopupOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete message");
    },
  });

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    setIsPopupOpen(true);
  };

  if (loadingCurrentUserData) {
    return (
      <div className="font-light max-w-5xl mx-auto md:px-4 py-8 min-h-screen text-white">
        Loading user data...
      </div>
    );
  }

  if (!currentUserData?.isAdmin) {
    return (
      <div className="font-light max-w-5xl mx-auto md:px-4 py-8 min-h-screen text-white">
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="font-light max-w-full mx-auto md:px-4 py-8 min-h-screen text-white">
      <title>DrugWise - Admin Message Center</title>
      <h1 className="text-3xl font-bold mb-8 text-center sm:text-left bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
        Message Center
      </h1>
      <p className="text-neutral-500 mb-8 font-light">
        Send messages to users and view your sent messages.
      </p>

      <div className="flex gap-4 mb-8">
        <button
          className={`px-4 py-2 rounded font-semibold ${
            view === "compose"
              ? "bg-lime-600 text-white"
              : "bg-neutral-500/10 text-neutral-400 hover:bg-neutral-700"
          }`}
          onClick={() => setView("compose")}>
          Compose
        </button>
        <button
          className={`px-4 py-2 rounded font-semibold ${
            view === "sent"
              ? "bg-lime-600 text-white"
              : "bg-neutral-500/10 text-neutral-400 hover:bg-neutral-700"
          }`}
          onClick={() => setView("sent")}>
          Sent Messages
        </button>
      </div>

      {view === "compose" ? (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3 bg-neutral-800 rounded-xl p-6 border border-neutral-700 shadow-inner">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-900 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-light"
              />
            </div>

            <div className="min-h-60 overflow-y-auto">
              {loadingUsers ? (
                <div className="text-neutral-500 p-4 text-center font-light">
                  Loading users...
                </div>
              ) : usersError ? (
                <div className="text-red-400 p-4 text-center font-light">
                  Error loading users.
                </div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <motion.div
                    key={u.uid}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer mb-2 ${
                      selectedUser?.uid === u.uid
                        ? "bg-neutral-700 text-white"
                        : "hover:bg-neutral-900"
                    }`}
                    onClick={() => setSelectedUser(u)}>
                    <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-300">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold">
                        {u.name} {u.surname}
                      </div>
                      <div className="text-xs text-neutral-500 font-light">
                        {u.email}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-neutral-500 p-4 text-center font-light">
                  No users found
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 bg-neutral-800 rounded-xl p-6 border border-neutral-700 shadow-inner flex flex-col">
            <div className="mb-4">
              <label className="block text-neutral-300 mb-2 font-semibold">
                To
              </label>
              <select
                value={selectedUser?.uid || ""}
                onChange={(e) => {
                  const user = users.find((u) => u.uid === e.target.value);
                  setSelectedUser(user || null);
                }}
                className={`w-full px-3 py-2 bg-neutral-900 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-light ${
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
              {validationErrors.user && (
                <p className="text-red-400 text-xs mt-1 font-light">
                  {validationErrors.user}
                </p>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-neutral-300 mb-2 font-semibold">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className={`w-full px-3 py-2 bg-neutral-900 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-light capitalize ${
                  validationErrors.subject ? "border-red-400" : ""
                }`}
                placeholder="Enter subject"
              />
              {validationErrors.subject && (
                <p className="text-red-400 text-xs mt-1 font-light">
                  {validationErrors.subject}
                </p>
              )}
            </div>
            <div className="mb-4 flex-1 flex flex-col">
              <label className="block text-neutral-300 mb-2 font-semibold">
                Message
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`w-full h-40 px-3 py-2 bg-neutral-900 text-white rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-light ${
                  validationErrors.content ? "border-red-400" : ""
                }`}
                placeholder="Type your message..."
              />
              {validationErrors.content && (
                <p className="text-red-400 text-xs mt-1 font-light">
                  {validationErrors.content}
                </p>
              )}
            </div>
            <button
              className="mt-2 bg-lime-600 hover:bg-lime-700 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 self-end transition-colors duration-200"
              onClick={() => sendMutation.mutate()}
              disabled={sendMutation.isPending}>
              <Send size={16} />
              {sendMutation.isPending ? "Sending..." : "Send Message"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <label className="text-neutral-300 font-semibold">Filter:</label>
            <select
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value as "all" | "admin" | "system")
              }
              className="px-3 py-2 bg-neutral-900 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-light">
              <option value="all">All Messages</option>
              <option value="admin">Admin Sent</option>
              <option value="system">System Sent</option>
            </select>
          </div>
          <div className="overflow-x-auto rounded-xl border border-neutral-700 bg-neutral-800 shadow-inner">
            <table className="min-w-full text-left text-neutral-300 text-sm">
              <thead className="bg-neutral-700/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">To</th>
                  <th className="px-6 py-4 font-semibold">Subject</th>
                  <th className="px-6 py-4 font-semibold">Sent At</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {loadingMessages ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-neutral-500 font-light">
                        Loading messages...
                      </td>
                    </tr>
                  ) : messagesError ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-red-400 font-light">
                        Error:{" "}
                        {messagesError instanceof Error
                          ? messagesError.message
                          : "Failed to load messages"}
                      </td>
                    </tr>
                  ) : filteredMessages.length > 0 ? (
                    filteredMessages.map((msg: Message) => {
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
                          className={`border-b border-neutral-700 ${
                            isAdminMessage
                              ? "hover:bg-neutral-700 cursor-pointer"
                              : "cursor-default"
                          } transition-colors duration-200`}
                          onClick={() => handleViewMessage(msg)}>
                          <td className="px-6 py-4 font-semibold">
                            {recipient
                              ? `${recipient.name} ${recipient.surname}`
                              : msg.recipientId}
                          </td>
                          <td className="px-6 py-4 font-semibold">
                            {msg.subject}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {msg.sentAt?.toDate()?.toLocaleString() || "-"}
                          </td>
                          <td className="px-6 py-4">
                            {msg.isRead ? (
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-900/30 text-green-400 flex items-center gap-1">
                                <Check size={14} /> Read
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
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleViewMessage(msg)}
                              className={`flex items-center gap-2 px-3 py-1 rounded-xl text-sm font-semibold ${
                                isAdminMessage
                                  ? "bg-lime-600 hover:bg-lime-700 text-white"
                                  : "bg-blue-600 hover:bg-blue-700 text-white"
                              } transition-colors duration-200`}>
                              {isAdminMessage ? (
                                <>
                                  <Check size={14} />
                                  Edit
                                </>
                              ) : (
                                <>
                                  <Eye size={14} />
                                  View
                                </>
                              )}
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-neutral-500 font-light">
                        No sent messages found
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isPopupOpen && selectedMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6 font-light"
          onClick={() => setIsPopupOpen(false)}>
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="bg-neutral-800 rounded-2xl shadow-lg p-6 w-full max-w-md border border-neutral-700 relative"
            onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-2 right-2 text-neutral-400 hover:text-white text-3xl font-light p-2 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors duration-200"
              onClick={() => setIsPopupOpen(false)}
              aria-label="Close modal">
              <X />
            </button>
            <h2 className="text-xl font-bold mb-6 text-center sm:text-left bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
              {selectedMessage.senderName === adminName
                ? "Edit Message"
                : "View Message"}
            </h2>
            <div className="mb-4">
              <label className="block text-neutral-300 mb-2 font-semibold">
                Subject
              </label>
              {selectedMessage.senderName === adminName ? (
                <input
                  type="text"
                  value={selectedMessage.subject}
                  onChange={(e) =>
                    setSelectedMessage({
                      ...selectedMessage,
                      subject: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-neutral-900 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-light"
                />
              ) : (
                <p className="w-full px-3 py-2 bg-neutral-900 text-white rounded-xl font-light">
                  {selectedMessage.subject}
                </p>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-neutral-300 mb-2 font-semibold">
                Message
              </label>
              {selectedMessage.senderName === adminName ? (
                <textarea
                  value={selectedMessage.content}
                  onChange={(e) =>
                    setSelectedMessage({
                      ...selectedMessage,
                      content: e.target.value,
                    })
                  }
                  className="w-full h-40 px-3 py-2 bg-neutral-900 text-white rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-light"
                />
              ) : (
                <p className="w-full h-40 px-3 py-2 bg-neutral-900 text-white rounded-xl font-light whitespace-pre-wrap">
                  {selectedMessage.content}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-xl bg-neutral-500/10 text-neutral-400 border-neutral-500/20 hover:bg-neutral-700 transition-colors duration-200"
                onClick={() => setIsPopupOpen(false)}>
                Close
              </button>
              {selectedMessage.senderName === adminName && (
                <>
                  <button
                    className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 transition-colors duration-200 flex items-center gap-2"
                    onClick={() =>
                      deleteMessageMutation.mutate(selectedMessage.id)
                    }
                    disabled={deleteMessageMutation.isPending}>
                    {deleteMessageMutation.isPending ? (
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
                  </button>
                  <button
                    className="px-4 py-2 rounded-xl bg-lime-600 hover:bg-lime-700 text-white flex items-center gap-2 transition-colors duration-200"
                    onClick={() => {
                      if (selectedMessage) {
                        updateMessageMutation.mutate(selectedMessage);
                      }
                    }}
                    disabled={updateMessageMutation.isPending}>
                    {updateMessageMutation.isPending ? (
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
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default AdminMessages;
