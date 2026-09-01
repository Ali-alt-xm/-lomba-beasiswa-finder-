"use client";

import { useState, useEffect, useCallback } from "react";
import type { Opportunity } from "@prisma/client";
import { useTheme } from "../ThemeProvider";

const TYPES = ["BEASISWA", "LOMBA"] as const;
const CATEGORIES = ["SD", "SMP", "SMA_SMK", "KULIAH"] as const;
const LOCATIONS = [
  "ONLINE", "JAKARTA", "BANDUNG", "SURABAYA",
  "YOGYAKARTA", "SEMARANG", "MEDAN", "MAKASSAR", "BALIKPAPAN", "OTHER",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  SD: "🎒 SD", SMP: "📚 SMP", SMA_SMK: "🏫 SMA/SMK", KULIAH: "🎓 Kuliah",
};

const LOCATION_LABELS: Record<string, string> = {
  ONLINE: "💻 Online", JAKARTA: "🏙️ Jakarta", BANDUNG: "🏔️ Bandung",
  SURABAYA: "🌊 Surabaya", YOGYAKARTA: "🏛️ Yogya", SEMARANG: "🌄 Semarang",
  MEDAN: "🌿 Medan", MAKASSAR: "🌴 Makassar", BALIKPAPAN: "🛢️ Balikpapan",
  OTHER: "📍 Lainnya",
};

const FIELDS = ["akademik", "non_akademik", "sains_teknologi", "seni_budaya", "olahraga", "sosial", "bisnis", "umum"] as const;

const FIELD_LABELS: Record<string, string> = {
  akademik: "📚 Akademik", non_akademik: "🎯 Non-Akademik",
  sains_teknologi: "💻 Sains & Teknologi", seni_budaya: "🎨 Seni & Budaya",
  olahraga: "⚽ Olahraga", sosial: "🤝 Sosial & Kemanusiaan",
  bisnis: "💼 Bisnis & Kewirausahaan", umum: "📋 Umum",
};

type FormState = {
  title: string;
  type: string;
  category: string;
  field: string;
  description: string;
  organizer: string;
  deadline: string;
  location: string;
  eligibility: string;
  sourceUrl: string;
  imageUrl: string;
};

const emptyForm: FormState = {
  title: "", type: "BEASISWA", category: "KULIAH", field: "umum",
  description: "", organizer: "", deadline: "", location: "ONLINE",
  eligibility: "", sourceUrl: "", imageUrl: "",
};

