import { Search } from "lucide-react";

function AdminUsersSkeleton() {
  return (
    <div className="font-light max-w-full mx-auto md:px-4 py-8 pt-16 md:pt-8 min-h-screen text-white bg-zinc-950">
      {/* Header */}
      <div className="h-9 w-1/3 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-md animate-pulse mb-8"></div>
      {/* Description */}
      <div className="h-5 w-2/3 bg-zinc-800/50 rounded-md animate-pulse mb-8"></div>
      {/* Table */}
      <div className="space-y-4">
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900 shadow-inner">
          <table className="min-w-full text-sm text-left text-gray-300 divide-y divide-zinc-800">
            <thead className="bg-zinc-900/50">
              <tr>
                <th colSpan={8} className="px-6 py-4 font-semibold">
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative w-full sm:w-3/4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <div className="w-full h-10 bg-zinc-800/50 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="w-full sm:w-1/4 h-10 bg-zinc-800/50 rounded-lg animate-pulse"></div>
                    <div className="h-5 w-16 bg-zinc-800/50 rounded-md animate-pulse"></div>
                  </div>
                </th>
              </tr>
              <tr>
                <th className="px-6 py-4">
                  <div className="h-5 w-12 bg-zinc-800/50 rounded-md animate-pulse"></div>
                </th>
                <th className="px-6 py-4">
                  <div className="h-5 w-24 bg-zinc-800/50 rounded-md animate-pulse"></div>
                </th>
                <th className="px-6 py-4">
                  <div className="h-5 w-24 bg-zinc-800/50 rounded-md animate-pulse"></div>
                </th>
                <th className="px-6 py-4">
                  <div className="h-5 w-24 bg-zinc-800/50 rounded-md animate-pulse"></div>
                </th>
                <th className="px-6 py-4">
                  <div className="h-5 w-24 bg-zinc-800/50 rounded-md animate-pulse"></div>
                </th>
                <th className="px-6 py-4">
                  <div className="h-5 w-24 bg-zinc-800/50 rounded-md animate-pulse"></div>
                </th>
                <th className="px-6 py-4">
                  <div className="h-5 w-24 bg-zinc-800/50 rounded-md animate-pulse"></div>
                </th>
                <th className="px-6 py-4">
                  <div className="h-5 w-24 bg-zinc-800/50 rounded-md animate-pulse"></div>
                </th>
              </tr>
            </thead>
            <tbody>
              {[...Array(3)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-800">
                  <td className="px-6 py-4">
                    <div className="h-5 w-12 bg-zinc-800/50 rounded-md animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 w-24 bg-zinc-800/50 rounded-md animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 w-24 bg-zinc-800/50 rounded-md animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 w-24 bg-zinc-800/50 rounded-md animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 w-48 bg-zinc-800/50 rounded-md animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 w-20 bg-zinc-800/50 rounded-md animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 w-24 bg-zinc-800/50 rounded-md animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 w-24 bg-zinc-800/50 rounded-md animate-pulse"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-zinc-900 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="h-4 w-24 bg-zinc-800/50 rounded-md animate-pulse"></div>
            <div className="h-8 w-16 bg-zinc-800/50 rounded-xl animate-pulse"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-20 bg-zinc-800/50 rounded-xl animate-pulse"></div>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-8 w-8 bg-zinc-800/50 rounded-xl animate-pulse"></div>
            ))}
            <div className="h-8 w-20 bg-zinc-800/50 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminUsersSkeleton;
