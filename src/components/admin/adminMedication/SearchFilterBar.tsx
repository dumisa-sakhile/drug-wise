import { Search } from "lucide-react";

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
    <div className="flex flex-row gap-4 items-center px-6 py-3 bg-neutral-700/50">
      <div className="relative w-3/4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
        <input
          type="text"
          placeholder="Search by medication, description or user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 text-base text-white rounded-lg shadow-sm border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-light"
        />
      </div>
      <select
        value={status}
        onChange={(e) =>
          setStatus(
            e.target.value as "all" | "pending" | "approved" | "rejected"
          )
        }
        className="w-1/4 px-3 py-2.5 bg-neutral-900 text-base text-white rounded-lg shadow-sm border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-light">
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
      <span className="text-neutral-300 font-semibold">
        {totalMedications} total
      </span>
    </div>
  );
}

export default SearchFilterBar;
