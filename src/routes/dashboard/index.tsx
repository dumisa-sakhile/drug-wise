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

// --- Type Definitions ---
interface UserData {
  uid: string;
  email: string;
  name: string;
  surname: string;
  lastLogin: Timestamp | null;
  role?: string;
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

// --- Custom Hook for Data Fetching ---
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

// --- Route Definition ---
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
        {/* Main Content Area */}
        <div className="flex-grow p-6 md:p-10 overflow-auto max-w-7xl mx-auto w-full">
          <header className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-zinc-800 pb-6">
            <div className="text-center sm:text-left py-8 sm:py-0">
              <h1 className="text-3xl font-bold text-lime-400 mb-1">
                Welcome, {userData?.name}!
              </h1>
              <p className="text-gray-400">
                Here's a quick overview of your health dashboard.
              </p>
            </div>
            <motion.button
              onClick={handleSignOut}
              className="flex items-center justify-center gap-2.5 text-base px-5 py-2.5 font-light text-black bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 border border-rose-400/50 hover:border-rose-500 shadow-md hover:shadow-lg transition-colors rounded-full w-full sm:w-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}>
              <LogOut size={18} /> Sign Out
            </motion.button>
          </header>

          <AnimatePresence>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible">
              {isProfileComplete ? (
                <DashboardCard
                  key="profile-complete"
                  title="Profile Complete"
                  value="All Set"
                  icon={CheckCircle}
                  bgColor="bg-green-500/20"
                  iconColor="text-green-400"
                  link={null}
                  description="Your profile is fully up to date. Edit if needed."
                  action={() => setModalOpen(true)}
                />
              ) : (
                <DashboardCard
                  key="profile-incomplete"
                  title="Profile Incomplete"
                  value="Action Required"
                  icon={AlertTriangle}
                  bgColor="bg-yellow-500/20"
                  iconColor="text-yellow-400"
                  link={null}
                  description="Complete your profile to unlock all features"
                  action={() => setModalOpen(true)}
                />
              )}
              {medications.length === 0 && (
                <DashboardCard
                  key="no-medications"
                  title="No Medications"
                  value="Action Required"
                  icon={FileText}
                  bgColor="bg-gray-500/20"
                  iconColor="text-gray-400"
                  link="/dashboard/medication"
                  description="Submit your first medication for review"
                />
              )}
              <DashboardCard
                key="new-messages"
                title="New Messages"
                value={unreadMessages.length}
                icon={MessagesSquare}
                bgColor="bg-sky-500/20"
                iconColor="text-sky-400"
                link="/dashboard/messages"
                description="Unread messages from admins"
              />
              <DashboardCard
                key="medications-submitted"
                title="Medications Submitted"
                value={medications.length}
                icon={FileText}
                bgColor="bg-purple-500/20"
                iconColor="text-purple-400"
                link="/dashboard/medication"
                description="Total number of medications"
              />
              <DashboardCard
                key="pending-approval"
                title="Pending Approval"
                value={pendingMedications.length}
                icon={Clock}
                bgColor="bg-yellow-500/20"
                iconColor="text-yellow-400"
                link="/dashboard/medication?status=pending"
                description="Medications awaiting review"
              />
              <DashboardCard
                key="approved-medications"
                title="Approved Medications"
                value={approvedMedications.length}
                icon={CheckCircle}
                bgColor="bg-green-500/20"
                iconColor="text-green-400"
                link="/dashboard/medication?status=approved"
                description="Approved medications"
              />
              <DashboardCard
                key="rejected-medications"
                title="Rejected Medications"
                value={rejectedMedications.length}
                icon={XCircle}
                bgColor="bg-red-500/20"
                iconColor="text-red-400"
                link="/dashboard/medication?status=rejected"
                description="Rejected medication submissions"
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

// --- Child Components ---

const DashboardCard = ({
  title,
  value,
  icon: Icon,
  bgColor,
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
      className={`p-6 rounded-xl flex flex-col justify-between h-40 border border-zinc-800 ${bgColor} hover:scale-[1.02] transition-transform duration-200 cursor-pointer w-full`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm text-gray-300 font-semibold">{title}</h3>
          <p className="text-4xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-full ${iconColor} bg-zinc-800`}>
          <Icon size={24} />
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2">{description}</p>
    </motion.div>
  );

  return link ? (
    <Link to={link}>{content}</Link>
  ) : (
    <div onClick={action}>{content}</div>
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
