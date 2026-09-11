import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Statistik — Lomba & Beasiswa Finder",
  description:
    "Lihat berapa banyak beasiswa dan lomba yang sedang dibuka, berdasarkan kategori, bidang, dan penyelenggara.",
};

const CATEGORY_LABELS: Record<string, string> = {
  SD: "🎒 SD",
  SMP: "📚 SMP",
  SMA_SMK: "🏫 SMA/SMK",
  KULIAH: "🎓 Kuliah (S1/S2/S3)",
};

const FIELD_LABELS: Record<string, string> = {
  akademik: "📚 Akademik",
  non_akademik: "🎯 Non-Akademik",
  sains_teknologi: "💻 Sains & Teknologi",
  seni_budaya: "🎨 Seni & Budaya",
  olahraga: "⚽ Olahraga",
  sosial: "🤝 Sosial & Kemanusiaan",
  bisnis: "💼 Bisnis & Kewirausahaan",
  umum: "📋 Umum",
};

function StatCard({
  emoji,
  label,
  value,
  sub,
  accent,
}: {
  emoji: string;
  label: string;
  value: number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 shadow-sm ring-1 ${
        accent
          ? "bg-brand-500 text-white ring-brand-500"
          : "bg-white dark:bg-gray-800 ring-gray-100 dark:ring-gray-700"
      }`}
    >
      <p className={`text-xs font-medium ${accent ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
        {emoji} {label}
      </p>
      <p className={`mt-1 text-3xl font-extrabold ${accent ? "text-white" : "text-gray-900 dark:text-white"}`}>
        {value}
      </p>
      {sub && <p className={`mt-1 text-xs ${accent ? "text-white/80" : "text-gray-400 dark:text-gray-500"}`}>{sub}</p>}
    </div>
  );
}

function Bar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-gray-700 dark:text-gray-300">{label}</span>
        <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default async function StatsPage() {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    total,
    lomba,
    beasiswa,
    gratis,
    berbayar,
    urgent,
    byCategory,
    byField,
    byOrgType,
    topOrganizers,
    upcoming,
  ] = await Promise.all([
    prisma.opportunity.count(),
    prisma.opportunity.count({ where: { type: "LOMBA" } }),
    prisma.opportunity.count({ where: { type: "BEASISWA" } }),
    prisma.opportunity.count({ where: { isFree: true } }),
    prisma.opportunity.count({ where: { isFree: false } }),
    prisma.opportunity.count({ where: { deadline: { gte: now, lte: in7Days } } }),
    prisma.opportunity.groupBy({
      by: ["category"],
      _count: { _all: true },
      orderBy: { _count: { category: "desc" } },
    }),
    prisma.opportunity.groupBy({
      by: ["field"],
      _count: { _all: true },
      orderBy: { _count: { field: "desc" } },
    }),
    prisma.opportunity.groupBy({
      by: ["organizerType"],
      _count: { _all: true },
    }),
    prisma.opportunity.groupBy({
      by: ["organizer"],
      _count: { _all: true },
      orderBy: { _count: { organizer: "desc" } },
      take: 5,
    }),
    prisma.opportunity.findMany({
      where: { deadline: { gte: now } },
      select: { deadline: true },
      orderBy: { deadline: "asc" },
      take: 1,
    }),
  ]);

  const catMax = Math.max(...byCategory.map((c) => c._count._all), 1);
  const fieldMax = Math.max(...byField.map((f) => f._count._all), 1);
  const dinas = byOrgType.find((o) => o.organizerType === "dinas")?._count._all ?? 0;
  const swasta = byOrgType.find((o) => o.organizerType === "private")?._count._all ?? 0;
  const nextDeadline = upcoming[0]?.deadline;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
      >
        ← Kembali ke daftar
      </Link>

      <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
        📊 Statistik
      </h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Kesempatan yang sedang dibuka saat ini, diperbarui otomatis setiap hari.
      </p>

      {/* ── Top stats ── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard emoji="🎯" label="Total Kesempatan" value={total} sub="lomba + beasiswa" accent />
        <StatCard emoji="🏆" label="Lomba" value={lomba} sub={`${Math.round((lomba / total) * 100)}% dari total`} />
        <StatCard emoji="🎓" label="Beasiswa" value={beasiswa} sub={`${Math.round((beasiswa / total) * 100)}% dari total`} />
        <StatCard emoji="🆓" label="Gratis" value={gratis} sub="tanpa biaya pendaftaran" />
        <StatCard emoji="💰" label="Berbayar" value={berbayar} sub="ada biaya pendaftaran" />
        <StatCard emoji="🔥" label="Deadline ≤ 7 hari" value={urgent} sub={urgent > 0 ? "buruan daftar!" : "tidak ada yang mepet"} />
      </div>

      {/* ── By category ── */}
      <section className="mb-6 rounded-2xl bg-white dark:bg-gray-800 p-5 shadow-sm ring-1 ring-gray-100 dark:ring-gray-700">
        <h2 className="mb-4 text-base font-bold text-gray-900 dark:text-white">🎒 Menurut Jenjang</h2>
        <div className="space-y-3">
          {byCategory.map((c) => (
            <Bar key={c.category} label={CATEGORY_LABELS[c.category] || c.category} count={c._count._all} max={catMax} />
          ))}
        </div>
      </section>

      {/* ── By field ── */}
      <section className="mb-6 rounded-2xl bg-white dark:bg-gray-800 p-5 shadow-sm ring-1 ring-gray-100 dark:ring-gray-700">
        <h2 className="mb-4 text-base font-bold text-gray-900 dark:text-white">💼 Menurut Bidang</h2>
        <div className="space-y-3">
          {byField.map((f) => (
            <Bar key={f.field} label={FIELD_LABELS[f.field] || f.field} count={f._count._all} max={fieldMax} />
          ))}
        </div>
      </section>

      {/* ── Organizers ── */}
      <section className="mb-6 rounded-2xl bg-white dark:bg-gray-800 p-5 shadow-sm ring-1 ring-gray-100 dark:ring-gray-700">
        <h2 className="mb-4 text-base font-bold text-gray-900 dark:text-white">🏢 Penyelenggara Teratas</h2>
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3 text-center">
            <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">{dinas}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">🏛️ Dinas / Pemerintah</p>
          </div>
          <div className="rounded-xl bg-purple-50 dark:bg-purple-900/20 p-3 text-center">
            <p className="text-2xl font-extrabold text-purple-700 dark:text-purple-400">{swasta}</p>
            <p className="text-xs text-purple-600 dark:text-purple-400">🏢 Swasta / Private</p>
          </div>
        </div>
        <ol className="space-y-2">
          {topOrganizers.map((o, i) => (
            <li key={o.organizer} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <span className="font-bold text-gray-400">{i + 1}.</span>
                <span className="truncate">{o.organizer}</span>
              </span>
              <span className="ml-2 shrink-0 rounded-full bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:text-brand-300">
                {o._count._all}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Next deadline ── */}
      {nextDeadline && (
        <div className="mb-6 rounded-2xl bg-amber-50 dark:bg-amber-900/20 p-5 text-center ring-1 ring-amber-200 dark:ring-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            ⏰ Deadline terdekat:{" "}
            <span className="font-bold">
              {nextDeadline.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </p>
        </div>
      )}

      <footer className="border-t border-brand-100 dark:border-gray-700 py-6 text-center text-xs text-gray-400 dark:text-gray-500">
        Data diperbarui otomatis setiap hari via scraper. Lomba & Beasiswa Finder
      </footer>
    </main>
  );
}