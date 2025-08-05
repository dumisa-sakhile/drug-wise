interface MessagesFilterProps {
  filter: "all" | "admin" | "system";
  setFilter: (filter: "all" | "admin" | "system") => void;
}

function MessagesFilter({ filter, setFilter }: MessagesFilterProps) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-neutral-200 font-semibold">Filter:</label>
      <select
        value={filter}
        onChange={(e) =>
          setFilter(e.target.value as "all" | "admin" | "system")
        }
        className="px-4 py-3 bg-neutral-900 text-white rounded-xl border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-light">
        <option value="all">All Messages</option>
        <option value="admin">Admin Sent</option>
        <option value="system">System Sent</option>
      </select>
    </div>
  );
}

export default MessagesFilter;
