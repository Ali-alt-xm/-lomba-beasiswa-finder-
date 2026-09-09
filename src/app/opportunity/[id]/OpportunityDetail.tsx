"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Opportunity } from "@prisma/client";

type DetailOpp = Omit<Opportunity, "deadline" | "createdAt"> & {
  deadline: string;
  createdAt: string;
};

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
    month: "long",
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

/* ─── reminders (shares localStorage with home page) ─── */
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

/* ─── whatsapp share ─── */
function shareWhatsApp(opp: DetailOpp) {
  const days = daysLeft(opp.deadline);
  const emoji = opp.type === "BEASISWA" ? "🎓" : "🏆";
  const daysText = days < 0 ? "Sudah lewat" : days === 0 ? "Hari ini!" : `${days} hari lagi`;
  const text = `${emoji} ${opp.title}\n\n📅 Deadline: ${formatDate(opp.deadline)} (${daysText})\n🏢 ${opp.organizer}\n📍 ${LOCATION_LABELS[opp.location] || opp.location}\n\n🔗 ${opp.sourceUrl}\n\n_Ditemukan di Lomba & Beasiswa Finder_`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}

/* ─── calendar export ─── */
function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function escapeIcs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function googleCalendarUrl(opp: DetailOpp): string {
  const dl = new Date(opp.deadline);
  const next = new Date(dl);
  next.setDate(next.getDate() + 1);
  const emoji = opp.type === "BEASISWA" ? "🎓" : "🏆";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${emoji} ${opp.title}`,
    dates: `${ymd(dl)}/${ymd(next)}`,
    details: `Deadline pendaftaran ${opp.title}\n\n${emoji} ${opp.organizer}\n📌 ${LOCATION_LABELS[opp.location] || opp.location}\n\nSumber: ${opp.sourceUrl}`,
    location: opp.location === "online" || opp.location === "ONLINE" ? "Online" : opp.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function icsContent(opp: DetailOpp): string {
  const dl = new Date(opp.deadline);
  const next = new Date(dl);
  next.setDate(next.getDate() + 1);
  const emoji = opp.type === "BEASISWA" ? "🎓" : "🏆";
  const details = `Deadline pendaftaran ${opp.title}\n${opp.organizer} - ${LOCATION_LABELS[opp.location] || opp.location}\nSumber: ${opp.sourceUrl}`;
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

function downloadIcs(opp: DetailOpp) {
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

/* ─── alarm checklist (from alarmConfig) ─── */
function getAlarmChecklist(opp: DetailOpp, days: number): string[] {
  if (!opp.alarmConfig || days < 0) return [];
  try {
    const cfg = JSON.parse(opp.alarmConfig as string);
    if (!cfg.checklistItems?.length) return [];
    const visible =
      opp.alarmType === "sidanira"
        ? days <= 14
        : opp.alarmType === "team-league"
        ? days <= 21
        : opp.alarmType === "elite-cup"
        ? days <= 45
        : days <= 7;
    if (!visible) return [];
    return cfg.checklistItems;
  } catch {
    return [];
  }
}

function getAlarmTip(opp: DetailOpp, days: number): string | null {
  if (!opp.alarmConfig || days < 0 || days > 21) return null;
  try {
    const cfg = JSON.parse(opp.alarmConfig as string);
    return cfg.teamTip || null;
  } catch {
    return null;
  }
}

/* ─── component ─── */
export default function OpportunityDetail({ opp }: { opp: DetailOpp }) {
  const [reminderIds, setReminderIds] = useState<string[]>([]);
  const [registeredIds, setRegisteredIds] = useState<string[]>([]);
  const [calOpen, setCalOpen] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);
  const [notifStatus, setNotifStatus] = useState<string>("default");

  useEffect(() => {
    setReminderIds(getReminders());
    setRegisteredIds(getRegistered());
    if ("Notification" in window) setNotifStatus(Notification.permission);
  }, []);

  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    syncPushSubscription(reminderIds);
  }, [reminderIds, notifStatus]);

  useEffect(() => {
    if (!calOpen) return;
    const onClick = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [calOpen]);

  const days = daysLeft(opp.deadline);
  const isExpired = days < 0;
  const isUrgent = days >= 0 && days <= 7;
  const emoji = opp.type === "BEASISWA" ? "🎓" : "🏆";
  const isReminded = reminderIds.includes(opp.id);
  const isRegistered = registeredIds.includes(opp.id);

  const links: { label: string; url: string }[] = (() => {
    if (!opp.links) return [];
    try {
      const parsed = JSON.parse(opp.links as string);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const checklist = getAlarmChecklist(opp, days);
  const teamTip = getAlarmTip(opp, days);

  const toggleReminder = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((p) => setNotifStatus(p));
    }
    setReminderIds((prev) => {
      const next = prev.includes(opp.id) ? prev.filter((r) => r !== opp.id) : [...prev, opp.id];
      saveReminders(next);
      return next;
    });
  };

  const toggleRegistered = () => {
    setRegisteredIds((prev) => {
      const next = prev.includes(opp.id) ? prev.filter((r) => r !== opp.id) : [...prev, opp.id];
      saveRegistered(next);
      return next;
    });
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      {/* ── Back ── */}
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
      >
        ← Kembali ke daftar
      </Link>

      {/* ── Badges ── */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className={opp.type === "BEASISWA" ? "badge-beasiswa" : "badge-lomba"}>
          {opp.type === "BEASISWA" ? "🎓 Beasiswa" : "🏆 Lomba"}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
            (opp.organizerType || "private") === "dinas"
              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 ring-1 ring-blue-300 dark:ring-blue-800"
              : "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 ring-1 ring-purple-300 dark:ring-purple-800"
          }`}
        >
          {(opp.organizerType || "private") === "dinas" ? "🏛️ DINAS / PEMERINTAH" : "🏢 SWASTA / PRIVATE"}
        </span>
        {opp.alarmType === "sidanira" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-900/20 px-2 py-0.5 text-xs font-semibold text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-800">
            🚨 Sidanira — Resmi Pemerintah
          </span>
        )}
        {opp.alarmType === "elite-cup" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800">
            ⚡ Elite Cup
          </span>
        )}
        {opp.alarmType === "team-league" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-900/20 px-2 py-0.5 text-xs font-semibold text-green-700 dark:text-green-400 ring-1 ring-green-200 dark:ring-green-800">
            👥 Kompetisi Tim
          </span>
        )}
        {opp.isRecurring && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-400">
            🔁 Tahunan
          </span>
        )}
      </div>

      {/* ── Title ── */}
      <h1 className="mb-2 text-2xl font-extrabold leading-tight text-gray-900 dark:text-white sm:text-3xl">
        {emoji} {opp.title}
      </h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Diselenggarakan oleh <span className="font-semibold text-gray-700 dark:text-gray-300">{opp.organizer}</span>
      </p>

      {/* ── Deadline card ── */}
      <div
        className={`mb-6 rounded-2xl p-5 shadow-sm ring-1 ${
          isExpired
            ? "bg-red-50 dark:bg-red-900/20 ring-red-200 dark:ring-red-800"
            : isUrgent
            ? "bg-red-50 dark:bg-red-900/20 ring-red-200 dark:ring-red-800"
            : days <= 30
            ? "bg-amber-50 dark:bg-amber-900/20 ring-amber-200 dark:ring-amber-800"
            : "bg-green-50 dark:bg-green-900/20 ring-green-200 dark:ring-green-800"
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Deadline Pendaftaran</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{formatDate(opp.deadline)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {isExpired ? "Status" : isUrgent ? "Segera! 🔥" : "Sisa waktu"}
            </p>
            <p className={`text-2xl font-extrabold ${isExpired ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>
              {isExpired ? "Sudah lewat" : days === 0 ? "Hari ini!" : `${days} hari lagi`}
            </p>
          </div>
        </div>
        {/* Smart alarm checklist */}
        {!isExpired && (checklist.length > 0 || teamTip) && (
          <div className="mt-4 rounded-xl bg-white dark:bg-gray-800 p-3">
            <p className="mb-2 text-xs font-bold text-gray-700 dark:text-gray-300">
              📋 Action Items{" "}
              {opp.alarmType === "sidanira" && <span className="text-red-500">(Surat rekomendasi sekolah!)</span>}
            </p>
            <ul className="space-y-1">
              {checklist.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="mt-0.5">▸</span>
                  <span>{item}</span>
                </li>
              ))}
              {teamTip && (
                <li className="mt-2 rounded-lg bg-green-50 dark:bg-green-900/20 px-2 py-1.5 text-sm font-medium text-green-700 dark:text-green-400">
                  {teamTip}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* ── Main CTA ── */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <a
          href={opp.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-brand-600 transition text-center"
        >
          {opp.type === "BEASISWA" ? "🎓 Lihat & Daftar Beasiswa" : "🏆 Daftar Lomba"}
        </a>
        <button
          onClick={toggleRegistered}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition ring-1 ${
            isRegistered
              ? "bg-green-500 text-white ring-green-500 hover:bg-green-600"
              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 ring-gray-200 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          {isRegistered ? "✅ Sudah Daftar — Klik untuk batal" : "☐ Tandai Sudah Daftar"}
        </button>
      </div>

      {/* ── Action row: reminder, calendar, share ── */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <button
          onClick={toggleReminder}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ring-1 ${
            isReminded
              ? "bg-amber-500 text-white ring-amber-500 hover:bg-amber-600"
              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 ring-gray-200 dark:ring-gray-700 hover:bg-amber-50 dark:hover:bg-gray-700"
          }`}
        >
          {isReminded ? "🔔 Reminder Aktif" : "🔕 Set Reminder"}
        </button>
        {isReminded && notifStatus !== "granted" && (
          <span className="text-xs text-amber-600 dark:text-amber-400">
            💡 Izinkan notifikasi browser agar alert tetap muncul walau app ditutup.
          </span>
        )}

        <div className="relative" ref={calRef}>
          <button
            onClick={() => setCalOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 ring-1 ring-gray-200 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            📅 Simpan ke Kalender
          </button>
          {calOpen && (
            <div className="absolute left-0 z-30 mt-1 w-56 rounded-xl border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <button
                onClick={() => {
                  window.open(googleCalendarUrl(opp), "_blank", "noopener");
                  setCalOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 transition"
              >
                🗓️ Google Calendar
              </button>
              <button
                onClick={() => {
                  downloadIcs(opp);
                  setCalOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 transition"
              >
                📥 Download .ics
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => shareWhatsApp(opp)}
          className="inline-flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-900/20 px-4 py-2 text-sm font-semibold text-green-700 dark:text-green-400 ring-1 ring-green-200 dark:ring-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition"
        >
          💬 Share WhatsApp
        </button>
      </div>

      {/* ── Info grid ── */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white dark:bg-gray-800 p-3 ring-1 ring-gray-100 dark:ring-gray-700">
          <p className="text-[11px] font-medium text-gray-400">Kategori</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{CATEGORY_LABELS[opp.category] || opp.category}</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-800 p-3 ring-1 ring-gray-100 dark:ring-gray-700">
          <p className="text-[11px] font-medium text-gray-400">Bidang</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{FIELD_LABELS[opp.field] || opp.field}</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-800 p-3 ring-1 ring-gray-100 dark:ring-gray-700">
          <p className="text-[11px] font-medium text-gray-400">Lokasi</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{LOCATION_LABELS[opp.location] || opp.location}</p>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-800 p-3 ring-1 ring-gray-100 dark:ring-gray-700">
          <p className="text-[11px] font-medium text-gray-400">Penyelenggara</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-2">{opp.organizer}</p>
        </div>
      </div>

      {/* ── Description ── */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">📝 Deskripsi</h2>
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-5 shadow-sm ring-1 ring-gray-100 dark:ring-gray-700">
          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {opp.description}
          </p>
        </div>
      </section>

      {/* ── Eligibility ── */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">✅ Syarat & Ketentuan</h2>
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-5 shadow-sm ring-1 ring-gray-100 dark:ring-gray-700">
          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {opp.eligibility || "Cek halaman sumber untuk persyaratan lengkap."}
          </p>
        </div>
      </section>

      {/* ── Important links ── */}
      {links.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">🔗 Link Penting</h2>
          <div className="space-y-2">
            {links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-xl bg-white dark:bg-gray-800 px-4 py-3 text-sm font-medium text-brand-600 dark:text-brand-400 ring-1 ring-brand-100 dark:ring-gray-700 hover:bg-brand-50 dark:hover:bg-gray-700 transition"
              >
                <span className="truncate">{link.label}</span>
                <span className="shrink-0 text-gray-400">↗</span>
              </a>
            ))}
            <a
              href={opp.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-xl bg-white dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 ring-1 ring-gray-100 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <span>🌐 Halaman sumber resmi</span>
              <span className="shrink-0 text-gray-400">↗</span>
            </a>
          </div>
        </section>
      )}

      {/* ── Footer note ── */}
      <footer className="border-t border-brand-100 dark:border-gray-700 py-6 text-center text-xs text-gray-400 dark:text-gray-500">
        Info ini dikumpulkan otomatis — selalu cek halaman sumber untuk detail terbaru. <br />
        Lomba & Beasiswa Finder
      </footer>
    </main>
  );
}