export default function AdminPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchOpportunities = useCallback(async () => {
    try {
      const res = await fetch("/api/opportunities");
      const data = await res.json();
      setOpportunities(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOpportunities(); }, [fetchOpportunities]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingId
        ? `/api/opportunities/${editingId}`
        : "/api/opportunities";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          imageUrl: form.imageUrl || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      showMessage("success", editingId ? "✅ Berhasil diupdate!" : "✅ Berhasil ditambahkan!");
      setForm(emptyForm);
      setEditingId(null);
      fetchOpportunities();
    } catch {
      showMessage("error", "❌ Gagal menyimpan data");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (opp: Opportunity) => {
    setForm({
      title: opp.title,
      type: opp.type,
      category: opp.category,
      field: opp.field || "umum",
      description: opp.description,
      organizer: opp.organizer,
      deadline: new Date(opp.deadline).toISOString().split("T")[0],
      location: opp.location,
      eligibility: opp.eligibility,
      sourceUrl: opp.sourceUrl,
      imageUrl: opp.imageUrl || "",
    });
    setEditingId(opp.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin mau hapus ini?")) return;

    try {
      const res = await fetch(`/api/opportunities/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      showMessage("success", "🗑️ Berhasil dihapus!");
      fetchOpportunities();
    } catch {
      showMessage("error", "❌ Gagal menghapus data");
    }
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const { resolvedTheme, setTheme } = useTheme();

  const inputClass =
    "w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200";

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            ⚙️ Admin Panel
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Kelola data beasiswa & lomba</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="rounded-lg bg-gray-100 dark:bg-gray-800 p-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition ring-1 ring-gray-200 dark:ring-gray-700"
            title={resolvedTheme === "dark" ? "Mode terang" : "Mode gelap"}
          >
            {resolvedTheme === "dark" ? "☀️" : "🌙"}
          </button>
          <a
            href="/"
            className="rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition ring-1 ring-gray-200 dark:ring-gray-700"
          >
            ← Kembali ke Beranda
          </a>
        </div>
      </header>

      {/* Flash message */}
      {message && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 text-green-700 ring-1 ring-green-200"
              : "bg-red-50 text-red-700 ring-1 ring-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="mb-8 rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-md ring-1 ring-brand-100 dark:ring-gray-700"
      >
        <h2 className="mb-4 text-lg font-bold text-gray-800 dark:text-white">
          {editingId ? "✏️ Edit Kesempatan" : "➕ Tambah Kesempatan Baru"}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Title */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="mb-1 block text-xs font-medium text-gray-500">Judul *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Contoh: Beasiswa LPDP 2026"
              className={inputClass}
            />
          </div>

          {/* Type */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Tipe *</label>
            <select
              required
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className={inputClass}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "BEASISWA" ? "🎓 Beasiswa" : "🏆 Lomba"}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Jenjang *</label>
            <select
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={inputClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Lokasi *</label>
            <select
              required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className={inputClass}
            >
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>{LOCATION_LABELS[l] || l}</option>
              ))}
            </select>
          </div>

          {/* Field */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Bidang *</label>
            <select
              required
              value={form.field}
              onChange={(e) => setForm({ ...form, field: e.target.value })}
              className={inputClass}
            >
              {FIELDS.map((f) => (
                <option key={f} value={f}>{FIELD_LABELS[f]}</option>
              ))}
            </select>
          </div>

          {/* Organizer */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Penyelenggara *</label>
            <input
              type="text"
              required
              value={form.organizer}
              onChange={(e) => setForm({ ...form, organizer: e.target.value })}
              placeholder="Contoh: Kementerian Pendidikan RI"
              className={inputClass}
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Deadline *</label>
            <input
              type="date"
              required
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className={inputClass}
            />
          </div>

          {/* Source URL */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">URL Sumber *</label>
            <input
              type="url"
              required
              value={form.sourceUrl}
              onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
              placeholder="https://..."
              className={inputClass}
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">URL Gambar (opsional)</label>
            <input
              type="url"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://..."
              className={inputClass}
            />
          </div>

          {/* Description */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="mb-1 block text-xs font-medium text-gray-500">Deskripsi *</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Jelaskan tentang beasiswa/lomba ini..."
              className={inputClass}
            />
          </div>

          {/* Eligibility */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="mb-1 block text-xs font-medium text-gray-500">Eligibilitas / Syarat *</label>
            <textarea
              required
              rows={2}
              value={form.eligibility}
              onChange={(e) => setForm({ ...form, eligibility: e.target.value })}
              placeholder="Contoh: WNI, mahasiswa aktif S1, IPK min 3.0"
              className={inputClass}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 transition disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : editingId ? "💾 Update" : "➕ Simpan"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-xl bg-gray-100 px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-200 transition"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-md ring-1 ring-brand-100 dark:ring-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            📋 Data ({opportunities.length} entries)
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : opportunities.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Belum ada data</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 uppercase">
                <tr>
                  <th className="px-4 py-3">Judul</th>
                  <th className="px-4 py-3">Tipe</th>
                  <th className="px-4 py-3">Jenjang</th>
                  <th className="px-4 py-3">Bidang</th>
                  <th className="px-4 py-3">Lokasi</th>
                  <th className="px-4 py-3">Deadline</th>
                  <th className="px-4 py-3">Penyelenggara</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {opportunities.map((opp) => {
                  const deadline = new Date(opp.deadline);
                  const days = Math.ceil(
                    (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <tr key={opp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-[250px] truncate">
                        {opp.title}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            opp.type === "BEASISWA" ? "badge-beasiswa" : "badge-lomba"
                          }
                        >
                          {opp.type === "BEASISWA" ? "🎓" : "🏆"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {CATEGORY_LABELS[opp.category] || opp.category}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {FIELD_LABELS[opp.field || "umum"] || opp.field}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {LOCATION_LABELS[opp.location] || opp.location}
                      </td>
                      <td className="px-4 py-3">
                        <span className={days <= 7 ? "text-red-600 font-semibold" : "text-gray-600"}>
                          {deadline.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                          {days >= 0 && ` (${days}h)`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[180px] truncate">
                        {opp.organizer}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(opp)}
                          className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(opp.id)}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition"
                        >
                          🗑️ Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
