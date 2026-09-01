"use client";

import { useState, useMemo, useEffect } from "react";
import type { Opportunity } from "@prisma/client";
import { useTheme } from "./ThemeProvider";

/* ─── helpers ─── */
function daysLeft(deadline: string | Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dl = new Date(deadline);
  dl.setHours(0, 0, 0, 0);
  return Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const LOCATION_LABELS: Record<string, string> = {
  ONLINE: "💻 Online",
  JAKARTA: "🏙️ Jakarta",
  BANDUNG: "🏔️ Bandung",
  SURABAYA: "🌊 Surabaya",
  YOGYAKARTA: "🏛️ Yogyakarta",
  SEMARANG: "🌄 Semarang",
  MEDAN: "🌿 Medan",
  MAKASSAR: "🌴 Makassar",
  BALIKPAPAN: "🛢️ Balikpapan",
  OTHER: "📍 Lainnya",
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

/* ─── component ─── */
/* ─── reminder helpers ─── */
function getReminders(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("reminders") || "[]");
  } catch {
    return [];
  }
}

function saveReminders(ids: string[]) {
  localStorage.setItem("reminders", JSON.stringify(ids));
}

function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function sendNotification(title: string, body: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" });
  }
}

/* ─── component ─── */
export default function HomePage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [locationFilter, setLocationFilter] = useState<string>("ALL");
  const [organizerFilter, setOrganizerFilter] = useState<string>("ALL");
  const [fieldFilter, setFieldFilter] = useState<string>("ALL");
  const [orgTypeFilter, setOrgTypeFilter] = useState<string>("ALL");
  const [reminderIds, setReminderIds] = useState<string[]>([]);
  const [showReminders, setShowReminders] = useState(false);
  const [notifStatus, setNotifStatus] = useState<string>("default");

  useEffect(() => {
    fetch("/api/opportunities")
      .then((r) => r.json())
      .then((data) => {
        setOpportunities(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Load reminders from localStorage
    setReminderIds(getReminders());
    if ("Notification" in window) {
      setNotifStatus(Notification.permission);
    }
  }, []);

  // Smart alarm check — uses alarmConfig for timing
  useEffect(() => {
    if (!opportunities.length || !reminderIds.length) return;

    const checkReminders = () => {
      const saved = getReminders();

      saved.forEach((id) => {
        const opp = opportunities.find((o) => o.id === id);
        if (!opp) return;
        const days = daysLeft(opp.deadline);
        if (days < 0) return;

        // Parse smart alarm config
        let triggerDays = 3; // default
        try {
          const cfg = opp.alarmConfig ? JSON.parse(opp.alarmConfig as string) : null;
          if (cfg?.earlyBird && days <= (cfg.earlyBirdDays || 45) && days > (cfg.daysBefore || 7)) {
            triggerDays = cfg.earlyBirdDays || 45;
          } else if (cfg?.daysBefore) {
            triggerDays = cfg.daysBefore;
          }
        } catch {}

        if (days >= 0 && days <= triggerDays) {
          let body = `${opp.title} — ${formatDate(opp.deadline)}`;
          // Add smart checklist tip
          try {
            const cfg = opp.alarmConfig ? JSON.parse(opp.alarmConfig as string) : null;
            if (cfg?.checklistItems?.length > 0) {
              body += `\n${cfg.checklistItems[0]}`;
            }
            if (cfg?.teamTip && days <= 21) {
              body += `\n${cfg.teamTip}`;
            }
          } catch {}
          sendNotification(
            `⏰ ${days === 0 ? "Deadline Hari Ini!" : `${days} Hari Lagi`}`,
            body
          );
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [opportunities, reminderIds]);

  /* derive filter options from data */
  const categories = useMemo(
    () => Array.from(new Set(opportunities.map((o) => o.category))).sort(),
    [opportunities]
  );
  const locations = useMemo(
    () => Array.from(new Set(opportunities.map((o) => o.location))).sort(),
    [opportunities]
  );
  const organizers = useMemo(
    () => Array.from(new Set(opportunities.map((o) => o.organizer))).sort(),
    [opportunities]
  );
  const fields = useMemo(
    () => Array.from(new Set(opportunities.map((o) => o.field || "umum"))).sort(),
    [opportunities]
  );

  /* filtered + sorted list */
  /* reminder toggle */
  const toggleReminder = (id: string) => {
    requestNotificationPermission();
    setReminderIds((prev) => {
      const next = prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id];
      saveReminders(next);
      if ("Notification" in window) setNotifStatus(Notification.permission);
      return next;
    });
  };

  const reminders = useMemo(
    () => opportunities.filter((o) => reminderIds.includes(o.id)),
    [opportunities, reminderIds]
  );

  const filtered = useMemo(() => {
    let result = [...opportunities];

    if (typeFilter !== "ALL") {
      result = result.filter((o) => o.type === typeFilter);
    }
    if (categoryFilter !== "ALL") {
      result = result.filter((o) => o.category === categoryFilter);
    }
    if (locationFilter !== "ALL") {
      result = result.filter((o) => o.location === locationFilter);
    }
    if (organizerFilter !== "ALL") {
      result = result.filter((o) => o.organizer === organizerFilter);
    }
    if (fieldFilter !== "ALL") {
      result = result.filter((o) => (o.field || "umum") === fieldFilter);
    }
    if (orgTypeFilter !== "ALL") {
      result = result.filter((o) => (o.organizerType || "private") === orgTypeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.title.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q) ||
          o.organizer.toLowerCase().includes(q)
      );
    }

    // sort by soonest deadline first
    result.sort(
      (a, b) =>
        new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );

    return result;
  }, [opportunities, typeFilter, categoryFilter, locationFilter, organizerFilter, fieldFilter, orgTypeFilter, searchQuery]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      {/* ── Header ── */}
      <header className="mb-8 text-center">
        <div className="flex items-center justify-between">
          <div className="flex-1"></div>
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              🎓 Lomba & Beasiswa Finder
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Temukan kesempatan terbaik untuk masa depanmu. Update tiap minggu.
            </p>
          </div>
          <div className="flex-1 flex justify-end">
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="rounded-xl bg-white dark:bg-gray-800 p-2.5 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              title={resolvedTheme === "dark" ? "Mode terang" : "Mode gelap"}
            >
              {resolvedTheme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
        {reminderIds.length > 0 && (
          <button
            onClick={() => setShowReminders(!showReminders)}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100 transition"
          >
            🔔 Reminder Saya ({reminderIds.length})
          </button>
        )}
      </header>

      {/* ── Reminders Panel ── */}
      {showReminders && reminders.length > 0 && (
        <div className="mb-6 rounded-2xl bg-amber-50 dark:bg-amber-900/20 p-4 shadow-sm ring-1 ring-amber-200 dark:ring-amber-800">
          <h3 className="mb-3 text-sm font-bold text-amber-800 dark:text-amber-300">🔔 Reminder Aktif</h3>
          <div className="space-y-2">
            {reminders
              .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
              .map((opp) => {
                const days = daysLeft(opp.deadline);
                return (
                  <div
                    key={opp.id}
                    className="flex items-center justify-between rounded-xl bg-white dark:bg-gray-800 px-4 py-3 ring-1 ring-amber-100 dark:ring-amber-800"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={opp.type === "BEASISWA" ? "badge-beasiswa" : "badge-lomba"}>
                          {opp.type === "BEASISWA" ? "🎓" : "🏆"}
                        </span>
                        <a
                          href={opp.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-sm font-semibold text-gray-900 dark:text-white hover:text-amber-600 transition"
                        >
                          {opp.title}
                        </a>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Deadline: {formatDate(opp.deadline)}
                        <span className={
                          days < 0
                            ? "ml-2 text-red-500 font-medium"
                            : days <= 3
                            ? "ml-2 text-red-500 font-medium"
                            : days <= 7
                            ? "ml-2 text-amber-600 font-medium"
                            : "ml-2 text-green-600"
                        }>
                          {days < 0 ? " — Sudah lewat" : days === 0 ? " — Hari ini!" : ` — ${days} hari lagi`}
                        </span>
                      </p>
                      {/* Smart alarm badge */}
                      {opp.alarmType && opp.alarmType !== "standard" && (
                        <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          opp.alarmType === "sidanira" ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400" :
                          opp.alarmType === "team-league" ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" :
                          "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                        }`}>
                          {opp.alarmType === "sidanira" ? "🚨 Sidanira — Surat Rekomendasi" :
                           opp.alarmType === "team-league" ? "👥 Tim — Koordinasi Pelatih" :
                           "⚡ Elite — Daftar Cepat!"}
                        </span>
                      )}
                      {/* Smart checklist */}
                      {opp.alarmConfig && days >= 0 && (() => {
                        try {
                          const cfg = JSON.parse(opp.alarmConfig as string);
                          if (!cfg.checklistItems?.length) return null;
                          const visible = opp.alarmType === "sidanira" ? days <= 14 :
                            opp.alarmType === "team-league" ? days <= 21 :
                            opp.alarmType === "elite-cup" ? days <= 45 : days <= 7;
                          if (!visible) return null;
                          return (
                            <div className="mt-2 rounded-lg bg-gray-50 dark:bg-gray-700 p-2 text-xs text-gray-600 dark:text-gray-400">
                              <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">📋 Action Items:</p>
                              {cfg.checklistItems.slice(0, 2).map((item: string, i: number) => (
                                <p key={i} className="ml-1">{item}</p>
                              ))}
                              {cfg.teamTip && days <= 21 && (
                                <p className="mt-1 font-medium text-green-700">{cfg.teamTip}</p>
                              )}
                            </div>
                          );
                        } catch { return null; }
                      })()}
                    </div>
                    <button
                      onClick={() => toggleReminder(opp.id)}
                      className="ml-3 rounded-lg p-1.5 text-amber-500 hover:bg-amber-100 hover:text-amber-700 transition"
                      title="Hapus reminder"
                    >
                      🔔✕
                    </button>
                  </div>
                );
              })}
          </div>
          {notifStatus !== "granted" && (
            <p className="mt-3 text-xs text-amber-600">
              💡 Aktifkan notifikasi browser untuk dapat alert otomatis saat deadline mendekat!
            </p>
          )}
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className="mb-6 rounded-2xl bg-white dark:bg-gray-800 p-4 shadow-md ring-1 ring-brand-100 dark:ring-gray-700">
        {/* Search */}
        <div className="relative mb-4">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
              />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Cari beasiswa atau lomba…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition focus:border-brand-400 focus:bg-white dark:focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-3">
          {/* Field filter */}
          <div className="flex-1 min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Bidang
            </label>
            <select
              value={fieldFilter}
              onChange={(e) => setFieldFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <option value="ALL">Semua</option>
              {fields.map((f) => (
                <option key={f} value={f}>
                  {FIELD_LABELS[f] || f}
                </option>
              ))}
            </select>
          </div>
          {/* Type filter */}
          <div className="flex-1 min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Tipe
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <option value="ALL">Semua</option>
              <option value="BEASISWA">🎓 Beasiswa</option>
              <option value="LOMBA">🏆 Lomba</option>
            </select>
          </div>

          {/* Organizer type filter */}
          <div className="flex-1 min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Penyelenggara
            </label>
            <select
              value={orgTypeFilter}
              onChange={(e) => setOrgTypeFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <option value="ALL">Semua</option>
              <option value="dinas">🏛️ Dinas / Pemerintah</option>
              <option value="private">🏢 Swasta / Private</option>
            </select>
          </div>

          {/* Category filter */}
          <div className="flex-1 min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Kategori
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <option value="ALL">Semua</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat] || cat}
                </option>
              ))}
            </select>
          </div>

          {/* Location filter */}
          <div className="flex-1 min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Lokasi
            </label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <option value="ALL">Semua</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {LOCATION_LABELS[loc] || loc}
                </option>
              ))}
            </select>
          </div>

          {/* Organizer filter */}
          <div className="flex-1 min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Penyelenggara
            </label>
            <select
              value={organizerFilter}
              onChange={(e) => setOrganizerFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <option value="ALL">Semua</option>
              {organizers.map((org) => (
                <option key={org} value={org}>
                  {org}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Results count ── */}
      {!loading && (
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Menampilkan <span className="font-semibold text-gray-700 dark:text-gray-300">{filtered.length}</span> dari{" "}
          <span className="font-semibold text-gray-700 dark:text-gray-300">{opportunities.length}</span> kesempatan
        </p>
      )}

      {/* ── Loading State ── */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-100 dark:ring-gray-700"
            >
              <div className="p-5">
                <div className="mb-3 h-5 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="mb-2 h-6 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="mb-3 h-4 w-full rounded bg-gray-100 dark:bg-gray-700" />
                <div className="mb-3 h-4 w-2/3 rounded bg-gray-100 dark:bg-gray-700" />
                <div className="mt-4 flex gap-2">
                  <div className="h-5 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-5 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl bg-white dark:bg-gray-800 py-16 text-center shadow-sm ring-1 ring-gray-100 dark:ring-gray-700">
          <div className="mx-auto mb-4 text-5xl">🔍</div>
          <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
            Tidak ada hasil ditemukan
          </h3>
          <p className="mx-auto max-w-md text-sm text-gray-500 dark:text-gray-400">
            Coba ubah filter atau kata kunci pencarianmu. Kesempatan baru akan
            ditambahkan secara berkala!
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setTypeFilter("ALL");
              setCategoryFilter("ALL");
              setLocationFilter("ALL");
              setOrganizerFilter("ALL");
              setFieldFilter("ALL");
              setOrgTypeFilter("ALL");
            }}
            className="mt-4 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition"
          >
            Reset Semua Filter
          </button>
        </div>
      )}

      {/* ── Card Grid ── */}
      {!loading && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((opp) => {
            const days = daysLeft(opp.deadline);
            const isUrgent = days <= 7;
            const isExpired = days < 0;

            return (
              <a
                key={opp.id}
                href={opp.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative flex flex-col rounded-2xl bg-white dark:bg-gray-800 p-5 shadow-sm ring-1 transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                  (opp.organizerType || "private") === "dinas"
                    ? "ring-blue-200 dark:ring-blue-800 hover:ring-blue-400 border-t-4 border-t-blue-500"
                    : "ring-gray-100 dark:ring-gray-700 hover:ring-brand-200 border-t-4 border-t-purple-400"
                }`}
              >
                {/* Type + Organizer badge */}
                <div className="mb-3 flex items-center gap-2 flex-wrap">
                  <span
                    className={
                      opp.type === "BEASISWA" ? "badge-beasiswa" : "badge-lomba"
                    }
                  >
                    {opp.type === "BEASISWA" ? "🎓 Beasiswa" : "🏆 Lomba"}
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    (opp.organizerType || "private") === "dinas"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 ring-1 ring-blue-300 dark:ring-blue-800"
                      : "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 ring-1 ring-purple-300 dark:ring-purple-800"
                  }`}>
                    {(opp.organizerType || "private") === "dinas" ? "🏛️ DINAS" : "🏢 SWASTA"}
                  </span>
                  {opp.alarmType === "sidanira" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-900/20 px-2 py-0.5 text-xs font-semibold text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800">
                      🚨 Sidanira
                    </span>
                  )}
                  {opp.alarmType === "elite-cup" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800">
                      ⚡ Elite Cup
                    </span>
                  )}
                  {opp.alarmType === "team-league" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-900/20 px-2 py-0.5 text-xs font-semibold text-green-700 dark:text-green-400 ring-1 ring-green-200 dark:ring-green-800">
                      👥 Tim
                    </span>
                  )}
                  {opp.isRecurring && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-400">
                      🔁 Tahunan
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="mb-2 text-base font-bold leading-snug text-gray-900 dark:text-white group-hover:text-brand-600 transition line-clamp-2">
                  {opp.title}
                </h2>

                {/* Organizer */}
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  {opp.organizer}
                </p>

                {/* Description excerpt */}
                <p className="mb-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {opp.description}
                </p>

                {/* Field badge */}
                {opp.field && opp.field !== "umum" && (
                  <span className="inline-flex items-center rounded-full bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 text-xs text-brand-700 dark:text-brand-300 ring-1 ring-brand-200 dark:ring-brand-800">
                    {FIELD_LABELS[opp.field] || opp.field}
                  </span>
                )}

                {/* Meta tags */}
                <div className="mt-auto flex flex-wrap gap-2 text-xs">
                  <span
                    className={
                      isExpired
                        ? "badge-urgent"
                        : isUrgent
                        ? "badge-urgent"
                        : "badge-normal"
                    }
                  >
                    {isExpired
                      ? "⏰ Sudah lewat"
                      : days === 0
                      ? "🔥 Hari ini!"
                      : `${days} hari lagi`}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-gray-600 dark:text-gray-400">
                    {CATEGORY_LABELS[opp.category] || opp.category}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-gray-600 dark:text-gray-400">
                    {LOCATION_LABELS[opp.location] || opp.location}
                  </span>
                </div>

                {/* Quick links */}
                {opp.links && (() => {
                  try {
                    const parsed = JSON.parse(opp.links as string) as { label: string; url: string }[];
                    if (parsed.length === 0) return null;
                    return (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {parsed.slice(0, 3).map((link, i) => (
                          <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 rounded-lg bg-brand-50 dark:bg-brand-900/20 px-2 py-1 text-xs font-medium text-brand-700 dark:text-brand-300 ring-1 ring-brand-200 dark:ring-brand-800 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition"
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>
                    );
                  } catch {
                    return null;
                  }
                })()}

                {/* Deadline + Remind button */}
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    Deadline: {formatDate(opp.deadline)}
                  </p>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleReminder(opp.id);
                    }}
                    className={`rounded-lg p-1.5 transition ${
                      reminderIds.includes(opp.id)
                        ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
                        : "text-gray-300 hover:bg-gray-100 hover:text-amber-500"
                    }`}
                    title={reminderIds.includes(opp.id) ? "Hapus reminder" : "Set reminder"}
                  >
                    {reminderIds.includes(opp.id) ? "🔔" : "🔕"}
                  </button>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="mt-12 border-t border-brand-100 dark:border-gray-700 py-6 text-center text-xs text-gray-400 dark:text-gray-500">
        Lomba & Beasiswa Finder — Dibuat dengan ❤️ untuk mahasiswa Indonesia
      </footer>
    </main>
  );
}
