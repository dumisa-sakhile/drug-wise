import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { auth, db } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  limit,
  updateDoc,
} from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  AlertCircle,
  Pill,
  MessageSquare,
  ClipboardList,
  CheckCircle,
  ShieldCheck,
  Calendar,
  Clock,
  PlusCircle,
  ArrowRight,
  User as UserIcon,
  Sparkles, // Added for "all tasks complete" UI
} from "lucide-react";
import EditProfileForm from "@/components/EditProfileForm";
import defaultMaleAvatar from "/male.jpg?url";
import defaultFemaleAvatar from "/female.jpg?url";
import OverviewCard from "@/components/OverviewCard";
import ActivitySummary from "@/components/ActivitySummary";
import TaskItem from "@/components/TaskItem";

// --- Interfaces ---
interface UserData {
  uid: string;
  email: string;
  gender: string;
  dob: Timestamp | null;
  name: string;
  surname: string;
  joinedAt: Timestamp;
  isAdmin: boolean;
  lastLogin: Timestamp | null;
  photoURL?: string;
}

interface MedicationType {
  id: string;
  medicationName: string;
  description: string;
  comment?: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: Timestamp;
  rejectionReason?: string;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
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

// --- Helper Components ---

// --- Route Definition ---
export const Route = createFileRoute("/dashboard/")({
  component: Profile,
});

// --- Main Profile Component ---
function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = Route.useNavigate();
  const controls = useAnimation();

  useEffect(() => {
    if (user?.uid) {
      controls.start({
        scale: [1, 1.05, 1],
        transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
      });
    }
  }, [controls, user?.uid]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate({ to: "/auth" });
        toast.error("You must be logged in to view your profile.");
      } else {
        setUser(currentUser);
        try {
          await updateDoc(doc(db, "users", currentUser.uid), {
            lastLogin: Timestamp.now(),
          });
        } catch (error) {
          toast.error("Failed to update last login.");
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Fetch user data
  const {
    data: userData,
    isLoading: isLoadingUserData,
    error: userDataError,
  } = useQuery<UserData | null>({
    queryKey: ["userData", user?.uid],
    queryFn: async () => {
      if (!user?.uid) {
        return null;
      }
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          return {} as UserData;
        }
        const firestoreData = userDoc.data() as UserData;
        return {
          ...firestoreData,
          photoURL: firestoreData.photoURL || undefined,
        };
      } catch (error) {
        toast.error("Failed to load user data.");
        return {} as UserData;
      }
    },
    enabled: !!user?.uid,
  });

  // Fetch medication count
  const { data: medicationCount = 0, error: medicationError } =
    useQuery<number>({
      queryKey: ["userMedicationCount", user?.uid],
      queryFn: async () => {
        if (!user?.uid) {
          return 0;
        }
        try {
          const q = query(
            collection(db, "medications"),
            where("userId", "==", user.uid)
          );
          const querySnapshot = await getDocs(q);
          return querySnapshot.size;
        } catch (error) {
          toast.error("Failed to load medications.");
          return 0;
        }
      },
      enabled: !!user?.uid,
    });

