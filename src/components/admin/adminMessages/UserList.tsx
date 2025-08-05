import { Search } from "lucide-react";
import { motion } from "framer-motion";
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
    <div className="w-full md:w-1/3 bg-neutral-800 rounded-xl p-6 border border-neutral-700 shadow-inner">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 text-white rounded-xl shadow-sm border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-light"
        />
      </div>
      <div className="min-h-60 overflow-y-auto">
        {isLoading ? (
          <div className="text-neutral-500 p-4 text-center font-light">
            Loading users...
          </div>
        ) : error ? (
          <div className="text-red-400 p-4 text-center font-light">
            Error loading users.
          </div>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((u) => (
            <motion.div
              key={u.uid}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer mb-2 ${
                selectedUser?.uid === u.uid
                  ? "bg-neutral-700 text-white"
                  : "hover:bg-neutral-900"
              }`}
              onClick={() => setSelectedUser(u)}>
              <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-300">
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold">
                  {u.name} {u.surname}
                </div>
                <div className="text-xs text-neutral-500 font-light">
                  {u.email}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-neutral-500 p-4 text-center font-light">
            No users found
          </div>
        )}
      </div>
    </div>
  );
}

export default UserList;
