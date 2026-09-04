"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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

/* ─── Sudah Daftar helpers ─── */
function getRegistered(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("registered") || "[]");
  } catch {
    return [];
  }
}

function saveRegistered(ids: string[]) {
  localStorage.setItem("registered", JSON.stringify(ids));
}

/* ─── Push notification sync (server-side web push) ─── */
function getLocalNotified(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("notifiedLocal") || "{}");
  } catch {
    return {};
  }
}

function saveLocalNotified(map: Record<string, string>) {
  localStorage.setItem("notifiedLocal", JSON.stringify(map));
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64_ = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64_);
  const arr = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function syncPushSubscription(ids: string[]) {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) return;

  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();

    if (ids.length === 0) {
      if (sub) await sub.unsubscribe();
      return;
    }

    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: sub.toJSON(),
        opportunityIds: ids,
      }),
    });
  } catch (err) {
    console.log("push sync failed:", err);
  }
}

/* ─── WhatsApp share ─── */
function shareWhatsApp(opp: { title: string; deadline: Date | string; sourceUrl: string; type: string }) {
  const days = daysLeft(opp.deadline);
  const emoji = opp.type === "BEASISWA" ? "🎓" : "🏆";
  const deadlineStr = formatDate(opp.deadline);
  const daysText = days < 0 ? "Sudah lewat" : days === 0 ? "Hari ini!" : `${days} hari lagi`;
  const text = `${emoji} ${opp.title}\n\n📅 Deadline: ${deadlineStr} (${daysText})\n\n🔗 ${opp.sourceUrl}\n\n_Ditemukan di Lomba & Beasiswa Finder_`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}

