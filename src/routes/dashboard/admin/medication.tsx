import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { auth, db } from "@/config/firebase";
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  addDoc,
  deleteField,
} from "firebase/firestore";
import { del } from "@vercel/blob";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import SearchFilterBar from "@/components/admin/adminMedication/SearchFilterBar";
import MedicationTable from "@/components/admin/adminMedication/MedicationTable";
import PaginationControls from "@/components/admin/adminMedication/PaginationControls";
import MedicationDetailsModal from "@/components/admin/adminMedication/MedicationDetailsModal";
import AdminActionModal from "@/components/admin/adminMedication/AdminActionModal";
import ImagePreviewModal from "@/components/admin/adminMedication/ImagePreviewModal";
import AdminMedicationSkeleton from "@/components/admin/adminMedication/AdminMedicationSkeleton";

export const Route = createFileRoute("/dashboard/admin/medication")({
  component: AdminMedication,
});

interface MedicationType {
  id: string;
  medicationName: string;
  description: string;
  comment?: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: any;
  rejectionReason?: string;
  reviewedAt?: any;
  reviewedBy?: string;
  reviewerName?: string;
  file?: {
    url: string;
    name: string;
    type: string;
    uploadedAt: string;
    size: number;
  };
}

interface User {
  id: string;
  uid: string;
  name: string;
  surname: string;
  email: string;
  isAdmin: boolean;
}

interface ModalState {
  type: "details" | "adminAction" | null;
  medication?: MedicationType | null;
  adminStatus?: "approved" | "rejected";
  rejectionReason?: string;
}

