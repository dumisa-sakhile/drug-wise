// src/routes/dashboard/index.tsx

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
import { toast } from "react-hot-toast";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  ClipboardCheck,
  MessageSquare,
  Pill,
  PlusCircle,
  User as UserIcon,
  Edit,
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
    if (userData?.lastLogin) {
      items.push({
        type: "activity",
        id: "last-login",
        date: userData.lastLogin?.toDate(),
        content: {
          icon: <UserIcon size={16} className="text-neutral-500" />,
          title: "Logged In",
          detail: `Last login at ${userData.lastLogin?.toDate().toLocaleString()}`,
        },
      });
    }
    (medications || []).forEach((med: Medication) =>
      items.push({
        type: "activity",
        id: med.id,
        date: med.submittedAt?.toDate(),
        content: {
          icon: <Pill size={16} className="text-red-400" />,
          title: `Medication Added: ${med.medicationName}`,
          detail: `Status: ${med.status.charAt(0).toUpperCase() + med.status.slice(1)}`,
          link: "/dashboard/medication",
        },
      })
    );
    (messages || []).forEach((msg: Message) =>
      items.push({
        type: "activity",
        id: msg.id,
        date: msg.sentAt?.toDate(),
        content: {
          icon: <MessageSquare size={16} className="text-blue-400" />,
          title: `New Message: ${msg.subject}`,
          detail: `From: ${msg.senderName}`,
          link: "/dashboard/messages",
          isNew: !msg.isRead,
        },
      })
    );
    return items.sort((a, b) => b.date?.getTime() - a.date?.getTime());
  }, [userData, medications, messages]);

  const unreadMessageCount = useMemo(
    () => (messages || []).filter((msg: Message) => !msg.isRead).length,
    [messages]
  );

  return {
    userData,
    medicationCount: medications?.length ?? 0,
    totalMessageCount: messages?.length ?? 0,
    unreadMessageCount,
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
        toast.error("You must be logged in.");
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
    totalMessageCount,
    unreadMessageCount,
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

  if (isLoading && !userData) {
    return <LoadingState message="Loading your dashboard..." />;
  }

  if (error || !user) {
    return <ErrorState message="Could not load dashboard data." />;
  }

  return (
    <>
      <title>DrugWise - Dashboard</title>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="roboto-condensed-light min-h-screen w-full max-w-5xl mx-auto py-8 md:px-4 sm:px-6">
        <DashboardHeader
          user={userData}
          profileImage={profileImage}
          onEditProfile={() => setModalOpen(true)}
        />

        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-6">
          <StatCard
            title="Medications"
            value={medicationCount}
            icon={<Pill size={22} className="text-red-400" />}
            link="/dashboard/medication"
          />
          <StatCard
            title="Messages"
            value={totalMessageCount}
            subValue={`${unreadMessageCount} unread`}
            icon={<MessageSquare size={22} className="text-blue-400" />}
            link="/dashboard/messages"
          />
          <StatCard
            title="Profile Status"
            value={isProfileIncomplete ? "Incomplete" : "Complete"}
            icon={
              isProfileIncomplete ? (
                <AlertCircle size={22} className="text-yellow-400" />
              ) : (
                <CheckCircle size={22} className="text-green-400" />
              )
            }
            onClick={() => setModalOpen(true)}
          />
        </div>

        <Timeline
          isProfileIncomplete={isProfileIncomplete}
          medicationCount={medicationCount}
          unreadMessageCount={unreadMessageCount}
          activities={timelineItems}
          onUpdateProfile={() => setModalOpen(true)}
        />
      </motion.div>

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
  <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full mb-4">
    <div className="flex items-center gap-4 w-full">
      <motion.img
        src={profileImage}
        alt="Profile"
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-neutral-700"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring" }}
      />
      <div className="flex flex-col min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">
          Hello, {user?.name || "User"}!
        </h1>
        <p className="text-neutral-400 text-xs sm:text-sm mt-1 break-all">
          {user?.email || "No email"}
        </p>
      </div>
    </div>
    {/* Edit Profile Button - Mobile vs Desktop */}
    <button
      onClick={onEditProfile}
      className="hidden sm:flex items-center gap-2 text-xs sm:text-sm text-neutral-300 bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 px-3 py-2 rounded-lg transition-colors min-w-[140px] w-full sm:w-auto">
      Edit Profile <ArrowRight size={16} />
    </button>
    {/* Mobile-only Edit Icon Button */}
    <button
      onClick={onEditProfile}
      className="sm:hidden p-2 rounded-full text-neutral-300 bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 transition-colors self-end"
      aria-label="Edit Profile">
      <Edit size={20} />
    </button>
  </header>
);