/* ─── Share whole list to WhatsApp ─── */
function shareListWhatsApp(opps: Array<{ title: string; deadline: Date | string; sourceUrl: string; type: string }>) {
  if (!opps.length) return;

  const shown = opps.slice(0, 20);
  const lomba = shown.filter((o) => o.type === "LOMBA");
  const beasiswa = shown.filter((o) => o.type === "BEASISWA");

  const lines: string[] = [];
  lines.push("📢 *LOMBA & BEASISWA FINDER*");
  lines.push(`Ada ${opps.length} kesempatan yang lagi dibuka!`);
  lines.push("");

  const fmt = (o: { title: string; deadline: Date | string; sourceUrl: string }, i: number) => {
    const days = daysLeft(o.deadline);
    const dl = formatDate(o.deadline);
    lines.push(`${i + 1}. ${o.title} — ${dl} (${days === 0 ? "hari ini!" : `${days} hari lagi`})`);
    lines.push(`   ${o.sourceUrl}`);
  };

  if (lomba.length) {
    lines.push(`🏆 *LOMBA (${lomba.length}):*`);
    lomba.forEach(fmt);
    lines.push("");
  }

  if (beasiswa.length) {
    lines.push(`🎓 *BEASISWA (${beasiswa.length}):*`);
    beasiswa.forEach(fmt);
    lines.push("");
  }

  if (opps.length > shown.length) {
    lines.push(`…dan ${opps.length - shown.length} lainnya!`);
    lines.push("");
  }

  lines.push(`🔗 Lihat semua: https://beasiswa-finder-ali.netlify.app`);
  lines.push("_Ditemukan di Lomba & Beasiswa Finder_");

  window.open(`https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
}

/* ─── Calendar export (Google Calendar + .ics) ─── */
interface CalendarOpp {
  id: string;
  title: string;
  deadline: Date | string;
  sourceUrl: string;
  location: string;
  organizer: string;
  type: string;
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function googleCalendarUrl(opp: CalendarOpp): string {
  const dl = new Date(opp.deadline);
  const next = new Date(dl);
  next.setDate(next.getDate() + 1); // end date is exclusive for all-day events
  const emoji = opp.type === "BEASISWA" ? "🎓" : "🏆";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${emoji} ${opp.title}`,  
    dates: `${ymd(dl)}/${ymd(next)}`,
    details: `Deadline pendaftaran ${opp.title}\n\n${emoji} ${opp.organizer}\n📌 ${opp.location}\n\nSumber: ${opp.sourceUrl}`,
    location: opp.location === "online" || opp.location === "ONLINE" ? "Online" : opp.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function icsContent(opp: CalendarOpp): string {
  const dl = new Date(opp.deadline);
  const next = new Date(dl);
  next.setDate(next.getDate() + 1);
  const emoji = opp.type === "BEASISWA" ? "🎓" : "🏆";
  const details = `Deadline pendaftaran ${opp.title}\n${opp.organizer} - ${opp.location}\nSumber: ${opp.sourceUrl}`;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LombaFinder//ID",
    "BEGIN:VEVENT",
    `UID:lombafinder-${opp.id}@lombafinder.app`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${ymd(dl)}`,
    `DTEND;VALUE=DATE:${ymd(next)}`,
    `SUMMARY:${escapeIcs(`${emoji} ${opp.title}`)}`,
    `DESCRIPTION:${escapeIcs(details)}`,
    `URL:${opp.sourceUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function downloadIcs(opp: CalendarOpp) {
  const blob = new Blob([icsContent(opp)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${opp.title.replace(/[^a-z0-9]+/gi, "-").slice(0, 50)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function CalendarExportButton({ opp }: { opp: CalendarOpp }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="rounded-lg p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 transition"
        title="Tambahkan ke kalender"
      >
        📅
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-56 rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(googleCalendarUrl(opp), "_blank", "noopener");
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 transition"
          >
            🗓️ Google Calendar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              downloadIcs(opp);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 transition"
          >
            📥 Download .ics
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── component ─── */
/* ─── Feedback Button Component ─── */
function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [type, setType] = useState<string>("saran");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!feedback.trim()) return;
    // Save to localStorage (simple analytics)
    const existing = JSON.parse(localStorage.getItem("feedback") || "[]");
    existing.push({
      text: feedback,
      type,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    });
    localStorage.setItem("feedback", JSON.stringify(existing));
    setSubmitted(true);
    setTimeout(() => {
      setIsOpen(false);
      setFeedback("");
      setSubmitted(false);
    }, 2000);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-brand-500 p-4 text-white shadow-lg hover:bg-brand-600 transition hover:scale-105"
        title="Kirim Feedback"
      >
        💬
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">💬 Kirim Feedback</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            {submitted ? (
              <div className="py-8 text-center">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-gray-700 dark:text-gray-300">Terima kasih! Feedback kamu sangat berharga.</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Tipe Feedback</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
                  >
                    <option value="saran">💡 Saran Fitur</option>
                    <option value="bug">🐛 Laporan Bug</option>
                    <option value="lomba">🏆 Tambah Lomba</option>
                    <option value="beasiswa">🎓 Tambah Beasiswa</option>
                    <option value="lainnya">📝 Lainnya</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Pesan</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder={
                      type === "lomba"
                        ? "Nama lomba, link, deadline, dll..."
                        : type === "beasiswa"
                        ? "Nama beasiswa, link, deadline, dll..."
                        : "Tulis feedback kamu di sini..."
                    }
                    rows={4}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400"
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!feedback.trim()}
                  className="w-full rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Kirim Feedback
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

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
  const [registeredIds, setRegisteredIds] = useState<string[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

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
    setRegisteredIds(getRegistered());
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
          // Dedupe: only fire once per opportunity per day
          const localNotified = getLocalNotified();
          const todayKey = new Date().toDateString();
          if (localNotified[opp.id] === todayKey) return;
          localNotified[opp.id] = todayKey;
          saveLocalNotified(localNotified);

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

  // Keep the push server in sync with the user's reminders (also heals on mount)
  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    syncPushSubscription(reminderIds);
  }, [reminderIds, notifStatus]);

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

  /* registered toggle */
  const toggleRegistered = (id: string) => {
    setRegisteredIds((prev) => {
      const next = prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id];
      saveRegistered(next);
      return next;
    });
  };

  /* calendar data */
  const calDays = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [calMonth]);

  const getOppsForDay = (day: number) => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    return filtered.filter((o) => {
      const d = new Date(o.deadline);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

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
        <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={() => { setShowCalendar(!showCalendar); setShowReminders(false); }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              showCalendar
                ? "bg-brand-500 text-white shadow-sm"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            📅 Kalender
          </button>
          <button
            onClick={() => shareListWhatsApp(filtered)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 ring-1 ring-green-200 dark:ring-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition"
            title="Bagikan daftar ini ke WhatsApp"
          >
            📤 Share
          </button>
          {reminderIds.length > 0 && (
            <button
              onClick={() => { setShowReminders(!showReminders); setShowCalendar(false); }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                showReminders
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30"
              }`}
            >
              🔔 Reminder ({reminderIds.length})
            </button>
          )}
          {registeredIds.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-xl bg-green-50 dark:bg-green-900/20 px-4 py-2 text-sm font-medium text-green-700 dark:text-green-400 ring-1 ring-green-200 dark:ring-green-800">
              ✅ Sudah Daftar ({registeredIds.length})
            </span>
          )}
        </div>
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
                      {registeredIds.includes(opp.id) && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-900/20 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                          ✅ Sudah Daftar
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
                    <div className="ml-3 flex items-center gap-1">
                      <CalendarExportButton
                        opp={{ id: opp.id, title: opp.title, deadline: opp.deadline, sourceUrl: opp.sourceUrl, location: opp.location, organizer: opp.organizer, type: opp.type }}
                      />
                      <button
                        onClick={() => shareWhatsApp({ title: opp.title, deadline: opp.deadline, sourceUrl: opp.sourceUrl, type: opp.type })}
                        className="rounded-lg p-1.5 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/20 hover:text-green-600 transition"
                        title="Share ke WhatsApp"
                      >
                        💬
                      </button>
                      <button
                        onClick={() => toggleRegistered(opp.id)}
                        className={`rounded-lg p-1.5 transition ${
                          registeredIds.includes(opp.id)
                            ? "bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200"
                            : "text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-500"
                        }`}
                        title={registeredIds.includes(opp.id) ? "Belum daftar" : "Sudah daftar"}
                      >
                        {registeredIds.includes(opp.id) ? "✅" : "☐"}
                      </button>
                      <button
                        onClick={() => toggleReminder(opp.id)}
                        className="rounded-lg p-1.5 text-amber-500 hover:bg-amber-100 hover:text-amber-700 transition"
                        title="Hapus reminder"
                      >
                        🔔✕
                      </button>
                    </div>
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
      {!loading && !showCalendar && (
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Menampilkan <span className="font-semibold text-gray-700 dark:text-gray-300">{filtered.length}</span> dari{" "}
          <span className="font-semibold text-gray-700 dark:text-gray-300">{opportunities.length}</span> kesempatan
        </p>
      )}

      {/* ── Calendar View ── */}
      {showCalendar && !loading && (
        <div className="mb-6 rounded-2xl bg-white dark:bg-gray-800 p-4 shadow-md ring-1 ring-brand-100 dark:ring-gray-700">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              ← Sebelumnya
            </button>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {calMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
            </h3>
            <button
              onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              Selanjutnya →
            </button>
          </div>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-1">
                {d}
              </div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calDays.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const opps = getOppsForDay(day);
              const isToday = new Date().getDate() === day && new Date().getMonth() === calMonth.getMonth() && new Date().getFullYear() === calMonth.getFullYear();
              return (
                <div
                  key={day}
                  className={`relative min-h-[60px] rounded-lg p-1 text-xs transition ${
                    isToday ? "bg-brand-100 dark:bg-brand-900/30 ring-2 ring-brand-400" : opps.length > 0 ? "bg-amber-50 dark:bg-amber-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <span className={`font-medium ${isToday ? "text-brand-700 dark:text-brand-300" : "text-gray-700 dark:text-gray-300"}`}>
                    {day}
                  </span>
                  {opps.slice(0, 2).map((opp) => (
                    <a
                      key={opp.id}
                      href={opp.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block truncate rounded px-1 py-0.5 text-[10px] font-medium mt-0.5 ${
                        opp.type === "BEASISWA"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300"
                      }`}
                      title={opp.title}
                    >
                      {opp.title.length > 15 ? opp.title.slice(0, 15) + "…" : opp.title}
                    </a>
                  ))}
                  {opps.length > 2 && (
                    <span className="block text-[10px] text-gray-500 dark:text-gray-400 px-1">+{opps.length - 2} lagi</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Loading State ── */}
      {loading && !showCalendar && (
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
      {!loading && !showCalendar && filtered.length === 0 && (
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
      {!loading && !showCalendar && filtered.length > 0 && (
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
                  {registeredIds.includes(opp.id) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-semibold text-green-700 dark:text-green-400 ring-1 ring-green-200 dark:ring-green-800">
                      ✅ Sudah Daftar
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

                {/* Deadline + Actions */}
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    Deadline: {formatDate(opp.deadline)}
                  </p>
                  <div className="flex items-center gap-1">
                    {/* Calendar Export */}
                    <CalendarExportButton
                      opp={{ id: opp.id, title: opp.title, deadline: opp.deadline, sourceUrl: opp.sourceUrl, location: opp.location, organizer: opp.organizer, type: opp.type }}
                    />
                    {/* WhatsApp Share */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        shareWhatsApp({ title: opp.title, deadline: opp.deadline, sourceUrl: opp.sourceUrl, type: opp.type });
                      }}
                      className="rounded-lg p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 transition"
                      title="Share ke WhatsApp"
                    >
                      💬
                    </button>
                    {/* Sudah Daftar */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleRegistered(opp.id);
                      }}
                      className={`rounded-lg p-1.5 transition ${
                        registeredIds.includes(opp.id)
                          ? "bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200"
                          : "text-gray-300 hover:bg-gray-100 hover:text-green-500"
                      }`}
                      title={registeredIds.includes(opp.id) ? "Belum daftar" : "Sudah daftar"}
                    >
                      {registeredIds.includes(opp.id) ? "✅" : "☐"}
                    </button>
                    {/* Reminder */}
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

      {/* ── Feedback Button ── */}
      <FeedbackButton />
    </main>
  );
}
