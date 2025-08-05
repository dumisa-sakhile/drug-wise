import { motion, AnimatePresence } from "framer-motion";
import { Copy } from "lucide-react";
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}>
      <motion.div
        className="relative w-full max-w-md bg-[#1C1C1E] text-white rounded-2xl shadow-xl p-6 md:p-8 animate-slide-up"
        initial={{ y: 50, opacity: 0 }}
        animate={{
          y: 0,
          opacity: 1,
          transition: { type: "spring", stiffness: 100, damping: 15 },
        }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}>
        <motion.button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30 rounded-full"
          initial={{ opacity: 0, rotate: -90 }}
          animate={{ opacity: 1, rotate: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          aria-label="Close">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </motion.button>

        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}>
          <motion.h2
            className="text-2xl max-sm:text-xl font-semibold mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}>
            Edit User Details
          </motion.h2>
          <motion.p
            className="text-sm text-gray-400 mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}>
            Update user details below.
          </motion.p>
        </motion.div>

        {Object.keys(validationErrors).length > 0 && (
          <motion.div
            className="text-red-300 text-sm font-medium mb-5 p-3 rounded-md bg-[rgba(255,75,75,0.15)] backdrop-blur-sm border border-[rgba(255,75,75,0.25)] text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}>
            Please fix the validation errors.
          </motion.div>
        )}

        <motion.form
          onSubmit={(e) => e.preventDefault()}
          className="space-y-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } },
            }}>
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ delay: 0.7, duration: 0.4 }}>
              <label
                htmlFor="name"
                className="text-sm text-gray-300 block mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={editedUser.name ?? selectedUser.name}
                onChange={(e) =>
                  setEditedUser({ ...editedUser, name: e.target.value })
                }
                placeholder="Enter name"
                className="w-full rounded-lg bg-[#2A2A2D] text-white px-4 py-3 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                required
                aria-invalid={!!validationErrors.name}
                aria-describedby="name-error"
              />
              <AnimatePresence>
                {validationErrors.name && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-red-300 text-sm mt-1"
                    id="name-error">
                    {validationErrors.name}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ delay: 0.8, duration: 0.4 }}>
              <label
                htmlFor="surname"
                className="text-sm text-gray-300 block mb-1">
                Surname
              </label>
              <input
                id="surname"
                type="text"
                value={editedUser.surname ?? selectedUser.surname}
                onChange={(e) =>
                  setEditedUser({ ...editedUser, surname: e.target.value })
                }
                placeholder="Enter surname"
                className="w-full rounded-lg bg-[#2A2A2D] text-white px-4 py-3 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                required
                aria-invalid={!!validationErrors.surname}
                aria-describedby="surname-error"
              />
              <AnimatePresence>
                {validationErrors.surname && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-red-300 text-sm mt-1"
                    id="surname-error">
                    {validationErrors.surname}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.4 }}>
            <label htmlFor="email" className="text-sm text-gray-300 block mb-1">
              Email
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={selectedUser.email}
                readOnly
                className="w-full rounded-lg bg-[#2A2A2D] text-white px-4 py-3 placeholder-gray-500 text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleCopyEmail(selectedUser.email)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                aria-label="Copy email">
                <Copy size={18} />
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.4 }}>
            <label
              htmlFor="gender"
              className="text-sm text-gray-300 block mb-1">
              Gender
            </label>
            <select
              id="gender"
              value={editedUser.gender ?? selectedUser.gender}
              onChange={(e) =>
                setEditedUser({ ...editedUser, gender: e.target.value })
              }
              className="w-full rounded-lg bg-[#2A2A2D] text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
              aria-invalid={!!validationErrors.gender}
              aria-describedby="gender-error">
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <AnimatePresence>
              {validationErrors.gender && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-red-300 text-sm mt-1"
                  id="gender-error">
                  {validationErrors.gender}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.4 }}>
            <label htmlFor="dob" className="text-sm text-gray-300 block mb-1">
              Date of Birth
            </label>
            <input
              id="dob"
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
              className="w-full rounded-lg bg-[#2A2A2D] text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
              required
              aria-invalid={!!validationErrors.dob}
              aria-describedby="dob-error"
            />
            <AnimatePresence>
              {validationErrors.dob && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-red-300 text-sm mt-1"
                  id="dob-error">
                  {validationErrors.dob}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.4 }}>
            <label
              htmlFor="joinedAt"
              className="text-sm text-gray-300 block mb-1">
              Joined At
            </label>
            <input
              id="joinedAt"
              type="text"
              value={formatDate(selectedUser.joinedAt)}
              readOnly
              className="w-full rounded-lg bg-[#2A2A2D] text-white px-4 py-3 text-sm focus:outline-none"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.4 }}>
            <label
              htmlFor="isAdmin"
              className="text-sm text-gray-300 block mb-1">
              Admin Status
            </label>
            <input
              id="isAdmin"
              type="text"
              value={selectedUser.isAdmin ? "Admin" : "User"}
              readOnly
              className="w-full rounded-lg bg-[#2A2A2D] text-white px-4 py-3 text-sm focus:outline-none"
            />
          </motion.div>

          <motion.div
            className="flex justify-end gap-3"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } },
            }}>
            <motion.button
              type="button"
              disabled={!hasChanges || updateMutation.isPending}
              className="bg-lime-500/10 text-lime-400 border-lime-500/20 font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() =>
                updateMutation.mutate({ ...editedUser, uid: selectedUser.uid })
              }
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1 },
              }}
              transition={{ delay: 1.4, duration: 0.4 }}>
              {updateMutation.isPending ? "Saving..." : "Save"}
            </motion.button>
            <motion.button
              type="button"
              onClick={onClose}
              className="text-sm bg-rose-500/10 text-rose-400 border-rose-500/20 px-4 py-3 rounded-full transition"
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1 },
              }}
              transition={{ delay: 1.5, duration: 0.4 }}>
              Cancel
            </motion.button>
          </motion.div>
        </motion.form>
      </motion.div>
    </motion.div>
  );
}

export default UserModal;
