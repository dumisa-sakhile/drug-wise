import { Search } from "lucide-react";

interface AdminMessagesSkeletonProps {
  view?: "compose" | "sent";
}

function AdminMessagesSkeleton({
  view = "compose",
}: AdminMessagesSkeletonProps) {
  return (
    <div className="font-light max-w-full mx-auto md:px-4 py-8 min-h-screen text-white">
      {/* Header */}
      <div className="h-9 w-1/3 bg-gradient-to-r from-neutral-600 to-neutral-500 rounded-md animate-pulse mb-8"></div>
      {/* Description */}
      <div className="h-5 w-2/3 bg-neutral-600/50 rounded-md animate-pulse mb-8"></div>
      {/* View Toggle Buttons */}
      <div className="flex gap-4 mb-8">
        <div
          className={`h-10 w-24 rounded-xl animate-pulse ${
            view === "compose"
              ? "bg-gradient-to-r from-neutral-600 to-neutral-500"
              : "bg-neutral-500/10"
          }`}></div>
        <div
          className={`h-10 w-32 rounded-xl animate-pulse ${
            view === "sent"
              ? "bg-gradient-to-r from-neutral-600 to-neutral-500"
              : "bg-neutral-500/10"
          }`}></div>
      </div>
      {view === "compose" ? (
        <div className="flex flex-col md:flex-row gap-6">
          {/* User List */}
          <div className="w-full md:w-1/3 bg-neutral-800 rounded-xl p-6 border border-neutral-700 shadow-inner">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <div className="w-full h-10 bg-neutral-600/50 rounded-xl animate-pulse"></div>
            </div>
            <div className="min-h-60 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl h-12 bg-neutral-600/50 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-neutral-600/50"></div>
                  <div className="flex-1">
                    <div className="h-4 w-3/4 bg-neutral-600/50 rounded-md"></div>
                    <div className="h-3 w-1/2 bg-neutral-600/50 rounded-md mt-1"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Form */}
          <div className="flex-1 bg-neutral-800 rounded-xl p-6 border border-neutral-700 shadow-inner flex flex-col">
            <div className="mb-4">
              <div className="h-4 w-12 bg-neutral-600/50 rounded-md animate-pulse mb-2"></div>
              <div className="h-10 w-full bg-neutral-600/50 rounded-xl animate-pulse"></div>
            </div>
            <div className="mb-4">
              <div className="h-4 w-16 bg-neutral-600/50 rounded-md animate-pulse mb-2"></div>
              <div className="h-10 w-full bg-neutral-600/50 rounded-xl animate-pulse"></div>
            </div>
            <div className="mb-4 flex-1 flex flex-col">
              <div className="h-4 w-20 bg-neutral-600/50 rounded-md animate-pulse mb-2"></div>
              <div className="w-full h-40 bg-neutral-600/50 rounded-xl animate-pulse"></div>
            </div>
            <div className="h-10 w-32 bg-neutral-600/50 rounded-xl animate-pulse self-end"></div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filter */}
          <div className="flex items-center gap-4">
            <div className="h-4 w-16 bg-neutral-600/50 rounded-md animate-pulse"></div>
            <div className="h-10 w-32 bg-neutral-600/50 rounded-xl animate-pulse"></div>
          </div>
          {/* Table */}
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-neutral-700 bg-neutral-800 shadow-inner">
              <table className="min-w-full text-sm text-left text-neutral-300 divide-y divide-neutral-700">
                <thead className="bg-neutral-700/50">
                  <tr>
                    <th className="px-6 py-4">
                      <div className="h-5 w-24 bg-neutral-600/50 rounded-md animate-pulse"></div>
                    </th>
                    <th className="px-6 py-4">
                      <div className="h-5 w-24 bg-neutral-600/50 rounded-md animate-pulse"></div>
                    </th>
                    <th className="px-6 py-4">
                      <div className="h-5 w-24 bg-neutral-600/50 rounded-md animate-pulse"></div>
                    </th>
                    <th className="px-6 py-4">
                      <div className="h-5 w-24 bg-neutral-600/50 rounded-md animate-pulse"></div>
                    </th>
                    <th className="px-6 py-4">
                      <div className="h-5 w-24 bg-neutral-600/50 rounded-md animate-pulse"></div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(3)].map((_, i) => (
                    <tr key={i} className="border-b border-neutral-700">
                      <td className="px-6 py-4">
                        <div className="h-5 w-32 bg-neutral-600/50 rounded-md animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-5 w-48 bg-neutral-600/50 rounded-md animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-5 w-28 bg-neutral-600/50 rounded-md animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-5 w-24 bg-neutral-600/50 rounded-md animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-5 w-20 bg-neutral-600/50 rounded-md animate-pulse"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-neutral-800 border-t border-neutral-700">
              <div className="flex items-center gap-2">
                <div className="h-4 w-24 bg-neutral-600/50 rounded-md animate-pulse"></div>
                <div className="h-8 w-16 bg-neutral-600/50 rounded-xl animate-pulse"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-20 bg-neutral-600/50 rounded-xl animate-pulse"></div>
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-8 bg-neutral-600/50 rounded-xl animate-pulse"></div>
                ))}
                <div className="h-8 w-20 bg-neutral-600/50 rounded-xl animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMessagesSkeleton;
