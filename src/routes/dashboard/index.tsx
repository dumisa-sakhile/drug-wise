import { createFileRoute, Link } from "@tanstack/react-router";
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
} from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import EditProfileForm from "@/components/EditProfileForm";
import defaultMaleAvatar from "/male.jpg?url";
import defaultFemaleAvatar from "/female.jpg?url";
import {
  AlertCircle,
  Edit,
  ArrowRight,
  Pill,
  MessageSquare,
  PlusCircle,
  ClipboardList,
} from "lucide-react";
import { toast } from "react-hot-toast";

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

export const Route = createFileRoute("/dashboard/")({
  component: Profile,
});

function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = Route.useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate({ to: "/auth" });
        toast.error("You must be logged in to view your profile.");
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const { data: userData, isLoading: isLoadingUserData } = useQuery<UserData>({
    queryKey: ["userData", user?.uid],
    queryFn: async () => {
      if (!user) return {} as UserData;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const firestoreData = userDoc.exists()
        ? (userDoc.data() as UserData)
        : ({} as UserData);
      return {
        ...firestoreData,
        photoURL: firestoreData.photoURL || undefined,
      };
    },
    enabled: !!user,
  });

  const { data: medicationCount = 0 } = useQuery<number>({
    queryKey: ["userMedicationCount", user?.uid],
    queryFn: async () => {
      if (!user) return 0;
      const q = query(
        collection(db, "medications"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    },
    enabled: !!user,
  });

  const { data: unreadMessageCount = 0 } = useQuery<number>({
    queryKey: ["userUnreadMessages", user?.uid],
    queryFn: async () => {
      if (!user) return 0;
      const q = query(
        collection(db, "messages"),
        where("recipientId", "==", user.uid),
        where("isRead", "==", false)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    },
    enabled: !!user,
  });

  const isProfileIncomplete =
    userData &&
    (!userData.gender || userData.name === "Anonymous" || !userData.surname);

  if (isLoadingUserData) {
    return (
      <div className="p-4 text-white roboto-condensed-light">
        Loading profile data...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 text-white roboto-condensed-light">
        Not authenticated.
      </div>
    );
  }

  // Determine avatar URL based on gender if photoURL missing
  const avatarUrl =
    userData?.photoURL ||
    (userData?.gender === "female" ? defaultFemaleAvatar : defaultMaleAvatar);

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl mb-6 font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Profile Card */}
        <div className="bg-[#1E1E1E] rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-4 mb-6">
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
            />
            <div>
              <h3 className="text-lg font-semibold">
                {userData?.name || "Anonymous"} {userData?.surname || ""}
              </h3>
              <p className="text-sm text-gray-400">{userData?.email}</p>
            </div>
          </div>

          {isProfileIncomplete && (
            <div className="bg-yellow-100 p-3 rounded mb-4 flex items-center gap-2 text-yellow-800">
              <AlertCircle size={16} />
              <span>Your profile is incomplete</span>
            </div>
          )}

          <button
            onClick={() => setModalOpen(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2 font-semibold transition-colors duration-200">
            <Edit size={16} /> Edit Profile
          </button>

          {userData?.isAdmin && (
            <Link
              to="/dashboard/admin"
              className="mt-3 text-blue-400 hover:text-blue-300 text-sm flex items-center justify-center gap-1">
              Admin Portal <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {/* Medications Count Card */}
        <div className="bg-[#1E1E1E] rounded-lg p-6 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Pill size={18} /> Medications
            </h3>
            <Link
              to="/dashboard/medication"
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold mb-2">{medicationCount}</span>
            <p className="text-gray-400">Total medications</p>
          </div>
        </div>

        {/* Messages Count Card */}
        <div className="bg-[#1E1E1E] rounded-lg p-6 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare size={18} /> Messages
              {unreadMessageCount > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {unreadMessageCount}
                </span>
              )}
            </h3>
            <Link
              to="/dashboard/messages"
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold mb-2">{unreadMessageCount}</span>
            <p className="text-gray-400">Unread messages</p>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="bg-[#1E1E1E] rounded-lg p-6 shadow-lg mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ClipboardList size={20} /> Tasks
        </h3>
        {medicationCount === 0 && (
          <div className="flex items-center gap-2 text-red-500">
            <PlusCircle size={20} />
            <div>
              <p className="font-semibold">No medications submitted.</p>
              <Link
                to="/dashboard/medication"
                className="text-lime-600 hover:text-lime-500 text-sm">
                Submit Medication
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity Section */}
      <div className="bg-[#1E1E1E] rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        {medicationCount > 0 || unreadMessageCount > 0 ? (
          <>
            <div className="mb-4">
              <p className="text-gray-400">
                You have {medicationCount} medications recorded.
              </p>
              <Link
                to="/dashboard/medication"
                className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                View Medication Summary <ArrowRight size={14} />
              </Link>
            </div>
            <div>
              <p className="text-gray-400">
                You have {unreadMessageCount} unread messages.
              </p>
              <Link
                to="/dashboard/messages"
                className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                View Message Summary <ArrowRight size={14} />
              </Link>
            </div>
          </>
        ) : (
          <p className="text-gray-400">No recent activity to display</p>
        )}
      </div>

      <EditProfileForm
        isShowing={modalOpen}
        hide={() => setModalOpen(false)}
        user={user}
      />
    </div>
  );
}

export default Profile;