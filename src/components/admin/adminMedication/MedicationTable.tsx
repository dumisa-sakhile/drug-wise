import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertCircle } from "lucide-react";

interface MedicationType {
  id: string;
  medicationName: string;
  description: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: any;
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
}

interface MedicationTableProps {
  medications: MedicationType[];
  users: Record<string, User>;
  onRowClick: (medication: MedicationType) => void;
}

function StatusBadge({ status }: { status: MedicationType["status"] }) {
  const baseClasses =
    "px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap";
  switch (status) {
    case "approved":
      return (
        <span
          className={`${baseClasses} bg-green-500/20 text-green-400 flex items-center gap-1`}>
          <Check size={14} /> Approved
        </span>
      );
    case "rejected":
      return (
        <span
          className={`${baseClasses} bg-rose-500/20 text-rose-400 flex items-center gap-1`}>
          <AlertCircle size={14} /> Rejected
        </span>
      );
    case "pending":
    default:
      return (
        <span className={`${baseClasses} bg-yellow-500/20 text-yellow-400`}>
          Pending Review
        </span>
      );
  }
}

function MedicationTable({
  medications,
  users,
  onRowClick,
}: MedicationTableProps) {
  return (
    <table className="min-w-full text-sm text-left text-gray-300 divide-y divide-zinc-800">
      <thead className="bg-zinc-900/50">
        <tr>
          <th className="px-6 py-3 font-semibold">Medication</th>
          <th className="px-6 py-3 font-semibold">Description</th>
          <th className="px-6 py-3 font-semibold">Submitted By</th>
          <th className="px-6 py-3 font-semibold">Status</th>
          <th className="px-6 py-3 font-semibold">Submitted At</th>
        </tr>
      </thead>
      <tbody>
        {medications.length === 0 ? (
          <motion.tr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="border-b border-zinc-800">
            <td
              colSpan={5}
              className="px-6 py-8 text-center text-gray-400 font-light">
              No medications found matching the search criteria.
            </td>
          </motion.tr>
        ) : (
          <AnimatePresence>
            {medications.map((m, index) => (
              <motion.tr
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
                className="border-b border-zinc-800 hover:bg-zinc-800 cursor-pointer"
                onClick={() => onRowClick(m)}>
                <td
                  className="px-6 py-4 font-semibold max-w-[150px] truncate"
                  title={m.medicationName}>
                  {m.medicationName}
                </td>
                <td
                  className="px-6 py-4 max-w-[250px] truncate font-light"
                  title={m.description}>
                  {m.description}
                </td>
                <td className="px-6 py-4 font-light">
                  {users[m.userId]?.name +
                    " " +
                    (users[m.userId]?.surname || "") || m.userId}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={m.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-light">
                  {m.submittedAt?.toDate?.().toLocaleString() ?? "-"}
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        )}
      </tbody>
    </table>
  );
}

export default MedicationTable;
