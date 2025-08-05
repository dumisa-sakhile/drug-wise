import { motion, AnimatePresence } from "framer-motion";
import { X, Copy } from "lucide-react";
import { toast } from "react-hot-toast";
import { Timestamp } from "firebase/firestore";
import type { UserData } from "./types";
import type { UseMutationResult } from "@tanstack/react-query";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser: UserData | null;
  editedUser: Partial<UserData>;
  setEditedUser: (user: Partial<UserData>) => void;
  validationErrors: {
    name?: string;
    surname?: string;
    gender?: string;
    dob?: string;
  };
  updateMutation: UseMutationResult<
    void,
    Error,
    Partial<UserData> & { uid: string },
    unknown
  >;
}

function UserModal({
  isOpen,
  onClose,
  selectedUser,
  editedUser,
  setEditedUser,
  validationErrors,
  updateMutation,
}: UserModalProps) {
  if (!isOpen || !selectedUser) return null;

  const formatDate = (timestamp: Timestamp | null) =>
    timestamp ? timestamp.toDate().toLocaleDateString("en-ZA") : "-";

  const formatDateForInput = (dob: Timestamp | null): string =>
    dob ? dob.toDate().toISOString().split("T")[0] : "";

  const hasChanges =
    editedUser.name !== selectedUser.name ||
    editedUser.surname !== selectedUser.surname ||
    editedUser.gender !== selectedUser.gender ||
    (editedUser.dob &&
      selectedUser.dob &&
      formatDateForInput(editedUser.dob as Timestamp) !==
        formatDateForInput(selectedUser.dob)) ||
    (!editedUser.dob && selectedUser.dob) ||
    (editedUser.dob && !selectedUser.dob);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard
      .writeText(email)
      .then(() => toast.success("Email copied to clipboard!"))
      .catch((err) => {
        toast.error("Failed to copy email.");
        console.error("Copy failed:", err);
      });
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}>
      <motion.div
        className="relative w-full max-w-md bg-neutral-800 rounded-2xl shadow-lg p-6 md:p-8 overflow-auto max-h-[85vh] border border-neutral-700"
        initial={{ y: 50, opacity: 0 }}
        animate={{
          y: 0,
          opacity: 1,
          transition: { type: "spring", stiffness: 100, damping: 15 },
        }}
        exit={{ y: 50, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}>
        <button
          className="absolute top-2 right-2 text-neutral-400 hover:text-white text-3xl font-light p-2 rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors duration-200"
          onClick={onClose}
          aria-label="Close">
          <X />
        </button>
        <motion.h3 className="text-2xl font-bold mb-6 text-center sm:text-left bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">
          Edit User Profile
        </motion.h3>
        {Object.keys(validationErrors).length > 0 && (
          <motion.div
            className="text-red-400 text-sm mb-5 p-3 rounded-xl bg-red-900/20 backdrop-blur-sm border border-red-900/30 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}>
            Please fix the validation errors.
          </motion.div>
        )}
        <motion.form
          onSubmit={(e) => e.preventDefault()}
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}>
          <label className="block">
            <span className="text-neutral-200 font-semibold mb-2 block">
              Name <span className="text-red-400">*</span>
            </span>
            <input
              type="text"
              value={editedUser.name ?? selectedUser.name}
              onChange={(e) =>
                setEditedUser({ ...editedUser, name: e.target.value })
              }
              className="w-full rounded-xl bg-neutral-800/50 text-white px-4 py-3 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-light"
              placeholder="Enter name"
              aria-invalid={!!validationErrors.name}
              aria-describedby="name-error"
            />
            <AnimatePresence>
              {validationErrors.name && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-red-400 text-sm mt-1"
                  id="name-error">
                  {validationErrors.name}
                </motion.p>
              )}
            </AnimatePresence>
          </label>
          <label className="block">
            <span className="text-neutral-200 font-semibold mb-2 block">
              Surname <span className="text-red-400">*</span>
            </span>
            <input
              type="text"
              value={editedUser.surname ?? selectedUser.surname}
              onChange={(e) =>
                setEditedUser({ ...editedUser, surname: e.target.value })
              }
              className="w-full rounded-xl bg-neutral-800/50 text-white px-4 py-3 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-light"
              placeholder="Enter surname"
              aria-invalid={!!validationErrors.surname}
              aria-describedby="surname-error"
            />
            <AnimatePresence>
              {validationErrors.surname && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-red-400 text-sm mt-1"
                  id="surname-error">
                  {validationErrors.surname}
                </motion.p>
              )}
            </AnimatePresence>
          </label>
          <label className="block">
            <span className="text-neutral-200 font-semibold mb-2 block">
              Email <span className="text-red-400">*</span>
            </span>
            <div className="relative">
              <input
                type="email"
                value={selectedUser.email}
                readOnly
                className="w-full rounded-xl bg-neutral-800/50 text-white px-4 py-3 border border-neutral-600 focus:outline-none font-light"
              />
              <button
                type="button"
                onClick={() => handleCopyEmail(selectedUser.email)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors duration-200"
                aria-label="Copy email">
                <Copy size={18} />
              </button>
            </div>
          </label>
          <label className="block">
            <span className="text-neutral-200 font-semibold mb-2 block">
              Gender <span className="text-red-400">*</span>
            </span>
            <select
              value={editedUser.gender ?? selectedUser.gender}
              onChange={(e) =>
                setEditedUser({ ...editedUser, gender: e.target.value })
              }
              className="w-full rounded-xl bg-neutral-800/50 text-white px-4 py-3 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-light"
              aria-invalid={!!validationErrors.gender}
              aria-describedby="gender-error">
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <AnimatePresence>
              {validationErrors.gender && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-red-400 text-sm mt-1"
                  id="gender-error">
                  {validationErrors.gender}
                </motion.p>
              )}
            </AnimatePresence>
          </label>
          <label className="block">
            <span className="text-neutral-200 font-semibold mb-2 block">
              Date of Birth <span className="text-red-400">*</span>
            </span>
            <input
              type="date"
              value={formatDateForInput(editedUser.dob ?? selectedUser.dob)}
              onChange={(e) =>
                setEditedUser({
                  ...editedUser,
                  dob: e.target.value
                    ? Timestamp.fromDate(new Date(e.target.value))
                    : null,
                })
              }
              className="w-full rounded-xl bg-neutral-800/50 text-white px-4 py-3 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-light"
              aria-invalid={!!validationErrors.dob}
              aria-describedby="dob-error"
            />
            <AnimatePresence>
              {validationErrors.dob && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-red-400 text-sm mt-1"
                  id="dob-error">
                  {validationErrors.dob}
                </motion.p>
              )}
            </AnimatePresence>
          </label>
          <label className="block">
            <span className="text-neutral-200 font-semibold mb-2 block">
              Joined At <span className="text-red-400">*</span>
            </span>
            <input
              type="text"
              value={formatDate(selectedUser.joinedAt)}
              readOnly
              className="w-full rounded-xl bg-neutral-800/50 text-white px-4 py-3 border border-neutral-600 focus:outline-none font-light"
            />
          </label>
          <label className="block">
            <span className="text-neutral-200 font-semibold mb-2 block">
              Admin Status <span className="text-red-400">*</span>
            </span>
            <input
              type="text"
              value={selectedUser.isAdmin ? "Admin" : "User"}
              readOnly
              className="w-full rounded-xl bg-neutral-800/50 text-white px-4 py-3 border border-neutral-600 focus:outline-none font-light"
            />
          </label>
          <motion.div
            className="flex justify-end gap-3 mt-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } },
            }}>
            <motion.button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-500/10 text-neutral-400 border-neutral-500/20 hover:bg-neutral-700 transition-colors duration-200 font-light"
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1 },
              }}>
              Cancel
            </motion.button>
            <motion.button
              type="button"
              disabled={!hasChanges || updateMutation.isPending}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-lime-500 text-white transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed hover:from-green-600 hover:to-lime-600 font-light"
              onClick={() =>
                updateMutation.mutate({ ...editedUser, uid: selectedUser.uid })
              }
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1 },
              }}>
              {updateMutation.isPending ? "Saving..." : "Save"}
            </motion.button>
          </motion.div>
        </motion.form>
      </motion.div>
    </motion.div>
  );
}

export default UserModal;
