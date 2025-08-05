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

  // Generate page numbers to display (e.g., 1, 2, 3, …)
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 ">
      <div className="flex items-center gap-2">
        <label className="text-neutral-200 font-semibold">Rows per page:</label>
        <select
          value={rowsPerPage}
          onChange={handleRowsPerPageChange}
          className="px-2 py-1 bg-neutral-900 text-white rounded-xl border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-light">
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-neutral-700 text-neutral-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-600 transition-colors duration-200 font-light">
          Previous
        </button>
        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-1 rounded-xl font-light ${
              currentPage === page
                ? "bg-gradient-to-r from-green-500 to-lime-500 text-white"
                : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"
            } transition-colors duration-200`}>
            {page}
          </button>
        ))}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-neutral-700 text-neutral-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-600 transition-colors duration-200 font-light">
          Next
        </button>
      </div>
    </div>
  );
}

export default PaginationControls;
