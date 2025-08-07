import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  rowsPerPage: number;
  setRowsPerPage: (value: number) => void;
  currentPage: number;
  setCurrentPage: (value: number) => void;
  totalPages: number;
}

function PaginationControls({
  rowsPerPage,
  setRowsPerPage,
  currentPage,
  setCurrentPage,
  totalPages,
}: PaginationControlsProps) {
  return (
    <motion.div
      className="mt-6 flex items-center justify-between text-gray-400 font-light"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}>
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}>
        <span className="text-sm text-gray-100 font-semibold">
          Rows per page
        </span>
        <select
          value={rowsPerPage}
          onChange={(e) => setRowsPerPage(Number(e.target.value))}
          className="ml-2 px-2 py-1 bg-zinc-900 text-gray-100 rounded-xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-lime-500 font-light">
          {[5, 10, 15, 25, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </motion.div>
      <motion.div
        className="flex items-center gap-2"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1 } },
        }}>
        <motion.button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
          className="px-2 py-1 rounded-xl bg-zinc-900 text-gray-300 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-light"
          variants={{
            hidden: { opacity: 0, scale: 0.95 },
            visible: { opacity: 1, scale: 1 },
          }}
          transition={{ duration: 0.4 }}>
          <ChevronLeft size={16} />
        </motion.button>
        <motion.span
          className="text-sm text-gray-100 font-light"
          variants={{
            hidden: { opacity: 0, scale: 0.95 },
            visible: { opacity: 1, scale: 1 },
          }}
          transition={{ duration: 0.4 }}>
          {currentPage} / {totalPages || 1}
        </motion.span>
        <motion.button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
          className="px-2 py-1 rounded-xl bg-zinc-900 text-gray-300 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-light"
          variants={{
            hidden: { opacity: 0, scale: 0.95 },
            visible: { opacity: 1, scale: 1 },
          }}
          transition={{ duration: 0.4 }}>
          <ChevronRight size={16} />
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export default PaginationControls;
