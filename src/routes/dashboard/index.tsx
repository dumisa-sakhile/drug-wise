// Other imports remain the same
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/config/firebase";
import {
  AlertTriangle,
  MessagesSquare,
  LogOut,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import EditProfileForm from "@/components/EditProfileForm";
import { signOut } from "firebase/auth";

// --- Type Definitions (No changes) ---
interface UserData {
  uid: string;
  email: string;
  name: string;
  surname: string;
  lastLogin: Timestamp | null;
  role?: string;
  photoURL?: string;
}

interface Medication {
  id: string;
  medicationName: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: Timestamp;
}

interface Message {
  id: string;
  senderName: string;
  subject: string;
  sentAt: Timestamp;
  isRead: boolean;
}

// --- Custom Hook for Data Fetching (No changes) ---
const useDashboardData = (user: User | null) => {
  const uid = user?.uid;

  const results = useQueries({
    queries: [
      {
        queryKey: ["userData", uid],
        queryFn: async () => {
          if (!uid) return null;
          const userDoc = await getDoc(doc(db, "users", uid));
          if (!userDoc.exists()) throw new Error("User not found");
          return userDoc.data() as UserData;
        },
        enabled: !!uid,
      },
      {
        queryKey: ["medications", uid],
        queryFn: async () => {
          if (!uid) return [];
          const q = query(
            collection(db, "medications"),
            where("userId", "==", uid)
          );
          const snapshot = await getDocs(q);
          return snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as Medication
          );
        },
        enabled: !!uid,
      },
      {
        queryKey: ["messages", uid],
        queryFn: async () => {
          if (!uid) return [];
          const q = query(
            collection(db, "messages"),
            where("recipientId", "==", uid)
          );
          const snapshot = await getDocs(q);
          return snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as Message
          );
        },
        enabled: !!uid,
      },
    ],
  });

  const userData = results[0].data as UserData | null | undefined;
  const medications = results[1].data as Medication[] | undefined;
  const messages = results[2].data as Message[] | undefined;

  const isLoading = results.some((r) => r.isLoading);
  const error = results.find((r) => r.error)?.error;

  return {
    userData,
    medications: medications || [],
    messages: messages || [],
    isLoading,
    error,
  };
};

// --- Route Definition (No changes) ---
export const Route = createFileRoute("/dashboard/")({
  component: DashboardPage,
});

