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
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Edit,
  Mail,
  Pill,
  Plus,
} from "lucide-react";
import EditProfileForm from "@/components/EditProfileForm";
import defaultMaleAvatar from "/male.jpg?url";
import defaultFemaleAvatar from "/female.jpg?url";

// --- Type Definitions ---
interface UserData {
  uid: string;
  email: string;
  gender: string;
  name: string;
  surname: string;
  lastLogin: Timestamp | null;
  photoURL?: string;
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
          const userDoc = await getDoc(doc(db, "users", uid!));
          if (!userDoc.exists()) throw new Error("User not found");
          return userDoc.data() as UserData;
        },
        enabled: !!uid,
      },
      {
        queryKey: ["medications", uid],
        queryFn: async () => {
          const q = query(
            collection(db, "medications"),
            where("userId", "==", uid!)
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
          const q = query(
            collection(db, "messages"),
            where("recipientId", "==", uid!)
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

  const userData = results[0].data as UserData | undefined;
  const medications = results[1].data as Medication[] | undefined;
  const messages = results[2].data as Message[] | undefined;

  const isLoading = results.some((r) => r.isLoading);
  const error = results.find((r) => r.error)?.error;

  const timelineItems = useMemo(() => {
    const items: any[] = [];
    (medications || []).forEach((med: Medication) =>
      items.push({
        id: med.id,
        date: med.submittedAt?.toDate(),
        Icon: Pill,
        color: "text-lime-400",
        title: `Medication: ${med.medicationName}`,
        description: `Status: ${med.status}`,
        link: "/dashboard/medication",
      })
    );
    (messages || []).forEach((msg: Message) =>
      items.push({
        id: msg.id,
        date: msg.sentAt?.toDate(),
        Icon: Mail,
        color: "text-sky-400",
        title: `New Message: ${msg.subject}`,
        description: `From: ${msg.senderName}`,
        link: "/dashboard/messages",
        isNew: !msg.isRead,
      })
    );
    return items.sort((a, b) => b.date?.getTime() - a.date?.getTime());
  }, [medications, messages]);

  const unreadMessageCount = useMemo(
    () => (messages || []).filter((msg: Message) => !msg.isRead).length,
    [messages]
  );

  const totalMessageCount = messages?.length ?? 0;

  return {
    userData,
    medicationCount: medications?.length ?? 0,
    unreadMessageCount,
    totalMessageCount,
    timelineItems,
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
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
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

  const {
    userData,
    medicationCount,
    unreadMessageCount,
    totalMessageCount,
    timelineItems,
    isLoading,
    error,
  } = useDashboardData(user);

  const isProfileIncomplete = useMemo(
    () => userData && (!userData.gender || !userData.name || !userData.surname),
    [userData]
  );

  const profileImage = useMemo(() => {
    if (user?.photoURL) return user.photoURL;
    if (userData?.photoURL) return userData.photoURL;
    return userData?.gender === "female"
      ? defaultFemaleAvatar
      : defaultMaleAvatar;
  }, [user, userData]);

  // Pagination Logic
  const totalItems = timelineItems.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const paginatedItems = timelineItems.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setRowsPerPage(Number(event.target.value));
    setCurrentPage(1); // Reset to first page
  };

  if (isLoading && !userData) return <LoadingState />;
  if (error || !user) return <ErrorState />;

  return (
    <>
      <title>DrugWise - My Hub</title>
      <main className="min-h-screen text-gray-100 font-sans p-0 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-full mx-auto w-full ">
          <DashboardHeader
            user={userData}
            profileImage={profileImage}
            onEditProfile={() => setModalOpen(true)}
            isProfileIncomplete={isProfileIncomplete}
          />
          <br />
          <QuickNav
            medicationCount={medicationCount}
            messageCount={totalMessageCount}
            unreadMessageCount={unreadMessageCount}
          />
          <br />
          <ActionCenter
            medicationCount={medicationCount}
            isProfileIncomplete={isProfileIncomplete}
            onUpdateProfile={() => setModalOpen(true)}
          />
          <br />
          <ActivityFeed
            activities={paginatedItems}
            currentPage={currentPage}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </motion.div>
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
const DashboardHeader = ({ user, profileImage, onEditProfile }: any) => (
  <header className="flex flex-col items-center md:items-start gap-4 w-full h-auto mx-auto mb-8 py-4 sm:px-6 sm:py-6">
    <motion.img
      src={profileImage}
      alt="Profile"
      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-lime-500/30 hover:ring-2 hover:ring-lime-500/50 transition-all duration-200 hover:scale-105"
      initial={{ scale: 0, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    />
    <div className="text-center">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-100">
        Welcome, {user?.name || "User"}!
      </h1>
      <p className="text-sky-300 text-sm">{user?.email}</p>
    </div>
    <div className="w-full max-w-xs">
      <motion.button
        onClick={onEditProfile}
        className="flex items-center justify-center w-full gap-2 text-sm text-lime-400 bg-gradient-to-r from-sky-500/20 to-lime-500/20 hover:bg-gradient-to-r hover:from-sky-500/30 hover:to-lime-500/30 px-4 py-2 rounded-lg transition-all duration-200 shadow-md min-h-[44px]"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}>
        <Edit size={16} />
        Edit Profile
      </motion.button>
    </div>
  </header>
);

const QuickNav = ({
  medicationCount,
  messageCount,
  unreadMessageCount,
}: any) => (
  <motion.div
    className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 px-4 sm:px-6"
    initial="hidden"
    animate="visible"
    variants={{
      hidden: {},
      visible: { transition: { staggerChildren: 0.2 } },
    }}>
    <NavCard
      to="/dashboard/medication"
      Icon={Pill}
      title="My Medications"
      value={medicationCount}
      label="Tracked"
      color="text-lime-400 bg-lime-500/10"
    />
    <NavCard
      to="/dashboard/messages"
      Icon={Mail}
      title="Messages"
      value={messageCount}
      label={
        unreadMessageCount > 0 ? `${unreadMessageCount} Unread` : "in inbox"
      }
      color="text-sky-400 bg-sky-500/10"
      hasAlert={unreadMessageCount > 0}
    />
  </motion.div>
);

const NavCard = ({ to, Icon, title, value, label, color, hasAlert }: any) => (
  <Link to={to} className="block w-full min-h-[44px]">
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      whileHover={{
        scale: 1.03,
        y: -6,
        transition: { type: "spring", stiffness: 300 },
      }}
      className="relative p-4 rounded-2xl border border-gray-700 bg-[#2A2A2D] hover:bg-gradient-to-r hover:from-rose-500/20 hover:to-sky-500/20 transition-all duration-200 shadow-md">
      <div className="flex justify-between items-start">
        <div className="flex-col">
          <h3 className="font-bold text-gray-100 text-base sm:text-lg">
            {title}
          </h3>
          <p className="text-sm text-gray-300">
            <span className="text-xl sm:text-2xl font-bold text-gray-100">
              {value}
            </span>{" "}
            {label}
          </p>
        </div>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={24} sm:size={28} />
        </div>
      </div>
      {hasAlert && (
        <span className="absolute top-3 right-3 block h-2.5 w-2.5 rounded-full bg-lime-500"></span>
      )}
      <div className="absolute bottom-4 right-4 text-gray-400 group-hover:text-lime-300 transition-colors duration-200">
        <ArrowRight size={20} />
      </div>
    </motion.div>
  </Link>
);

const ActionCenter = ({
  medicationCount,
  isProfileIncomplete,
  onUpdateProfile,
}: any) => {
  const actions = [
    isProfileIncomplete && {
      id: "profile-incomplete",
      Icon: AlertTriangle,
      color:
        "bg-gradient-to-r from-amber-500/10 to-rose-500/10 text-amber-400 border-amber-500/20",
      title: "Complete Your Profile",
      description: "Provide required details to get the most out of DrugWise.",
      buttonLabel: "Update Now",
      onAction: onUpdateProfile,
    },
    medicationCount === 0 && {
      id: "add-meds",
      Icon: Plus,
      color:
        "bg-gradient-to-r from-rose-500/10 to-lime-500/10 text-rose-400 border-rose-500/20",
      title: "Add Your First Medication",
      description:
        "Start tracking your medications to get reminders and insights.",
      buttonLabel: "Add Medication",
      actionLink: "/dashboard/medication",
    },
  ].filter(Boolean);

  if (actions.length === 0) return null;

  return (
    <motion.div
      className="mb-8 px-4 sm:px-6"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.1 } },
      }}>
      <h3 className="text-base sm:text-lg font-semibold text-gray-100 mb-3">
        Next Steps
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatePresence>
          {actions.map((action: any) => (
            <Link
              key={action.id}
              to={action.actionLink}
              onClick={action.onAction}
              className="block w-full min-h-[44px]">
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                layout
                className={`flex items-start gap-4 p-4 rounded-2xl border ${action.color} shadow-md`}>
                <action.Icon size={20} className="flex-shrink-0 mt-1" />
                <div className="flex-grow">
                  <h4 className="font-bold text-gray-100 text-base">
                    {action.title}
                  </h4>
                  <p className="text-sm text-gray-300 mb-3">
                    {action.description}
                  </p>
                  <div className="text-sm font-semibold bg-gradient-to-r from-lime-500/20 to-sky-500/20 hover:bg-gradient-to-r hover:from-lime-500/30 hover:to-sky-500/30 text-lime-400 px-3 py-1.5 rounded-md transition-all duration-200 inline-flex items-center gap-2 min-h-[44px]">
                    {action.buttonLabel} <ArrowRight size={14} />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const ActivityFeed = ({
  activities,
  currentPage,
  totalPages,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: any) => (
  <motion.div
    className="px-4 sm:px-6"
    initial="hidden"
    animate="visible"
    variants={{
      hidden: {},
      visible: { transition: { staggerChildren: 0.1 } },
    }}>
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
      <h3 className="text-base sm:text-lg font-semibold text-gray-100 flex items-center gap-2">
        <ClipboardList size={20} className="text-lime-400" />
        Recent Activity
      </h3>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-300">Rows per page:</label>
        <select
          value={rowsPerPage}
          onChange={onRowsPerPageChange}
          className="bg-[#2A2A2D] text-gray-100 text-sm rounded-md border border-gray-600 focus:ring-2 focus:ring-lime-500/50 px-2 py-1 min-h-[44px]">
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
      </div>
    </div>
    <div className="border border-gray-700 rounded-2xl bg-[#2A2A2D] shadow-md">
      {activities.length > 0 ? (
        <div className="divide-y divide-gray-700">
          {activities.map((item: any, index: number) => (
            <ActivityItem key={item.id} {...item} isFirst={index === 0} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 sm:py-16 text-sky-300 bg-gradient-to-b from-[#2A2A2D] to-[#1C1C1E] rounded-2xl">
          <p className="font-semibold text-base sm:text-lg">All caught up!</p>
          <p className="text-sm">
            New events from your medications and messages will appear here.
          </p>
        </div>
      )}
    </div>
    {totalPages > 1 && (
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
        <motion.button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-lime-400 bg-gradient-to-r from-sky-500/20 to-lime-500/20 hover:bg-gradient-to-r hover:from-sky-500/30 hover:to-lime-500/30 transition-all duration-200 min-h-[44px] ${
            currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}>
          <ArrowLeft size={16} />
          Previous
        </motion.button>
        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <motion.button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 rounded-md text-sm min-h-[44px] ${
                currentPage === page
                  ? "bg-lime-500/30 text-lime-400"
                  : "bg-[#2A2A2D] text-gray-300 hover:bg-lime-500/20"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}>
              {page}
            </motion.button>
          ))}
        </div>
        <motion.button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-lime-400 bg-gradient-to-r from-sky-500/20 to-lime-500/20 hover:bg-gradient-to-r hover:from-sky-500/30 hover:to-lime-500/30 transition-all duration-200 min-h-[44px] ${
            currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}>
          Next
          <ArrowRight size={16} />
        </motion.button>
      </div>
    )}
  </motion.div>
);

const ActivityItem = ({
  Icon,
  color,
  title,
  description,
  link,
  isNew,
  isFirst,
}: any) => (
  <Link to={link} className="block w-full min-h-[44px]">
    <motion.div
      variants={{
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 },
      }}
      initial="hidden"
      animate="visible"
      transition={{ delay: isFirst ? 0.2 : 0 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className="p-3 sm:p-4 hover:bg-gradient-to-r hover:from-neutral-800/50 hover:to-neutral-900/50 transition-all duration-200">
      <div className="flex items-center gap-3 sm:gap-4">
        <div
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${color.replace("text", "bg")}/10`}>
          <Icon size={16} sm:size={20} className={color} />
        </div>
        <div className="flex-grow min-w-0">
          <p className="font-semibold text-gray-100 text-sm sm:text-base truncate flex items-center">
            {title}
            {isNew && (
              <span className="text-xs font-bold text-sky-400 border border-sky-400/50 bg-sky-500/20 px-2 py-0.5 rounded-full ml-2">
                NEW
              </span>
            )}
          </p>
          <p className="text-xs sm:text-sm text-gray-300 truncate">
            {description}
          </p>
        </div>
        <ArrowRight size={16} className="text-lime-400 flex-shrink-0" />
      </div>
    </motion.div>
  </Link>
);

const LoadingState = () => (
  <motion.div
    className="min-h-screen flex flex-col items-center justify-center text-gray-300"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}>
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-10 h-10 border-4 border-gray-600 border-t-lime-500 rounded-full mb-4"
    />
    <p className="text-lg font-medium">Loading Your Hub...</p>
  </motion.div>
);

const ErrorState = () => (
  <motion.div
    className="min-h-screen flex flex-col items-center justify-center text-gray-300 px-4"
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

export default DashboardPage;
