export default function OpportunityLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      {/* Back button skeleton */}
      <div className="mb-6 h-9 w-36 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />

      {/* Title skeleton */}
      <div className="mb-2 h-8 w-3/4 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
      <div className="mb-6 h-4 w-1/2 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />

      {/* Deadline card skeleton */}
      <div className="mb-6 rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-700">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="flex-1">
            <div className="mb-2 h-4 w-32 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="h-6 w-48 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="mb-6 flex gap-3">
        <div className="h-12 flex-1 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-12 flex-1 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>

      {/* Info grid skeleton */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-white dark:bg-gray-800 p-4 ring-1 ring-gray-100 dark:ring-gray-700"
          >
            <div className="mb-2 h-3 w-16 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="h-4 w-24 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Description skeleton */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-700">
        <div className="mb-3 h-5 w-40 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="mb-2 h-3 rounded bg-gray-100 dark:bg-gray-800 animate-pulse"
            style={{ width: `${85 - i * 10}%` }}
          />
        ))}
      </div>
    </main>
  );
}
