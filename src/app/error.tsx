"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 text-7xl sm:text-8xl">💥</div>

      <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
        Ada yang salah
      </h1>
      <h2 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-300">
        Terjadi error yang tidak terduga
      </h2>
      <p className="mb-8 max-w-md text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
        Jangan khawatir — ini bukan salahmu. Coba muat ulang halaman atau
        kembali ke beranda. Kalau error terus muncul, kasih tau lewat tombol
        feedback!
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-600 transition hover:scale-105"
        >
          🔄 Coba Lagi
        </button>
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-gray-800 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          🏠 Kembali ke Beranda
        </a>
      </div>

      {error.digest && (
        <p className="mt-6 rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2 text-xs text-gray-400 font-mono">
          Error ID: {error.digest}
        </p>
      )}
    </main>
  );
}