function AdminMedication() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState>({ type: null });
  const [search, setSearch] = useState<string>("");
  const [status, setStatus] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [rowsPerPage, setRowsPerPage] = useState<number>(15);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isImageExpanded, setIsImageExpanded] = useState<boolean>(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user?.uid ?? null);
    });
    return () => unsubscribe();
  }, []);

  const { data: users = {}, isLoading: isUsersLoading } = useQuery<
    Record<string, User>
  >({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const q = query(collection(db, "users"));
      const snap = await getDocs(q);
      const arr = snap.docs.map((doc) => ({
        id: doc.id,
        uid: doc.data().uid ?? doc.id,
        name: doc.data().name ?? "Unknown",
        surname: doc.data().surname ?? "",
        email: doc.data().email ?? "",
        isAdmin: doc.data().isAdmin ?? false,
      })) as User[];
      const map: Record<string, User> = {};
      arr.forEach((u) => {
        map[u.uid] = u;
      });
      return map;
    },
    enabled: !!currentUser,
  });

  const { data: medications = [], isLoading: isMedsLoading } = useQuery<
    MedicationType[]
  >({
    queryKey: ["allMedications"],
    queryFn: async () => {
      if (!currentUser) return [];
      const medsRef = collection(db, "medications");
      const q = query(medsRef);
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<MedicationType, "id">),
      }));
    },
    enabled: !!currentUser,
    initialData: [],
    placeholderData: keepPreviousData,
  });

  const filteredMedications = useMemo(() => {
    let result = medications;
    if (status !== "all") {
      result = result.filter((m) => m.status === status);
    }
    if (search.trim() && !isUsersLoading) {
      const searchLower = search.toLowerCase().trim();
      result = result.filter((m) => {
        const user = users[m.userId];
        return (
          m.medicationName.toLowerCase().includes(searchLower) ||
          m.description.toLowerCase().includes(searchLower) ||
          (user &&
            (user.name.toLowerCase().includes(searchLower) ||
              user.surname.toLowerCase().includes(searchLower) ||
              user.email.toLowerCase().includes(searchLower)))
        );
      });
    }
    return result;
  }, [medications, status, search, users, isUsersLoading]);

  const paginatedMedications = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredMedications.slice(start, start + rowsPerPage);
  }, [filteredMedications, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredMedications.length / rowsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, status, rowsPerPage]);

  const { mutate: updateMedication, isPending: isUpdating } = useMutation({
    mutationFn: async ({
      medId,
      data,
    }: {
      medId: string;
      data: Partial<MedicationType>;
    }) => {
      if (!currentUser) throw new Error("Not authenticated");
      const medRef = doc(db, "medications", medId);
      const medSnap = await getDoc(medRef);
      if (!medSnap.exists()) {
        throw new Error("Medication not found");
      }
      const trimmedRejectionReason = data.rejectionReason?.trim();
      const updateData: any = {
        status: data.status,
        reviewedAt: serverTimestamp(),
        reviewedBy: auth.currentUser?.uid ?? "",
        reviewerName: auth.currentUser?.displayName ?? "Admin",
      };
      if (data.status === "rejected") {
        if (!trimmedRejectionReason) {
          throw new Error("Rejection reason is required and cannot be empty");
        }
        updateData.rejectionReason = trimmedRejectionReason;
      } else {
        updateData.rejectionReason = deleteField();
      }
      await updateDoc(medRef, updateData);

      // Send notification
      const userId = medSnap.data().userId;
      const userSnap = await getDoc(doc(db, "users", userId));
      if (!userSnap.exists()) {
        throw new Error("User not found");
      }
      const userEmail = userSnap.data().email;
      const content =
        data.status === "approved"
          ? `Your medication "${medSnap.data().medicationName}" has been approved.`
          : `Your medication "${medSnap.data().medicationName}" has been rejected. Reason: ${trimmedRejectionReason}`;

      await addDoc(collection(db, "messages"), {
        senderId: currentUser,
        senderName: "DrugWise Team",
        recipientId: userId,
        content: content,
        sentAt: serverTimestamp(),
        isRead: false,
        subject: `Medication ${data.status === "approved" ? "Approved" : "Rejected"}`,
        isWelcomeMessage: false,
      });

      return { userEmail, content };
    },
    onSuccess: ({ userEmail, content }) => {
      toast.success(
        `Medication ${modalState.adminStatus} and notification sent to ${userEmail}: ${content}`
      );
      setModalState({ type: null });
      queryClient.invalidateQueries({ queryKey: ["allMedications"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update medication");
    },
  });

  const { mutate: revertMedication, isPending: isReverting } = useMutation({
    mutationFn: async (medId: string) => {
      if (!currentUser) throw new Error("Not authenticated");
      const medRef = doc(db, "medications", medId);
      const medSnap = await getDoc(medRef);
      if (!medSnap.exists()) {
        throw new Error("Medication not found");
      }
      await updateDoc(medRef, {
        status: "pending",
        reviewedAt: deleteField(),
        reviewedBy: deleteField(),
        reviewerName: deleteField(),
        rejectionReason: deleteField(),
      });

      // Send notification
      const userId = medSnap.data().userId;
      const userSnap = await getDoc(doc(db, "users", userId));
      if (!userSnap.exists()) {
        throw new Error("User not found");
      }
      const userEmail = userSnap.data().email;
      const content = `Your medication "${medSnap.data().medicationName}" has been reverted to pending for further review.`;

      await addDoc(collection(db, "messages"), {
        senderId: currentUser,
        senderName: "DrugWise Team",
        recipientId: userId,
        content,
        sentAt: serverTimestamp(),
        isRead: false,
        subject: "Medication Reverted to Pending",
        isWelcomeMessage: false,
      });

      return { userEmail, content };
    },
    onSuccess: ({ userEmail, content }) => {
      toast.success(
        `Medication reverted to pending and notification sent to ${userEmail}: ${content}`
      );
      setModalState({ type: null });
      queryClient.invalidateQueries({ queryKey: ["allMedications"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to revert medication");
    },
  });

  const { mutate: deleteMedication, isPending: isDeleting } = useMutation({
    mutationFn: async (medId: string) => {
      if (!currentUser) throw new Error("Not authenticated");
      const medRef = doc(db, "medications", medId);
      const medSnap = await getDoc(medRef);
      if (!medSnap.exists()) {
        throw new Error("Medication not found");
      }
      const fileUrl = medSnap.data()?.file?.url;

      // Send notification
      const userId = medSnap.data().userId;
      const userSnap = await getDoc(doc(db, "users", userId));
      if (!userSnap.exists()) {
        throw new Error("User not found");
      }
      const userEmail = userSnap.data().email;
      const content = `Your medication "${medSnap.data().medicationName}" has been deleted by an admin.`;

      await addDoc(collection(db, "messages"), {
        senderId: currentUser,
        senderName: "DrugWise Team",
        recipientId: userId,
        content,
        sentAt: serverTimestamp(),
        isRead: false,
        subject: "Medication Deleted",
        isWelcomeMessage: false,
      });

      // Perform Firestore deletion
      await deleteDoc(medRef);

      // Non-blocking Blob deletion
      if (fileUrl) {
        del(fileUrl, {
          token: import.meta.env.VITE_BLOB_READ_WRITE_TOKEN,
        }).catch((error: any) => {
          console.error(
            `Failed to delete Blob file: ${error.message || "Unknown error"}`
          );
        });
      }

      return { userEmail, content };
    },
    onSuccess: ({ userEmail, content }) => {
      toast.success(
        `Medication deleted and notification sent to ${userEmail}: ${content}`
      );
      setModalState({ type: null });
      queryClient.invalidateQueries({ queryKey: ["allMedications"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete medication");
    },
  });

  const handleAdminAction = (rejectionReason?: string) => {
    if (!modalState.medication?.id || !modalState.adminStatus) return;
    if (modalState.adminStatus === "rejected" && !rejectionReason?.trim()) {
      toast.error(
        "Please provide a valid rejection reason (cannot be empty or just spaces)"
      );
      return;
    }
    updateMedication({
      medId: modalState.medication.id,
      data: {
        status: modalState.adminStatus,
        rejectionReason,
      },
    });
  };

  const handleBack = () => {
    window.history.back();
  };

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
        <title>DrugWise - Admin Medication Reviews</title>
        <motion.h1
          className="text-3xl font-semibold mb-8 text-left bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}>
          Medication Reviews
        </motion.h1>
        <motion.p
          className="text-gray-400 mb-8 font-light"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}>
          Review and manage user-submitted medications.
        </motion.p>

        {isMedsLoading || isUsersLoading ? (
          <AdminMedicationSkeleton />
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900 shadow-inner">
              <section className="max-w-full mx-auto">
                <SearchFilterBar
                  search={search}
                  setSearch={(value) => {
                    setSearch(value);
                    setStatus("all");
                  }}
                  status={status}
                  setStatus={setStatus}
                  totalMedications={filteredMedications.length}
                />
                <MedicationTable
                  medications={paginatedMedications}
                  users={users}
                  onRowClick={(medication) =>
                    setModalState({ type: "details", medication })
                  }
                />
              </section>
            </div>

            {filteredMedications.length > 0 && (
              <PaginationControls
                rowsPerPage={rowsPerPage}
                setRowsPerPage={setRowsPerPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
              />
            )}
          </>
        )}

        {modalState.type === "details" && modalState.medication && (
          <MedicationDetailsModal
            medication={modalState.medication}
            users={users}
            isReverting={isReverting}
            isDeleting={isDeleting}
            onClose={() => {
              setModalState({ type: null });
              setIsImageExpanded(false);
            }}
            onApprove={() =>
              setModalState({
                type: "adminAction",
                medication: modalState.medication,
                adminStatus: "approved",
              })
            }
            onReject={() =>
              setModalState({
                type: "adminAction",
                medication: modalState.medication,
                adminStatus: "rejected",
              })
            }
            onRevert={() => revertMedication(modalState.medication!.id)}
            onDelete={() => deleteMedication(modalState.medication!.id)}
            onImageClick={() => setIsImageExpanded(true)}
          />
        )}

        {modalState.type === "adminAction" && modalState.medication && (
          <AdminActionModal
            adminStatus={modalState.adminStatus!}
            isUpdating={isUpdating}
            rejectionReason={modalState.rejectionReason}
            onConfirm={handleAdminAction}
            onCancel={() => setModalState({ type: null })}
            onRejectionReasonChange={(reason) =>
              setModalState({ ...modalState, rejectionReason: reason })
            }
          />
        )}

        {isImageExpanded && modalState.medication?.file && (
          <ImagePreviewModal
            imageUrl={modalState.medication.file.url}
            imageName={modalState.medication.file.name}
            onClose={() => setIsImageExpanded(false)}
          />
        )}
      </motion.div>
    </>
  );
}

export default AdminMedication;