  // Fetch recent medications
  const { data: recentMedications = [], error: recentMedError } = useQuery<
    MedicationType[]
  >({
    queryKey: ["recentMedications", user?.uid],
    queryFn: async () => {
      if (!user?.uid) {
        return [];
      }
      try {
        const q = query(
          collection(db, "medications"),
          where("userId", "==", user.uid),
          limit(10)
        );
        const querySnapshot = await getDocs(q);
        const medications = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }) as MedicationType)
          .filter(
            (med) =>
              med.submittedAt && typeof med.submittedAt.toDate === "function"
          )
          .sort(
            (a, b) =>
              b.submittedAt.toDate().getTime() -
              a.submittedAt.toDate().getTime()
          )
          .slice(0, 3);
        return medications;
      } catch (error) {
        toast.error("Failed to load recent medications.");
        return [];
      }
    },
    enabled: !!user?.uid,
  });

  // Fetch total message count
  const { data: totalMessageCount = 0 } = useQuery<number>({
    queryKey: ["totalMessages", user?.uid],
    queryFn: async () => {
      if (!user?.uid) {
        return 0;
      }
      try {
        const q = query(
          collection(db, "messages"),
          where("recipientId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.size;
      } catch (error) {
        toast.error("Failed to load total messages.");
        return 0;
      }
    },
    enabled: !!user?.uid,
  });

  // Fetch unread message count
  const { data: unreadMessageCount = 0, error: messageError } =
    useQuery<number>({
      queryKey: ["userUnreadMessages", user?.uid],
      queryFn: async () => {
        if (!user?.uid) {
          return 0;
        }
        try {
          const q = query(
            collection(db, "messages"),
            where("recipientId", "==", user.uid),
            where("isRead", "==", false)
          );
          const querySnapshot = await getDocs(q);
          return querySnapshot.size;
        } catch (error) {
          toast.error("Failed to load messages.");
          return 0;
        }
      },
      enabled: !!user?.uid,
    });

  // Fetch unread messages
  const { data: unreadMessages = [], error: unreadMsgError } = useQuery<
    Message[]
  >({
    queryKey: ["unreadMessages", user?.uid],
    queryFn: async () => {
      if (!user?.uid) {
        return [];
      }
      try {
        const q = query(
          collection(db, "messages"),
          where("recipientId", "==", user.uid),
          where("isRead", "==", false),
          limit(10)
        );
        const querySnapshot = await getDocs(q);
        const messages = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }) as Message)
          .filter(
            (msg) => msg.sentAt && typeof msg.sentAt.toDate === "function"
          )
          .sort(
            (a, b) => b.sentAt.toDate().getTime() - a.sentAt.toDate().getTime()
          )
          .slice(0, 3);
        return messages;
      } catch (error) {
        toast.error("Failed to load unread messages.");
        return [];
      }
    },
    enabled: !!user?.uid,
  });

  const isProfileIncomplete =
    userData &&
    (!userData.gender || userData.name === "Anonymous" || !userData.surname);

  const getProfileImage = () => {
    if (user?.photoURL) {
      return user.photoURL;
    }
    if (userData?.photoURL) {
      return userData.photoURL;
    }
    return userData?.gender === "female"
      ? defaultFemaleAvatar
      : defaultMaleAvatar;
  };

  if (isLoadingUserData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="min-h-screen flex items-center justify-center  text-white roboto-condensed-light text-lg p-4">
        <div className="flex flex-col items-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-t-4 border-white/20 border-t-blue-500 rounded-full mb-4"
          />
          <span className="roboto-condensed-light">
            Loading your dashboard...
          </span>
        </div>
      </motion.div>
    );
  }

  if (
    userDataError ||
    medicationError ||
    recentMedError ||
    messageError ||
    unreadMsgError ||
    !user
  ) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="min-h-screen flex items-center justify-center bg-[#151312] text-white roboto-condensed-light text-lg p-4">
        <div className="flex flex-col items-center">
          <AlertCircle size={24} className="text-red-400 mb-4" />
          <span className="roboto-condensed-light">
            Error loading dashboard data or not authenticated. Please try again
            later.
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="min-h-screen w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-[#151312] text-white">
      <title>DrugWise - Dashboard</title>
      {/* Profile Header */}
      <div className="bg-[#1A1A1A] rounded-xl shadow-xl border border-white/10 p-6 md:p-8 mb-6 md:mb-8 flex flex-col md:flex-row items-center justify-between">
        <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left w-full md:w-auto">
          <div className="relative mb-4 md:mb-0">
            <motion.img
              src={getProfileImage()}
              alt="Profile"
              className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-3 border-blue-500 shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            />
            {/* Conditional User Status Badge */}
            <motion.span
              animate={controls}
              className={`absolute bottom-0 left-1/2 -translate-x-1/2 px-2.5 py-0.5 text-xs rounded-full shadow-lg border border-white/20 flex items-center gap-1.5 font-medium ${
                userData?.isAdmin
                  ? "bg-blue-600 text-white"
                  : isProfileIncomplete
                    ? "bg-red-600 text-white"
                    : "bg-lime-600 text-white"
              }`}>
              {userData?.isAdmin ? (
                <>
                  <ShieldCheck size={12} /> Admin
                </>
              ) : isProfileIncomplete ? (
                <>
                  <AlertCircle size={12} /> Incomplete
                </>
              ) : (
                <>
                  <CheckCircle size={12} /> Complete
                </>
              )}
            </motion.span>
          </div>
          <div className="flex-grow">
            <h1 className="text-3xl sm:text-4xl roboto-condensed-bold text-white mb-1">
              Hello, {userData?.name || "User"} {userData?.surname || ""}!
            </h1>
            <p className="text-base text-gray-400 roboto-condensed-light">
              {userData?.email || "No email available"}
            </p>
            <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-500 mt-2">
              <Calendar size={16} className="text-gray-500" />
              <span className="roboto-condensed-light">
                Joined{" "}
                {userData?.joinedAt
                  ? userData.joinedAt.toDate().toLocaleDateString("default", {
                      month: "long",
                      year: "numeric",
                    })
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
        <motion.div
          onClick={() => setModalOpen(true)}
          className="mt-6 md:mt-0 text-blue-400 roboto-condensed-bold text-base flex items-center justify-center cursor-pointer hover:text-blue-300 transition-colors duration-200"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}>
          Edit Profile
          <ArrowRight size={18} className="inline-block ml-2" />
        </motion.div>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 md:mb-8">
        <OverviewCard
          title="Medications"
          value={medicationCount}
          icon={<Pill size={24} className="text-red-400" />}
          description="Total medications recorded."
          link="/dashboard/medication"
          linkLabel="Manage Medications"
          color="bg-red-500/10"
        />
        <OverviewCard
          title="Messages"
          value={totalMessageCount}
          subValue={`${unreadMessageCount} unread`}
          icon={<MessageSquare size={24} className="text-blue-400" />}
          description="Total messages received."
          link="/dashboard/messages"
          linkLabel="View Messages"
          color="bg-blue-500/10"
        />
        <OverviewCard
          title="Profile Status"
          value=""
          icon={
            isProfileIncomplete ? (
              <AlertCircle size={24} className="text-red-600" />
            ) : (
              <CheckCircle size={24} className="text-lime-600" />
            )
          }
          description={
            isProfileIncomplete
              ? "Your profile requires attention."
              : "All essential details are filled."
          }
          onClick={() => setModalOpen(true)}
          linkLabel="Update Profile"
          color={isProfileIncomplete ? "bg-red-500/10" : "bg-lime-500/10"}
        />
      </div>

      {/* Activities and Tasks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities Section */}
        <div className="bg-[#1A1A1A] rounded-xl shadow-xl border border-white/10 p-6 md:p-8">
          <h2 className="text-2xl roboto-condensed-bold text-white mb-6 flex items-center gap-3">
            <Clock size={20} className="text-gray-400" /> Recent Activities
          </h2>
          <div className="space-y-3">
            {userData?.lastLogin && (
              <ActivitySummary
                title="Last Login"
                detail={userData.lastLogin.toDate().toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                link={undefined} // Explicitly remove link
                icon={<UserIcon size={16} className="text-gray-400" />}
              />
            )}
            {recentMedications.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="pt-3 border-t border-white/10">
                <h3 className="text-lg roboto-condensed-bold text-white mb-3 flex items-center gap-2">
                  <Pill size={16} className="text-red-400" /> Recent Medications
                  <span className="text-sm text-gray-500 roboto-condensed-light ml-auto">
                    ({recentMedications.length} of 3 shown)
                  </span>
                </h3>
                <div className="space-y-2">
                  {recentMedications.map((med) => (
                    <ActivitySummary
                      key={med.id}
                      icon={<Pill size={16} className="text-red-400" />}
                      title={med.medicationName}
                      detail={`Status: ${med.status} · Added ${
                        med.submittedAt?.toDate().toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        }) || "N/A"
                      }`}
                      link="/dashboard/medication"
                    />
                  ))}
                </div>
              </motion.div>
            )}
            {unreadMessages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 pt-3 border-t border-white/10">
                <h3 className="text-lg roboto-condensed-bold text-white mb-3 flex items-center gap-2">
                  <MessageSquare size={16} className="text-blue-400" /> Unread
                  Messages
                  <span className="text-sm text-gray-500 roboto-condensed-light ml-auto">
                    ({unreadMessages.length} of 3 shown)
                  </span>
                </h3>
                <div className="space-y-2">
                  {unreadMessages.map((msg) => (
                    <ActivitySummary
                      key={msg.id}
                      icon={
                        <MessageSquare size={16} className="text-blue-400" />
                      }
                      title={msg.subject}
                      detail={`From: ${msg.senderName} · Sent ${
                        msg.sentAt?.toDate().toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        }) || "N/A"
                      }`}
                      link="/dashboard/messages"
                      isNew={true}
                    />
                  ))}
                </div>
              </motion.div>
            )}
            {!userData?.lastLogin &&
              recentMedications.length === 0 &&
              unreadMessages.length === 0 && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-500 roboto-condensed-light text-base text-center py-4 rounded-lg bg-white/5 border border-white/10">
                  No recent activities to show. Your dashboard is ready!
                </motion.p>
              )}
          </div>
        </div>

        {/* Tasks Section */}
        <div className="bg-[#1A1A1A] rounded-xl shadow-xl border border-white/10 p-6 md:p-8">
          <h2 className="text-2xl roboto-condensed-bold text-white mb-6 flex items-center gap-3">
            <ClipboardList size={20} className="text-gray-400" /> Your Tasks
          </h2>
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {isProfileIncomplete && (
                <TaskItem
                  key="complete-profile"
                  icon={<AlertCircle size={20} className="text-red-600" />}
                  text="Complete your profile."
                  actionLabel="Update Profile"
                  actionOnClick={() => setModalOpen(true)}
                />
              )}
              {medicationCount === 0 && (
                <TaskItem
                  key="add-medication"
                  icon={<PlusCircle size={20} className="text-red-400" />}
                  text="Add your first medication."
                  actionLabel="Add Meds"
                  actionLink="/dashboard/medication"
                />
              )}
              {unreadMessageCount > 0 && (
                <TaskItem
                  key="unread-messages"
                  icon={<MessageSquare size={20} className="text-blue-400" />}
                  text={`You have ${unreadMessageCount} unread message${
                    unreadMessageCount !== 1 ? "s" : ""
                  }.`}
                  actionLabel="View Messages"
                  actionLink="/dashboard/messages"
                />
              )}
              {!isProfileIncomplete &&
                medicationCount > 0 &&
                unreadMessageCount === 0 && (
                  <motion.div
                    key="all-tasks-complete"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="flex flex-col items-center justify-center p-8 rounded-xl shadow-lg border border-white/10 bg-gradient-to-br from-green-700/20 to-green-900/10 text-center">
                    <div className="text-4xl sm:text-5xl mb-4">
                      <Sparkles size={48} className="text-green-400 mx-auto" />
                    </div>
                    <h3 className="text-xl sm:text-2xl roboto-condensed-bold text-white mb-2">
                      All Tasks Complete!
                    </h3>
                    <p className="text-gray-300 roboto-condensed-light text-base max-w-sm">
                      You're all caught up and your dashboard looks great. Keep
                      up the good work!
                    </p>
                  </motion.div>
                )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileForm
        isShowing={modalOpen}
        hide={() => setModalOpen(false)}
        user={user}
      />
    </motion.div>
  );
}