const StatCard = ({ title, value, subValue, icon, link, onClick }: any) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="bg-neutral-900/80 border border-neutral-800 p-4 rounded-xl transition-all w-full min-w-0 flex flex-col justify-between">
    <div className="flex items-center justify-between text-neutral-400 mb-1">
      <span className="text-xs sm:text-sm font-medium">{title}</span>
      {icon}
    </div>
    {/* Hide value and subValue on mobile */}
    <p className="hidden sm:block text-2xl sm:text-3xl font-bold text-white mb-1">{value}</p>
    {subValue && (
      <p className="hidden sm:block text-xs sm:text-sm text-neutral-500 mt-1">{subValue}</p>
    )}
    {(link || onClick) && (
      <Link
        to={link}
        onClick={onClick}
        className="text-xs sm:text-sm text-blue-400 hover:text-blue-300 mt-3  cursor-pointer flex items-center gap-1">
        {link ? "View All" : "Update"} <ArrowRight size={14} />
      </Link>
    )}
  </motion.div>
);

const Timeline = ({
  isProfileIncomplete,
  medicationCount,
  unreadMessageCount,
  activities,
  onUpdateProfile,
}: any) => {
  const tasks = [
    isProfileIncomplete && {
      id: "task-profile",
      icon: <AlertCircle size={18} className="text-yellow-400" />,
      text: "Your profile information is incomplete.",
      actionLabel: "Update Profile",
      onAction: onUpdateProfile,
      borderColor: "border-yellow-400",
    },
    medicationCount === 0 && {
      id: "task-meds",
      icon: <PlusCircle size={18} className="text-red-400" />,
      text: "You haven't added any medications yet.",
      actionLabel: "Add Medication",
      actionLink: "/dashboard/medication",
      borderColor: "border-red-400",
    },
    unreadMessageCount > 0 && {
      id: "task-messages",
      icon: <MessageSquare size={18} className="text-blue-400" />,
      text: `You have ${unreadMessageCount} unread message(s).`,
      actionLabel: "View Messages",
      actionLink: "/dashboard/messages",
      borderColor: "border-blue-400",
    },
  ].filter(Boolean);

  const hasTasks = tasks.length > 0;
  const hasActivities = activities.length > 0;

  return (
    <div className="bg-neutral-900/80 border border-neutral-800 p-4 sm:p-6 rounded-xl w-full mt-2">
      <h2 className="font-bold text-white flex items-center gap-2 mb-4 text-lg sm:text-xl">
        <ClipboardCheck size={18} /> Timeline
      </h2>
      <div className="space-y-4">
        <AnimatePresence>
          {tasks.map((task) => (
            <TimelineItem key={task.id} {...task} isTask />
          ))}
        </AnimatePresence>

        {!hasTasks && !hasActivities && (
          <div className="text-center py-6 text-neutral-500">
            <p className="font-semibold">All caught up!</p>
            <p className="text-xs sm:text-sm">No new tasks or activities.</p>
          </div>
        )}

        {hasActivities && hasTasks && (
          <hr className="border-neutral-800 my-6" />
        )}

        <div className="space-y-2">
          {activities.map((activity: any) => (
            <TimelineItem key={activity.id} {...activity.content} />
          ))}
        </div>
      </div>
    </div>
  );
};

const TimelineItem = ({
  icon,
  title,
  detail,
  text,
  link,
  onAction,
  actionLabel,
  actionLink,
  isNew,
  isTask,
  borderColor,
}: any) => {
  const baseClasses = "flex items-center justify-between gap-2 py-2";
  const taskClasses = isTask ? `relative pl-3 border-l-2 ${borderColor}` : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={`${baseClasses} ${taskClasses}`}
      layout>
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex-shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-neutral-200 font-medium flex items-center gap-2 truncate">
            {title || text}
            {isNew && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">
                New
              </span>
            )}
          </p>
          {detail && (
            <p className="text-xs text-neutral-400 break-all">{detail}</p>
          )}
        </div>
      </div>

      {isTask ? (
        <Link
          to={actionLink}
          onClick={onAction}
          className="flex-shrink-0 text-xs sm:text-sm font-semibold text-neutral-100 bg-neutral-700/50 hover:bg-neutral-700 border border-neutral-600 px-2 py-1.5 rounded-md cursor-pointer transition-colors whitespace-nowrap">
          {actionLabel}
        </Link>
      ) : (
        link && (
          <Link
            to={link}
            className="text-xs sm:text-sm text-blue-400 hover:text-blue-300 flex-shrink-0">
            <ArrowRight size={16} />
          </Link>
        )
      )}
    </motion.div>
  );
};

const LoadingState = ({ message }: { message: string }) => (
  <div className="min-h-screen flex flex-col items-center justify-center text-neutral-400 md:px-4">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-8 h-8 border-2 border-neutral-600 border-t-blue-500 rounded-full mb-4"
    />
    <span className="text-center text-sm">{message}</span>
  </div>
);

const ErrorState = ({ message }: { message: string }) => (
  <div className="min-h-screen flex flex-col items-center justify-center text-neutral-400 px-4">
    <AlertCircle size={24} className="text-red-500 mb-3" />
    <p className="text-center">{message}</p>
    <p className="text-xs text-neutral-500 text-center">
      Please try again later.
    </p>
  </div>
);

export default DashboardPage;