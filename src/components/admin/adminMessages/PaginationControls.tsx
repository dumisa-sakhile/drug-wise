import { motion } from "framer-motion";

interface PaginationControlsProps {
  rowsPerPage: number;
  setRowsPerPage: (rows: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
}

function PaginationControls({
  rowsPerPage,
  setRowsPerPage,
  currentPage,
  setCurrentPage,
  totalPages,
}: PaginationControlsProps) {
  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page on rows change
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <motion.div
      className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-zinc-900 border-t border-zinc-800"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}>
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}>
        <label className="text-gray-100 font-semibold">Rows per page:</label>
        <select
          value={rowsPerPage}
          onChange={handleRowsPerPageChange}
          className="px-2 py-1 bg-zinc-900 text-white rounded-xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-lime-500 font-light">
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
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
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-zinc-800 text-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors duration-200 font-light"
          variants={{
            hidden: { opacity: 0, scale: 0.95 },
            visible: { opacity: 1, scale: 1 },
          }}
          transition={{ duration: 0.4 }}>
          Previous
        </motion.button>
        {getPageNumbers().map((page, index) => (
          <motion.button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-1 rounded-xl font-light ${
              currentPage === page
                ? "bg-gradient-to-r from-green-500 to-lime-500 text-gray-900"
                : "bg-zinc-800 text-gray-300 hover:bg-zinc-700"
            } transition-colors duration-200`}
            variants={{
              hidden: { opacity: 0, scale: 0.95 },
              visible: { opacity: 1, scale: 1 },
            }}
            transition={{ delay: index * 0.1, duration: 0.4 }}>
            {page}
          </motion.button>
        ))}
        <motion.button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-zinc-800 text-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors duration-200 font-light"
          variants={{
            hidden: { opacity: 0, scale: 0.95 },
            visible: { opacity: 1, scale: 1 },
          }}
          transition={{ duration: 0.4 }}>
          Next
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export default PaginationControls;
