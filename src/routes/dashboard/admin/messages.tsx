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
import { toast } from "react-hot-toast";
import { onAuthStateChanged } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import MessagesHeader from "@/components/admin/adminMessages/MessagesHeader";
import ViewToggle from "@/components/admin/adminMessages/ViewToggle";
import UserList from "@/components/admin/adminMessages/UserList";
import MessageForm from "@/components/admin/adminMessages/MessageForm";
import MessagesFilter from "@/components/admin/adminMessages/MessagesFilter";
import MessagesTable from "@/components/admin/adminMessages/MessagesTable";
import MessageModal from "@/components/admin/adminMessages/MessageModal";
import AdminMessagesSkeleton from "@/components/admin/adminMessages/AdminMessagesSkeleton";
import type { AppUser, Message } from "@/components/admin/adminMessages/types";

export const Route = createFileRoute("/dashboard/admin/messages")({
  component: AdminMessages,
});

function AdminMessages() {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [view, setView] = useState<"compose" | "sent">("compose");
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "admin" | "system">("admin");
  const [validationErrors, setValidationErrors] = useState<{
    subject?: string;
    content?: string;
    user?: string;
  }>({});
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

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

  const totalPages = Math.ceil(filteredMessages.length / rowsPerPage);
  const paginatedMessages = filteredMessages.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
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

  const handleBack = () => {
    window.history.back();
  };

  if (loadingCurrentUserData || loadingMessages) {
    return <AdminMessagesSkeleton view={view} />;
  }

  if (!currentUserData?.isAdmin) {
    return (
      <div className="font-light max-w-full mx-auto md:px-4 py-8 pt-16 md:pt-8 min-h-screen text-white bg-zinc-950">
        <p className="text-gray-400">
          You do not have permission to access this page.
        </p>
      </div>
    );
  }

  return (
    <>
      <motion.button
        onClick={handleBack}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="md:hidden fixed top-4 left-4 z-30 flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-gray-300 transition-all duration-200 shadow-md font-light">
        <ArrowLeft className="w-4 h-4 text-lime-400" />
        Back
      </motion.button>
      <motion.div
        className="font-light max-w-full mx-auto md:px-4 py-8 pt-16 md:pt-8 min-h-screen text-white bg-zinc-950"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}>
        <MessagesHeader />
        <ViewToggle view={view} setView={setView} />
        {view === "compose" ? (
          <div className="flex flex-col md:flex-row gap-6">
            <UserList
              search={search}
              setSearch={setSearch}
              users={users}
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
              isLoading={loadingUsers}
              error={usersError}
            />
            <MessageForm
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
              subject={subject}
              setSubject={setSubject}
              content={content}
              setContent={setContent}
              users={users}
              validationErrors={validationErrors}
              sendMutation={sendMutation}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <MessagesFilter filter={filter} setFilter={setFilter} />
            <MessagesTable
              messages={paginatedMessages}
              users={users}
              adminName={adminName}
              isLoading={loadingMessages}
              error={messagesError}
              onViewMessage={handleViewMessage}
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
            />
          </div>
        )}
        <MessageModal
          isOpen={isPopupOpen}
          onClose={() => setIsPopupOpen(false)}
          message={selectedMessage}
          adminName={adminName}
          setMessage={setSelectedMessage}
          updateMutation={updateMessageMutation}
          deleteMutation={deleteMessageMutation}
        />
      </motion.div>
    </>
  );
}

export default AdminMessages;
