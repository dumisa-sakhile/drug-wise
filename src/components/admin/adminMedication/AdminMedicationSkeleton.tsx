import { Search } from "lucide-react";

function AdminMedicationSkeleton() {
  return (
    <div className="font-light max-w-5xl mx-auto px-4 py-8 min-h-screen text-white">
      {/* Header */}
      <div className="h-9 w-1/3 bg-gradient-to-r from-neutral-600 to-neutral-500 rounded-md animate-pulse mb-8"></div>
      {/* Description */}
      <div className="h-5 w-2/3 bg-neutral-600/50 rounded-md animate-pulse mb-8"></div>
      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-neutral-700 bg-neutral-800 shadow-inner">
        <section className="max-w-full mx-auto">
          {/* Filter Bar */}
          <div className="flex flex-row gap-4 items-center px-6 py-3 bg-neutral-700/50">
            <div className="relative w-3/4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <div className="w-full h-10 bg-neutral-600/50 rounded-lg animate-pulse"></div>
            </div>
            <div className="w-1/4 h-10 bg-neutral-600/50 rounded-lg animate-pulse"></div>
            <div className="h-5 w-20 bg-neutral-600/50 rounded-md animate-pulse"></div>
          </div>
          {/* Table */}
          <table className="min-w-full text-sm text-left text-neutral-300 divide-y divide-neutral-700">
            <thead className="bg-neutral-700/50">
              <tr>
                <th className="px-6 py-3">
                  <div className="h-5 w-24 bg-neutral-600/50 rounded-md animate-pulse"></div>
                </th>
                <th className="px-6 py-3">
                  <div className="h-5 w-24 bg-neutral-600/50 rounded-md animate-pulse"></div>
                </th>
                <th className="px-6 py-3">
                  <div className="h-5 w-24 bg-neutral-600/50 rounded-md animate-pulse"></div>
                </th>
                <th className="px-6 py-3">
                  <div className="h-5 w-24 bg-neutral-600/50 rounded-md animate-pulse"></div>
                </th>
                <th className="px-6 py-3">
                  <div className="h-5 w-24 bg-neutral-600/50 rounded-md animate-pulse"></div>
                </th>
                <th className="px-6 py-3">
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
                    <div className="h-5 w-20 bg-neutral-600/50 rounded-md animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 w-24 bg-neutral-600/50 rounded-md animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 w-28 bg-neutral-600/50 rounded-md animate-pulse"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="h-10 w-32 bg-neutral-600/50 rounded-lg animate-pulse"></div>
        <div className="flex gap-2">
          <div className="h-10 w-10 bg-neutral-600/50 rounded-lg animate-pulse"></div>
          <div className="h-10 w-10 bg-neutral-600/50 rounded-lg animate-pulse"></div>
          <div className="h-10 w-10 bg-neutral-600/50 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

export default AdminMedicationSkeleton;