// --- Main Dashboard Component ---
function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate({ to: "/auth" });
      } else {
        setUser(currentUser);
        await updateDoc(doc(db, "users", currentUser.uid), {
          lastLogin: Timestamp.now(),
        }).catch(() => {});
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate({ to: "/auth" });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const { userData, medications, messages, isLoading, error } =
    useDashboardData(user);

  const isProfileComplete = useMemo(
    () => userData && userData.name && userData.surname,
    [userData]
  );

  if (isLoading && !userData) return <LoadingState />;
  if (error || !user || !userData) return <ErrorState />;

  const pendingMedications = medications.filter((m) => m.status === "pending");
  const approvedMedications = medications.filter(
    (m) => m.status === "approved"
  );
  const rejectedMedications = medications.filter(
    (m) => m.status === "rejected"
  );
  const unreadMessages = messages.filter((m) => !m.isRead);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <>
      <title>DrugWise - Dashboard</title>
      <main className="min-h-screen text-gray-100 font-sans bg-zinc-950 flex flex-col">
        <div className="flex-grow p-0 md:p-10 overflow-auto max-w-4xl mx-auto w-full">
          {/* Header section with welcome message and logout button */}
          <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
            {/* Welcome Message */}
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-50 mb-2">
                Welcome,{" "}
                <span className="text-lime-400">
                  {userData?.name || "User"}
                </span>
                !
              </h1>
              <p className="text-base text-gray-400 max-w-2xl">
                Here's a quick overview of your health and medication
                submissions.
              </p>
            </div>

            {/* Logout Button */}
            <motion.button
              onClick={handleSignOut}
              className="self-end md:self-auto flex items-center gap-2.5 px-6 py-2 rounded-full text-white transition-colors
                         bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700
                         font-light text-base shadow-lg hover:shadow-red-500/30"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}>
              <LogOut size={20} />
              Sign Out
            </motion.button>
          </header>

          <AnimatePresence>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
              variants={containerVariants}
              initial="hidden"
              animate="visible">
              {/* All cards now use the same MetricCard component */}
              {!isProfileComplete && (
                <MetricCard
                  title="PROFILE INCOMPLETE"
                  value="Action Required"
                  valueClassName="text-2xl"
                  icon={AlertTriangle}
                  iconColor="text-red-500"
                  link={null}
                  description="Complete your profile to unlock all features"
                  action={() => setModalOpen(true)}
                />
              )}
              {medications.length === 0 && (
                <MetricCard
                  title="NO MEDICATIONS"
                  value="Action Required"
                  valueClassName="text-2xl"
                  icon={FileText}
                  iconColor="text-yellow-500"
                  link="/dashboard/medication"
                  description="Submit your first medication for review"
                />
              )}
              <MetricCard
                title="Pending Approval"
                value={pendingMedications.length}
                icon={Clock}
                iconColor="text-yellow-500"
                link="/dashboard/medication?status=pending"
                description="Medications awaiting review"
              />
              <MetricCard
                title="Approved Medications"
                value={approvedMedications.length}
                icon={CheckCircle}
                iconColor="text-green-500"
                link="/dashboard/medication?status=approved"
                description="Approved medications"
              />
              <MetricCard
                title="Rejected Medications"
                value={rejectedMedications.length}
                icon={XCircle}
                iconColor="text-red-500"
                link="/dashboard/medication?status=rejected"
                description="Rejected medication submissions"
              />
              <MetricCard
                title="New Messages"
                value={unreadMessages.length}
                icon={MessagesSquare}
                iconColor="text-sky-500"
                link="/dashboard/messages"
                description="Unread messages from admins"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <EditProfileForm
        isShowing={isModalOpen}
        hide={() => setModalOpen(false)}
        user={user}
      />
    </>
  );
}

// --- Child Components (No changes) ---

const MetricCard = ({
  title,
  value,
  valueClassName = "text-4xl",
  icon: Icon,
  iconColor,
  link,
  description,
  action,
}: any) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  const content = (
    <motion.div
      variants={cardVariants}
      className="p-6 rounded-lg bg-zinc-900 flex flex-col justify-between h-40 transition-transform duration-200 cursor-pointer w-full">
      <div className="flex items-center gap-2">
        <span className={iconColor}>
          <Icon size={24} />
        </span>
        <span className="text-gray-400 text-sm font-medium">{title}</span>
      </div>
      <p className={`font-bold text-gray-100 ${valueClassName}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-2">{description}</p>
    </motion.div>
  );

  return link ? (
    <Link to={link}>{content}</Link>
  ) : (
    <div onClick={action || (() => {})}>{content}</div>
  );
};

const LoadingState = () => (
  <motion.div
    className="min-h-screen flex flex-col items-center justify-center text-gray-300 bg-zinc-950"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}>
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-10 h-10 border-4 border-gray-600 border-t-lime-500 rounded-full mb-4"
    />
    <p className="text-lg font-medium">Loading Dashboard...</p>
  </motion.div>
);

const ErrorState = () => (
  <motion.div
    className="min-h-screen flex flex-col items-center justify-center text-gray-300 px-4 bg-zinc-950"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}>
    <AlertTriangle size={32} className="text-rose-400 mb-4" />
    <h2 className="text-xl font-semibold text-gray-100 mb-1">
      Failed to Load Dashboard
    </h2>
    <p className="text-center text-sm">
      We couldn't retrieve your data. Please check your connection and try
      again.
    </p>
  </motion.div>
);
