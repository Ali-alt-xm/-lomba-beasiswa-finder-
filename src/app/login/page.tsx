import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Masuk Admin",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-md ring-1 ring-brand-100 dark:bg-gray-800 dark:ring-gray-700">
        <h1 className="mb-1 text-xl font-extrabold text-gray-900 dark:text-white">
          Masuk Admin
        </h1>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Halaman ini hanya untuk pengelola data.
        </p>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
