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
        color: "text-rose-400",
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
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate({ to: "/auth" });
      } else {
        setUser(currentUser);
        updateDoc(doc(db, "users", currentUser.uid), {
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

  if (isLoading && !userData) return <LoadingState />;
  if (error || !user) return <ErrorState />;

  return (
    <>
      <title>DrugWise - My Hub</title>
      <main className="bricolage-grotesque-light min-h-screen text-neutral-100 font-sans p-0 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto w-full">
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
          <ActivityFeed activities={timelineItems} />
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

const DashboardHeader = ({
  user,
  profileImage,
  onEditProfile,
  isProfileIncomplete,
}: any) => (
  <header className="flex flex-col sm:flex-row items-start justify-between gap-4 w-full mb-8">
    <div className="flex items-center gap-4">
      <motion.img
        src={profileImage}
        alt="Profile"
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-neutral-700"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Welcome, {user?.name || "User"}!
        </h1>
        <p className="text-neutral-400 text-sm sm:text-base">{user?.email}</p>
        {isProfileIncomplete && (
          <div className="mt-2 sm:hidden">
            <button
              onClick={onEditProfile}
              className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-md">
              <AlertTriangle size={14} />
              Update your profile
            </button>
          </div>
        )}
      </div>
    </div>
    <div className="flex items-center gap-2 self-end sm:self-center w-full sm:w-auto">
      <button
        onClick={onEditProfile}
        className="flex items-center justify-center w-full sm:w-auto gap-2 text-sm text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 px-4 py-2 rounded-lg transition-colors">
        <Edit size={16} />
        Edit Profile
      </button>
    </div>
  </header>
);

const QuickNav = ({
  medicationCount,
  messageCount,
  unreadMessageCount,
}: any) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
    <NavCard
      to="/dashboard/medication"
      Icon={Pill}
      title="My Medications"
      value={medicationCount}
      label="Tracked"
      color="text-rose-400 bg-rose-500/10"
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
  </div>
);

const NavCard = ({ to, Icon, title, value, label, color, hasAlert }: any) => (
  <Link to={to}>
    <motion.div
      whileHover={{ y: -4, transition: { type: "spring", stiffness: 300 } }}
      className={`relative group p-4 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800/40 transition-all overflow-hidden`}>
      <div className="flex justify-between items-start">
        <div className="flex-col">
          <h3 className="font-bold text-white text-lg">{title}</h3>
          <p className="text-sm text-neutral-400">
            <span className="text-2xl font-bold text-white">{value}</span>{" "}
            {label}
          </p>
        </div>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={24} />
        </div>
      </div>
      {hasAlert && (
        <span className="absolute top-3 right-3 block h-2.5 w-2.5 rounded-full bg-sky-500"></span>
      )}
      <div className="absolute bottom-4 right-4 text-neutral-600 group-hover:text-neutral-300 transition-colors">
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
      color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      title: "Complete Your Profile",
      description: "Provide required details to get the most out of DrugWise.",
      buttonLabel: "Update Now",
      onAction: onUpdateProfile,
    },
    medicationCount === 0 && {
      id: "add-meds",
      Icon: Plus,
      color: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      title: "Add Your First Medication",
      description:
        "Start tracking your medications to get reminders and insights.",
      buttonLabel: "Add Medication",
      actionLink: "/dashboard/medication",
    },
  ].filter(Boolean);

  if (actions.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-white mb-3">Next Steps</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {actions.map((action: any) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              layout
              className={`flex items-start gap-4 p-4 rounded-xl border ${action.color}`}>
              <action.Icon size={24} className="flex-shrink-0 mt-1" />
              <div className="flex-grow">
                <h4 className="font-bold text-white">{action.title}</h4>
                <p className="text-sm text-neutral-400 mb-3">
                  {action.description}
                </p>
                <Link
                  to={action.actionLink}
                  onClick={action.onAction}
                  className="text-sm font-semibold bg-neutral-700/60 hover:bg-neutral-700 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap inline-flex items-center gap-2">
                  {action.buttonLabel} <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const ActivityFeed = ({ activities }: any) => (
  <div>
    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
      <ClipboardList size={20} />
      Recent Activity
    </h3>
    <div className="border border-neutral-800 rounded-xl">
      {activities.length > 0 ? (
        <div className="divide-y divide-neutral-800">
          {activities.map((item: any, index: number) => (
            <ActivityItem key={item.id} {...item} isFirst={index === 0} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-neutral-500 bg-neutral-900/20 rounded-xl">
          <p className="font-semibold text-lg">All caught up!</p>
          <p className="text-sm">
            New events from your medications and messages will appear here.
          </p>
        </div>
      )}
    </div>
  </div>
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
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: isFirst ? 0.2 : 0 }}
    className="p-4 hover:bg-neutral-800/50 transition-colors">
    <Link to={link} className="flex items-center gap-4">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${color.replace("text", "bg")}/10`}>
        <Icon size={20} className={color} />
      </div>
      <div className="flex-grow min-w-0">
        <p className="font-semibold text-white truncate flex items-center">
          {title}
          {isNew && (
            <span className="text-xs font-bold text-sky-400 border border-sky-400/50 bg-sky-500/10 px-2 py-0.5 rounded-full ml-2">
              NEW
            </span>
          )}
        </p>
        <p className="text-sm text-neutral-400 truncate">{description}</p>
      </div>
      <ArrowRight size={16} className="text-neutral-500 flex-shrink-0" />
    </Link>
  </motion.div>
);

const LoadingState = () => (
  <div className="min-h-screen  flex flex-col items-center justify-center text-neutral-400">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-10 h-10 border-4 border-neutral-800 border-t-sky-500 rounded-full mb-4"
    />
    <p className="text-lg font-medium">Loading Your Hub...</p>
  </div>
);

const ErrorState = () => (
  <div className="min-h-screen  flex flex-col items-center justify-center text-neutral-400 px-4">
    <AlertTriangle size={32} className="text-rose-500 mb-4" />
    <h2 className="text-xl font-bold text-white mb-1">
      Failed to Load Dashboard
    </h2>
    <p className="text-center">
      We couldn't retrieve your data. Please check your connection and try
      again.
    </p>
  </div>
);

export default DashboardPage;