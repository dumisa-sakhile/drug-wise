import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AppUser } from "./types";

interface UserListProps {
  search: string;
  setSearch: (search: string) => void;
  users: AppUser[];
  selectedUser: AppUser | null;
  setSelectedUser: (user: AppUser | null) => void;
  isLoading: boolean;
  error: Error | null;
}

function UserList({
  search,
  setSearch,
  users,
  selectedUser,
  setSelectedUser,
  isLoading,
  error,
}: UserListProps) {
  const filteredUsers = users.filter((user) =>
    `${user.name} ${user.surname} ${user.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <motion.div
      className="w-full md:w-1/3 bg-zinc-900 rounded-xl p-6 border border-zinc-800 shadow-inner"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 text-white rounded-xl shadow-sm border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-lime-500 font-light"
        />
      </div>
      <div className="min-h-60 overflow-y-auto">
        <AnimatePresence>
          {isLoading ? (
            <motion.div
              className="text-gray-400 p-4 text-center font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}>
              Loading users...
            </motion.div>
          ) : error ? (
            <motion.div
              className="text-red-300 p-4 text-center font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}>
              Error loading users.
            </motion.div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((u, index) => (
              <motion.div
                key={u.uid}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer mb-2 ${
                  selectedUser?.uid === u.uid
                    ? "bg-zinc-800 text-white"
                    : "hover:bg-zinc-800"
                }`}
                onClick={() => setSelectedUser(u)}>
                <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-gray-300">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold">
                    {u.name} {u.surname}
                  </div>
                  <div className="text-xs text-gray-400 font-light">
                    {u.email}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              className="text-gray-400 p-4 text-center font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}>
              No users found
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default UserList;
