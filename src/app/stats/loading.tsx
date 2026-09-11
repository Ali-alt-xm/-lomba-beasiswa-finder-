export default function StatsLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 h-9 w-64 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="mx-auto h-4 w-48 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>

      {/* Big stat cards skeleton */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white dark:bg-gray-800 p-5 shadow-sm ring-1 ring-gray-100 dark:ring-gray-700"
          >
            <div className="mb-2 h-4 w-20 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="mb-1 h-8 w-12 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
            <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid gap-6 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-700"
          >
            <div className="mb-4 h-5 w-32 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="h-4 w-24 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
                  <div className="flex-1 h-5 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
