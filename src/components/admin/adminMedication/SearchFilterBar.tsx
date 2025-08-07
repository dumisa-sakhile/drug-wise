import { Search } from "lucide-react";
import { motion } from "framer-motion";

interface SearchFilterBarProps {
  search: string;
  setSearch: (value: string) => void;
  status: "all" | "pending" | "approved" | "rejected";
  setStatus: (value: "all" | "pending" | "approved" | "rejected") => void;
  totalMedications: number;
}

function SearchFilterBar({
  search,
  setSearch,
  status,
  setStatus,
  totalMedications,
}: SearchFilterBarProps) {
  return (
    <motion.div
      className="flex flex-row gap-4 items-center px-6 py-3 bg-zinc-900/50"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.1 } },
      }}>
      <motion.div
        className="relative w-3/4"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        transition={{ duration: 0.4 }}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by medication, description or user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 text-base text-gray-100 rounded-lg shadow-sm border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-lime-500 font-light"
        />
      </motion.div>
      <motion.select
        value={status}
        onChange={(e) =>
          setStatus(
            e.target.value as "all" | "pending" | "approved" | "rejected"
          )
        }
        className="w-1/4 px-3 py-2.5 bg-zinc-900 text-base text-gray-100 rounded-lg shadow-sm border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-lime-500 font-light"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        transition={{ duration: 0.4 }}>
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </motion.select>
      <motion.span
        className="text-gray-100 font-semibold"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        transition={{ duration: 0.4 }}>
        {totalMedications} total
      </motion.span>
    </motion.div>
  );
}

export default SearchFilterBar;
