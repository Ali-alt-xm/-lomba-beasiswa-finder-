import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      {/* Animated emoji */}
      <div className="mb-6 text-7xl sm:text-8xl animate-bounce">🔍</div>

      <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
        404
      </h1>
      <h2 className="mb-4 text-xl font-semibold text-gray-700 dark:text-gray-300">
        Halaman tidak ditemukan
      </h2>
      <p className="mb-8 max-w-md text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
        Sepertinya halaman yang kamu cari sudah dipindahkan, dihapus, atau
        memang belum ada. Mungkin kamu bisa menemukan lomba atau beasiswa
        lainnya di halaman utama!
      </p>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-600 transition hover:scale-105"
        >
          🏠 Kembali ke Beranda
        </Link>
        <Link
          href="/stats"
          className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-gray-800 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          📊 Lihat Stats
        </Link>
      </div>

      {/* Fun decoration */}
      <div className="mt-12 flex gap-4 text-3xl opacity-30">
        <span>🎓</span>
        <span>🏆</span>
        <span>📋</span>
        <span>🎯</span>
        <span>💡</span>
      </div>
    </main>
  );
}
