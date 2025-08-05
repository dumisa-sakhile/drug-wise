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
    <div className="mt-6 flex items-center justify-between text-[#999] font-light">
      <div className="text-sm">
        Rows per page
        <select
          value={rowsPerPage}
          onChange={(e) => setRowsPerPage(Number(e.target.value))}
          className="ml-2 px-2 py-1 bg-[#1A1A1A] text-white rounded focus:outline-none">
          {[5, 10, 15, 25, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
          className="px-2 py-1 rounded hover:bg-[#1A1A1A] disabled:opacity-50">
          <ChevronLeft size="16" />
        </button>
        <span className="text-sm">
          {currentPage} / {totalPages || 1}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
          className="px-2 py-1 rounded hover:bg-[#1A1A1A] disabled:opacity-50">
          <ChevronRight size="16" />
        </button>
      </div>
    </div>
  );
}

export default PaginationControls;
