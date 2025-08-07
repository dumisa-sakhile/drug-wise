import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import PaginationControls from "@/components/admin/adminMessages/PaginationControls";
import type { UserData } from "./types";
import type { Timestamp } from "firebase/firestore";

interface UsersTableProps {
  users: UserData[];
  totalUsers: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterGender: string;
  setFilterGender: (gender: string) => void;
  rowsPerPage: number;
  setRowsPerPage: (rows: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  isLoading: boolean;
  onViewUser: (user: UserData) => void;
}

function UsersTable({
  users,
  totalUsers,
  searchTerm,
  setSearchTerm,
  filterGender,
  setFilterGender,
  rowsPerPage,
  setRowsPerPage,
  currentPage,
  setCurrentPage,
  totalPages,
  isLoading,
  onViewUser,
}: UsersTableProps) {
  const formatDate = (timestamp: Timestamp | null) =>
    timestamp ? timestamp.toDate().toLocaleDateString("en-ZA") : "-";

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900 shadow-inner">
        <table className="min-w-full text-sm text-left text-gray-300 divide-y divide-zinc-800">
          <thead className="bg-zinc-900/50">
            <tr>
              <th colSpan={8} className="px-6 py-4 font-semibold">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="relative w-full sm:w-3/4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search by UID, Name, or Surname..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 text-base text-white rounded-lg shadow-sm border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-lime-500 font-light"
                    />
                  </div>
                  <select
                    value={filterGender}
                    onChange={(e) => setFilterGender(e.target.value)}
                    className="w-full sm:w-1/4 px-3 py-2.5 bg-zinc-900 text-base text-white rounded-lg shadow-sm border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-lime-500 font-light">
                    <option value="">All Genders</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  <span className="text-gray-300 font-semibold">
                    {totalUsers} total
                  </span>
                </div>
              </th>
            </tr>
            <tr>
              <th className="px-6 py-4 font-semibold">No.</th>
              <th className="px-6 py-4 font-semibold">UID</th>
              <th className="px-6 py-4 font-semibold">Name</th>
              <th className="px-6 py-4 font-semibold">Surname</th>
              <th className="px-6 py-4 font-semibold">Email</th>
              <th className="px-6 py-4 font-semibold">Gender</th>
              <th className="px-6 py-4 font-semibold">Date of Birth</th>
              <th className="px-6 py-4 font-semibold">Joined At</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {isLoading ? (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="border-b border-zinc-800">
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-gray-400 font-light">
                    Loading users...
                  </td>
                </motion.tr>
              ) : users.length === 0 ? (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="border-b border-zinc-800">
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-gray-400 font-light">
                    No users found matching the search criteria.
                  </td>
                </motion.tr>
              ) : (
                users.map((u, index) => (
                  <motion.tr
                    key={u.uid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25, delay: index * 0.05 }}
                    className="border-b border-zinc-800 hover:bg-zinc-800 cursor-pointer"
                    onClick={() => onViewUser(u)}>
                    <td className="px-6 py-4 font-semibold">
                      {(currentPage - 1) * rowsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {u.uid.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 font-semibold">{u.name}</td>
                    <td className="px-6 py-4 font-semibold">{u.surname}</td>
                    <td className="px-6 py-4 text-gray-400">{u.email}</td>
                    <td className="px-6 py-4 font-semibold">
                      {u.gender || "-"}
                    </td>
                    <td className="px-6 py-4 font-light">
                      {formatDate(u.dob)}
                    </td>
                    <td className="px-6 py-4 font-light">
                      {formatDate(u.joinedAt)}
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      <PaginationControls
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />
    </div>
  );
}

export default UsersTable;
