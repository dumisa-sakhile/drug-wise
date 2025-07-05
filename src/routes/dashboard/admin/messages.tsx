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
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { Send, Search } from "lucide-react";
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

  const sentMessages = allMessages.filter(
    (msg) => msg.senderId === currentUser?.uid
  );

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

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser || !subject.trim() || !content.trim()) {
        throw new Error("All fields are required");
      }
      if (!currentUser?.uid || !currentUserData) {
        throw new Error("Not authenticated");
      }

      const messageData = {
        senderId: currentUser.uid,
        senderName: `${currentUserData.name} ${currentUserData.surname}`,
        recipientId: selectedUser.uid,
        subject: subject.trim(),
        content: content.trim(),
        sentAt: Timestamp.now(),
        isRead: false,
      };

      console.log("Sending message:", messageData);

      try {
        const docRef = await addDoc(collection(db, "messages"), messageData);
        console.log("Message sent with ID:", docRef.id);
        return { id: docRef.id, ...messageData };
      } catch (error) {
        console.error("Error sending message:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Message sent successfully!");
      setSubject("");
      setContent("");
      setSelectedUser(null);
    },
    onError: (err: Error) => {
      console.error("Send error:", err);
      toast.error(err.message || "Failed to send message");
    },
  });

  const updateMessageMutation = useMutation({
    mutationFn: async (updatedMessage: Message) => {
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
      console.error("Update error:", err);
      toast.error(err.message || "Failed to update message");
    },
  });

  const handleEditMessage = (message: Message) => {
    setSelectedMessage(message);
    setIsPopupOpen(true);
  };

  if (loadingCurrentUserData) {
    return <div className="p-4 text-white">Loading user data...</div>;
  }

  if (!currentUserData?.isAdmin) {
    return (
      <div className="p-4 text-white">
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="p-4 text-white">
      <h1 className="text-xl mb-4 roboto-condensed-bold">Message Center</h1>
      <p className="text-[#999] mb-6 roboto-condensed-light">
        Send messages to users and view your sent messages.
      </p>

      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded roboto-condensed-bold ${
            view === "compose"
              ? "bg-lime-600 text-white"
              : "text-[#999] hover:text-white"
          }`}
          onClick={() => setView("compose")}>
          Compose
        </button>
        <button
          className={`px-4 py-2 rounded roboto-condensed-bold ${
            view === "sent"
              ? "bg-lime-600 text-white"
              : "text-[#999] hover:text-white"
          }`}
          onClick={() => setView("sent")}>
          Sent Messages
        </button>
      </div>

      {view === "compose" ? (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3 bg-[#141414] rounded-lg p-4 border border-[#333333]">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#999]" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#1A1A1A] text-white rounded focus:outline-none roboto-condensed-light"
              />
            </div>

            <div className="min-h-60 overflow-y-auto">
              {loadingUsers ? (
                <div className="text-[#999] p-4 text-center roboto-condensed-light">
                  Loading users...
                </div>
              ) : usersError ? (
                <div className="text-red-500 p-4 text-center roboto-condensed-light">
                  Error loading users.
                </div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <motion.div
                    key={u.uid}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-center gap-3 p-3 rounded cursor-pointer mb-2 ${
                      selectedUser?.uid === u.uid
                        ? "bg-[#333] text-white"
                        : "hover:bg-[#1A1A1A]"
                    }`}
                    onClick={() => setSelectedUser(u)}>
                    <div className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="roboto-condensed-bold">
                        {u.name} {u.surname}
                      </div>
                      <div className="text-xs text-[#666] roboto-condensed-light">
                        {u.email}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-[#999] p-4 text-center roboto-condensed-light">
                  No users found
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 bg-[#141414] rounded-lg p-6 border border-[#333333] flex flex-col">
            <div className="mb-4">
              <label className="block text-[#999] mb-1 text-xs roboto-condensed-light">
                To
              </label>
              <div className="p-3 bg-[#1A1A1A] rounded roboto-condensed-light">
                {selectedUser ? (
                  <div>
                    <div className="roboto-condensed-bold">
                      {selectedUser.name} {selectedUser.surname}
                    </div>
                    <div className="text-sm text-[#666]">
                      {selectedUser.email}
                    </div>
                  </div>
                ) : (
                  <div className="text-[#666]">No user selected</div>
                )}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-[#999] mb-1 text-xs roboto-condensed-light">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-[#1A1A1A] text-white rounded roboto-condensed-light capitalize"
                placeholder="Enter subject"
              />
            </div>
            <div className="mb-4 flex-1 flex flex-col">
              <label className="block text-[#999] mb-1 text-xs roboto-condensed-light">
                Message
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-40 px-3 py-2 bg-[#1A1A1A] text-white rounded resize-none roboto-condensed-light"
                placeholder="Type your message..."
              />
            </div>
            <button
              className="mt-2 bg-lime-600 hover:bg-lime-700 text-white px-4 py-2 rounded roboto-condensed-regular flex items-center gap-2 self-end"
              onClick={() => sendMutation.mutate()}
              disabled={sendMutation.isPending || !selectedUser}>
              <Send size={16} />
              {sendMutation.isPending ? "Sending..." : "Send Message"}
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#333333] bg-[#141414]">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[#999] bg-[#1A1A1A] border-b border-[#333333] roboto-condensed-bold">
                <th className="px-6 py-4">To</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Sent at</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {loadingMessages ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-[#999] roboto-condensed-light">
                      Loading messages...
                    </td>
                  </tr>
                ) : messagesError ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-red-500 roboto-condensed-light">
                      Error:{" "}
                      {messagesError instanceof Error
                        ? messagesError.message
                        : "Failed to load messages"}
                    </td>
                  </tr>
                ) : sentMessages.length > 0 ? (
                  sentMessages.map((msg: Message) => {
                    const recipient = users.find(
                      (u) => u.uid === msg.recipientId
                    );
                    return (
                      <motion.tr
                        key={msg.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="border-b border-[#333333] hover:bg-[#1A1A1A] cursor-pointer"
                        onClick={() => handleEditMessage(msg)}>
                        <td className="px-6 py-4 roboto-condensed-light">
                          {recipient
                            ? `${recipient.name} ${recipient.surname}`
                            : msg.recipientId}
                        </td>
                        <td className="px-6 py-4 roboto-condensed-bold">
                          {msg.subject}
                        </td>
                        <td className="px-6 py-4 roboto-condensed-light">
                          {msg.sentAt?.toDate()?.toLocaleString() || "-"}
                        </td>
                        <td className="px-6 py-4">
                          {msg.isRead ? (
                            <span className="px-2 py-1 rounded-full text-xs bg-[#1A1A1A] text-green-400">
                              Read
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs bg-[#1A1A1A] text-yellow-400">
                              Unread
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-[#999] roboto-condensed-light">
                      No sent messages found
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {isPopupOpen && selectedMessage && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-[#141414] rounded-lg p-6 border border-[#333333] w-full max-w-md">
            <h2 className="text-lg roboto-condensed-bold mb-4">Edit Message</h2>
            <div className="mb-4">
              <label className="block text-[#999] mb-1 text-xs roboto-condensed-light">
                Subject
              </label>
              <input
                type="text"
                value={selectedMessage.subject}
                onChange={(e) =>
                  setSelectedMessage({
                    ...selectedMessage,
                    subject: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-[#1A1A1A] text-white rounded roboto-condensed-light"
              />
            </div>
            <div className="mb-4">
              <label className="block text-[#999] mb-1 text-xs roboto-condensed-light">
                Message
              </label>
              <textarea
                value={selectedMessage.content}
                onChange={(e) =>
                  setSelectedMessage({
                    ...selectedMessage,
                    content: e.target.value,
                  })
                }
                className="w-full h-40 px-3 py-2 bg-[#1A1A1A] text-white rounded resize-none roboto-condensed-light"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded roboto-condensed-bold"
                onClick={() => setIsPopupOpen(false)}>
                Cancel
              </button>
              <button
                className="bg-lime-600 hover:bg-lime-700 text-white px-4 py-2 rounded roboto-condensed-regular"
                onClick={() => {
                  if (selectedMessage) {
                    updateMessageMutation.mutate(selectedMessage);
                  }
                }}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMessages;