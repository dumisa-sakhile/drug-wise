import { motion } from "framer-motion";

interface MessagesFilterProps {
  filter: "all" | "admin" | "system";
  setFilter: (filter: "all" | "admin" | "system") => void;
}

function MessagesFilter({ filter, setFilter }: MessagesFilterProps) {
  return (
    <motion.div
      className="flex items-center gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}>
      <label className="text-gray-100 font-semibold">Filter:</label>
      <select
        value={filter}
        onChange={(e) =>
          setFilter(e.target.value as "all" | "admin" | "system")
        }
        className="px-4 py-3 bg-zinc-900 text-white rounded-xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-lime-500 font-light">
        <option value="all">All Messages</option>
        <option value="admin">Admin Sent</option>
        <option value="system">System Sent</option>
      </select>
    </motion.div>
  );
}

export default MessagesFilter;
