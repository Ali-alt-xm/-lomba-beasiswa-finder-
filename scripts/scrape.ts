/**
 * Scraper for real scholarship & competition data.
 *
 * Sources:
 *  1. https://luarkampus.id/beasiswa     — Scholarship calendar
 *  2. https://luarkampus.id/events        — Lomba / events (JSON in wire:snapshot)
 *  3. https://indbeasiswa.com             — Comprehensive scholarship list
 *  4. https://kompetisionline.com         — Kompetisi online terkurasi
 *  5. https://kompetisinasional.com       — Kompetisi nasional terkurasi
 *  6. https://pusatprestasinasional...    — Puspresnas national events
 *
 * Instagram requires auth and cannot be scraped. Use /admin for those.
 *
 * Usage: npx tsx scripts/scrape.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Types ───────────────────────────────────────────────────────
interface ScrapedEntry {
  title: string;
  type: "BEASISWA" | "LOMBA";
  category: string;
  description: string;
  organizer: string;
  deadline: Date;
  location: string;
  eligibility: string;
  sourceUrl: string;
  imageUrl: string | null;
  field: string;
  links?: { label: string; url: string }[];
  organizerType?: string; // "dinas" | "private"
  alarmType?: string; // "standard" | "sidanira" | "team-league" | "elite-cup"
  alarmConfig?: string; // JSON config
  isRecurring?: boolean;
}

// Classify organizer as dinas (government) or private
function classifyOrganizerType(organizer: string, title: string): string {
  const text = (organizer + " " + title).toLowerCase();
  const dinasKeywords = [
    // Ministry level
    "kemendikdasmen", "kemendikbud", "kemenristek", "kemenkes", "kemenag",
    // Puspresnas & BPTI (official talent branch)
    "puspresnas", "pusat prestasi nasional", "bpti", "balai pengembangan talenta",
    // Provincial/city education offices
    "dinas pendidikan", "disdik", "dispora",
    // Kemenag (Ministry of Religious Affairs — runs KSM for madrasah)
    "kementerian agama", "ksm", "kompetisi sains madrasah",
    // Other government bodies
    "brin", "bpjs", "pip", "kip",
    "pemerintah", "republik indonesia",
    "bank indonesia", "ojk",
    // OSN/O2SN/FLS2N (government-run national competitions)
    "osn", "o2sn", "fls2n",
  ];
  return dinasKeywords.some(kw => text.includes(kw)) ? "dinas" : "private";
}

// Classify alarm type
function classifyAlarmType(title: string, organizer: string, organizerType: string, description: string): string {
  const text = (title + " " + organizer + " " + description).toLowerCase();

  // Sidanira: Government events requiring school letters
  const sidaniraKw = ["osn", "o2sn", "fls2n", "puspresnas", "bpti", "kemendikdasmen", "disdik", "dispora", "kemenag", "ksm", "kompetisi nasional", "dekomnas", "konstanta", "educom", "pip", "kip"];
  if (organizerType === "dinas" || sidaniraKw.some(kw => text.includes(kw))) return "sidanira";

  // Team-league: Corporate/team leagues
  const teamKw = ["dbl", "development basketball league", "axis nation cup", "futsal", "basket", "mini soccer"];
  if (teamKw.some(kw => text.includes(kw))) return "team-league";

  // Elite-cup: High-demand school cups
  const eliteKw = ["toc", "thamrin olimpiad", "cc cup", "canisius college cup", "limau cup", "tarki cup", "acex", "math quiz", "olimpiade matematika", "programming"];
  if (eliteKw.some(kw => text.includes(kw))) return "elite-cup";

  return "standard";
}

function generateAlarmConfig(alarmType: string): string {
  const configs: Record<string, any> = {
    sidanira: {
      daysBefore: 14,
      checklistItems: [
        "📋 Ajukan surat rekomendasi sekolah ke kepala sekolah",
        "📝 Pastikan rapor dan piagam sudah lengkap",
        "🏫 Konfirmasi kuota sekolah untuk ajang ini",
        "📱 Cek WAG resmi peserta",
      ],
    },
    "team-league": {
      daysBefore: 21,
      checklistItems: [
        "👥 Koordinasi dengan pelatih/wali tim",
        "📋 Kumpulkan data tim (nama, NIS, asal sekolah)",
        "💰 Siapkan uang pendaftaran tim",
        "📸 Foto tim untuk keperluan registrasi",
      ],
      teamTip: "⚡ Registration opens soon! Share this link with your sports coach to register your school squad before slots fill up.",
    },
    "elite-cup": {
      daysBefore: 30,
      earlyBird: true,
      earlyBirdDays: 45,
      checklistItems: [
        "⚡ Slots for popular cabang cap out FAST — register early!",
        "📝 Persiapkan materi latihan 2-3 bulan sebelumnya",
        "👥 Bentuk tim atau daftar individual sesuai cabang",
        "📱 Follow Instagram penyelenggara untuk info terbaru",
      ],
    },
    standard: {
      daysBefore: 7,
      checklistItems: [
        "📝 Cek persyaratan pendaftaran",
        "📅 Catat tanggal penting",
        "📱 Simpan link pendaftaran",
      ],
    },
  };
  return JSON.stringify(configs[alarmType] || configs.standard);
}

function detectRecurring(title: string): boolean {
  return /vol\.\s*\d+/i.test(title) || /\d{1,2}(st|nd|rd|th|ᵗʰ)/i.test(title) || /ke-\d+/i.test(title) ||
    ["DBL", "AXIS Nation Cup", "TOC", "CC CUP", "OMITS"].some(kw => title.toUpperCase().includes(kw));
}

// ─── Helpers ─────────────────────────────────────────────────────
function categorizeLevel(text: string): string {
  const lower = text.toLowerCase();
  // Explicit university level
  if (/s3|doktoral|doctoral/.test(lower)) return "KULIAH";
  if (/\bs2\b|magister|master/.test(lower)) return "KULIAH";
  if (/\bs1\b|sarjana|undergraduate/.test(lower)) return "KULIAH";
  if (/\bd3\b|\bd4\b|diploma|vokasi/.test(lower)) return "KULIAH";
  if (/mahasiswa|kuliahan|kuliah/.test(lower)) return "KULIAH";
  // Explicit school level
  if (/\bsma\b|\bsmk\b|sma\/smk|\bma\b/.test(lower)) return "SMA_SMK";
  if (/\bsmp\b|\bmts\b/.test(lower)) return "SMP";
  if (/\bsd\b|\bmi\b/.test(lower)) return "SD";
  // Heuristic: pelajar/siswa → SMA_SMK (most competitions target this)
  if (/pelajar|siswa|lulusan|sekolah menengah/.test(lower)) return "SMA_SMK";
  // Heuristic: competitions without level → SMA_SMK
  if (/lomba|kompetisi|olimpiade|olympiad|cup|competition|hackathon|quiz/.test(lower)) return "SMA_SMK";
  return "SMA_SMK";
}

function categorizeField(title: string, desc: string): string {
  const t = (title + " " + desc).toLowerCase();
  if (/sains|ilmu pengetahuan|matematika|ipa|fisika|kimia|biologi|komputer|teknologi|informatika|robot|ai|hackathon|coding|programming|sains|olympiade|olimpiade/.test(t)) return "sains_teknologi";
  if (/seni|film|musik|lagu|tari|gambar|fotografi|desain|creative|creativity/.test(t)) return "seni_budaya";
  if (/olahraga|sport|futsal|basket|voli|atletik|catur/.test(t)) return "olahraga";
  if (/debat|essay|menulis|opini|public speaking|karya tulis|ilmiah|penelitian|policy|paper/.test(t)) return "akademik";
  if (/bisnis|kewirausahaan|business|startup|entrepreneur|ekonomi|keuangan|business plan/.test(t)) return "bisnis";
  if (/sosial|kemanusiaan|lingkungan|zakat|peduli|relawan|volunteer|sdg/.test(t)) return "sosial";
  return "umum";
}

function categorizeLocation(text: string): string {
  const lower = text.toLowerCase();
  if (/online|daring|virtual|🌐|via zoom/i.test(lower)) return "ONLINE";
  if (/jakarta|jabodetabek/i.test(lower)) return "JAKARTA";
  if (/bandung/i.test(lower)) return "BANDUNG";
  if (/surabaya/i.test(lower)) return "SURABAYA";
  if (/yogyakarta|yogya|jogja/i.test(lower)) return "YOGYAKARTA";
  if (/semarang/i.test(lower)) return "SEMARANG";
  if (/medan/i.test(lower)) return "MEDAN";
  if (/makassar/i.test(lower)) return "MAKASSAR";
  if (/balikpapan/i.test(lower)) return "BALIKPAPAN";
  if (/(prancis|france|jerman|germany|inggris|uk|amerika|usa|singapura|jepang|turki|swedia|belanda|china|brunei|qatar|arab|korea|australia|malaysia)/i.test(lower))
    return "ONLINE";
  return "ONLINE";
}

function parseIndonesianDate(dateStr: string): Date | null {
  const monthMap: Record<string, number> = {
    januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6,
    juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12,
    jan: 1, feb: 2, mar: 3, apr: 4, jun: 6,
    jul: 7, agt: 8, sep: 9, okt: 10, nov: 11, des: 12,
  };
  const match = dateStr.match(/(\d{1,2})\s*(\w+)\s*(\d{4})/i);
  if (!match) return null;
  const month = monthMap[match[2].toLowerCase()];
  if (!month) return null;
  return new Date(parseInt(match[3]), month - 1, parseInt(match[1]));
}

// ─── Scraper 1: luarkampus.id/beasiswa ──────────────────────────
async function scrapeLuarkampusBeasiswa(): Promise<ScrapedEntry[]> {
  console.log("📡 [1/5] luarkampus.id/beasiswa...");
  try {
    const res = await fetch("https://luarkampus.id/beasiswa", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BeasiswaFinder/1.0)" },
    });
    const html = await res.text();
    const entries: ScrapedEntry[] = [];

    // Extract structured data from wire:snapshot JSON
    const snapshotRegex = /wire:snapshot="(\{[^"]*\})"/g;
    let match;
    while ((match = snapshotRegex.exec(html)) !== null) {
      try {
        const decoded = match[1]
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, "&");
        const data = JSON.parse(decoded);
        const d = data.data;
        if (!d?.name) continue;
        // Beasiswa entries have scholarship_id, events have event_id and type=event
        if (d.type === "event") continue; // skip events in beasiswa scraper
        const deadline = parseIndonesianDate(d.close_date || d.end_date || d.deadline || "");
        if (!deadline || deadline < new Date()) continue;
        const degrees = Array.isArray(d.degrees) ? d.degrees.flat().filter((x: string) => typeof x === "string").join(", ") : "Cek website";

        const beasiswaLinks: { label: string; url: string }[] = [];
        if (d.url) beasiswaLinks.push({ label: "📝 Lihat Detail & Cara Daftar", url: d.url });

        entries.push({
          title: d.name,
          type: "BEASISWA",
          category: categorizeLevel(d.name + " " + degrees),
          description: `${d.name}. Penyelenggara: ${d.organizer || "Lihat website"}.`,
          organizer: d.organizer || "Lihat website",
          deadline,
          location: categorizeLocation(d.location || "ONLINE"),
          eligibility: `Jenjang: ${degrees}`,
          sourceUrl: d.url || `https://luarkampus.id/beasiswa`,
          imageUrl: d.image_url || null,
          field: categorizeField(d.name, d.organizer || ""),
          links: beasiswaLinks,
        });
      } catch {
        // skip invalid JSON
      }
    }

    console.log(`   ✅ ${entries.length} entries`);
    return entries;
  } catch (err) {
    console.error("   ❌ Failed:", err);
    return [];
  }
}

// ─── Scraper 2: luarkampus.id/events (lomba) ────────────────────
async function scrapeLuarkampusEvents(): Promise<ScrapedEntry[]> {
  console.log("📡 [2/5] luarkampus.id/events...");
  try {
    const res = await fetch("https://luarkampus.id/events", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BeasiswaFinder/1.0)" },
    });
    const html = await res.text();
    const entries: ScrapedEntry[] = [];

    // Extract structured data from wire:snapshot JSON
    const snapshotRegex = /wire:snapshot="(\{[^"]*\})"/g;
    let match;
    while ((match = snapshotRegex.exec(html)) !== null) {
      try {
        const decoded = match[1]
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, "&");
        const data = JSON.parse(decoded);
        if (data.data?.type === "event") {
          const d = data.data;
          const deadline = parseIndonesianDate(d.end_date || "");
          if (!deadline || deadline < new Date()) continue;

          const eventLinks: { label: string; url: string }[] = [];
          if (d.url) eventLinks.push({ label: "📝 Lihat Detail & Daftar", url: d.url });

          entries.push({
            title: d.name,
            type: "LOMBA",
            category: categorizeLevel(d.name + " " + (d.degrees?.flat?.()?.join(" ") || "")),
            description: `${d.name}. Penyelenggara: ${d.organizer || "Lihat website"}. Level: ${d.level || "Nasional"}. Pendanaan: ${d.funding_type || "Self Funded"}.`,
            organizer: d.organizer || "Lihat website",
            deadline,
            location: categorizeLocation(d.location || "ONLINE"),
            eligibility: `Jenjang: ${d.degrees?.flat?.()?.join(", ") || "Cek website"}`,
            sourceUrl: d.url || `https://luarkampus.id/events`,
            imageUrl: d.image_url || null,
            field: categorizeField(d.name, d.organizer || ""),
            links: eventLinks,
          });
        }
      } catch {
        // skip invalid JSON
      }
    }

    console.log(`   ✅ ${entries.length} entries`);
    return entries;
  } catch (err) {
    console.error("   ❌ Failed:", err);
    return [];
  }
}

// ─── Scraper 3: indbeasiswa.com ──────────────────────────────────
async function scrapeIndbeasiswa(): Promise<ScrapedEntry[]> {
  console.log("📡 [3/5] indbeasiswa.com...");
  try {
    const res = await fetch(
      "https://indbeasiswa.com/daftar-beasiswa-2026-beasiswa-2027/",
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; BeasiswaFinder/1.0)" } }
    );
    const html = await res.text();
    const entries: ScrapedEntry[] = [];

    const linkBlocks = html.split(
      /Info\s+(?:Selengkapnya|Pendaftaran|Cara Mendaftar):/gi
    );

    for (let i = 0; i < linkBlocks.length - 1; i++) {
      const block = linkBlocks[i];
      const nextBlock = linkBlocks[i + 1];

      const titleMatch = block.match(
        /(?:<strong>|<b>|<h[2-4][^>]*>)\s*(.*?)\s*(?:<\/strong>|<\/b>|<\/h[2-4]>)/gi
      );
      if (!titleMatch) continue;

      const title = titleMatch[titleMatch.length - 1]
        .replace(/<[^>]+>/g, "").trim();
      if (title.length < 10) continue;

      const deadlineMatch = block.match(
        /Deadline[:\s]*(\d{1,2})\s*(\w+)\s*(\d{4})/i
      );
      if (!deadlineMatch) continue;
      const deadline = parseIndonesianDate(`${deadlineMatch[1]} ${deadlineMatch[2]} ${deadlineMatch[3]}`);
      if (!deadline || deadline < new Date()) continue;

      const linkMatch = nextBlock.match(/href="(https?:\/\/indbeasiswa\.com[^"]*)"/i);
      const orgMatch = block.match(
        /Penyelenggara[:\s]*(.*?)(?:\n|<br|Bentuk|Cakupan|Deadline)/i
      );

      entries.push({
        title,
        type: "BEASISWA",
        category: categorizeLevel(title + " " + block),
        description: title,
        organizer: orgMatch?.[1]?.replace(/<[^>]+>/g, "").trim() || "Lihat website",
        deadline,
        location: categorizeLocation(title + " " + block),
        eligibility: "Cek website resmi",
        sourceUrl:
          linkMatch?.[1] || "https://indbeasiswa.com/daftar-beasiswa-2026-beasiswa-2027/",
        imageUrl: null,
        field: categorizeField(title, title),
      });
    }
    console.log(`   ✅ ${entries.length} entries`);
    return entries;
  } catch (err) {
    console.error("   ❌ Failed:", err);
    return [];
  }
}

// ─── Scraper 4: kompetisionline.com ──────────────────────────────
async function scrapeKompetisiOnline(): Promise<ScrapedEntry[]> {
  console.log("📡 [4/5] kompetisionline.com...");
  try {
    const res = await fetch("https://kompetisionline.com/", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BeasiswaFinder/1.0)" },
    });
    const html = await res.text();
    const entries: ScrapedEntry[] = [];

    // Parse HTML: each event has a card with name + dates
    // Split by h3 tags containing event names
    const cardRegex = /<h3[^>]*>([\s\S]*?)<\/h3>[\s\S]*?Penyisihan[\s\S]*?<span[^>]*>(\d{1,2} \w+ \d{4})<\/span>[\s\S]*?Final[\s\S]*?<span[^>]*>(\d{1,2} \w+ \d{4})<\/span>/gi;
    let match;
    while ((match = cardRegex.exec(html)) !== null) {
      const title = match[1].replace(/<[^>]+>/g, "").trim();
      if (title.length < 5) continue;

      const deadline = parseIndonesianDate(match[2]);
      if (!deadline || deadline < new Date()) continue;

      entries.push({
        title,
        type: "LOMBA",
        category: categorizeLevel(title),
        description: `${title}. Kompetisi online nasional terkurasi Puspresnas.`,
        organizer: "Kompetisi Online Prestasi Nusantara",
        deadline,
        location: "ONLINE",
        eligibility: "Pelajar/mahasiswa aktif, kuota terbatas",
        sourceUrl: "https://kompetisionline.com/",
        imageUrl: null,
        field: categorizeField(title, title),
      });
    }

    console.log(`   ✅ ${entries.length} entries`);
    return entries;
  } catch (err) {
    console.error("   ❌ Failed:", err);
    return [];
  }
}

// ─── Scraper 5: kompetisinasional.com ────────────────────────────
async function scrapeKompetisiNasional(): Promise<ScrapedEntry[]> {
  console.log("📡 [5/5] kompetisinasional.com...");
  try {
    const res = await fetch("https://kompetisinasional.com/index", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BeasiswaFinder/1.0)" },
    });
    const html = await res.text();
    const entries: ScrapedEntry[] = [];

    // Extract from wire:snapshot JSON
    const snapshotRegex = /wire:snapshot="(\{[^"]*\})"/g;
    let match;
    while ((match = snapshotRegex.exec(html)) !== null) {
      try {
        const decoded = match[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&");
        const data = JSON.parse(decoded);
        const d = data.data;
        if (d?.name && (d?.end_date || d?.deadline)) {
          const deadline = parseIndonesianDate(d.end_date || d.deadline || "");
          if (!deadline || deadline < new Date()) continue;
          entries.push({
            title: d.name,
            type: "LOMBA",
            category: categorizeLevel(d.name),
            description: `${d.name}. Penyelenggara: ${d.organizer || "Kompetisi Nasional Prestasi Nusantara"}.`,
            organizer: d.organizer || "Kompetisi Nasional Prestasi Nusantara",
            deadline,
            location: "ONLINE",
            eligibility: "Pelajar/mahasiswa aktif, kuota terbatas",
            sourceUrl: d.url || "https://kompetisinasional.com/index",
            imageUrl: d.image_url || null,
            field: categorizeField(d.name, d.organizer || ""),
          });
        }
      } catch {
        // skip
      }
    }

    // Fallback: parse HTML
    if (entries.length === 0) {
      const pattern =
        /(September|Oktober|November|Desember|Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus)\s*\d{4}\s*([\w\s()]+?)\s*BATCH\s*\d+/gi;
      let m;
      while ((m = pattern.exec(html)) !== null) {
        const title = m[2].trim();
        if (title.length < 5) continue;

        const laterText = html.substring(m.index, m.index + 500);
        const penDate = laterText.match(/Penyisihan\s*(\d{1,2})\s*(\w+)\s*(\d{4})/i);
        const finDate = laterText.match(/Final\s*(\d{1,2})\s*(\w+)\s*(\d{4})/i);
        if (!penDate || !finDate) continue;

        const deadline = parseIndonesianDate(`${penDate[1]} ${penDate[2]} ${penDate[3]}`);
        if (!deadline || deadline < new Date()) continue;

        entries.push({
          title,
          type: "LOMBA",
          category: categorizeLevel(title),
          description: `Kompetisi nasional terkurasi Puspresnas. Penyisihan ${penDate[1]} ${penDate[2]}, Final ${finDate[1]} ${finDate[2]}.`,
          organizer: "Kompetisi Nasional Prestasi Nusantara",
          deadline,
          location: "ONLINE",
          eligibility: "Pelajar/mahasiswa aktif, kuota terbatas",
          sourceUrl: "https://kompetisinasional.com/index",
          imageUrl: null,
        field: categorizeField(title, "kompetisi"),
        });
      }
    }

    console.log(`   ✅ ${entries.length} entries`);
    return entries;
  } catch (err) {
    console.error("   ❌ Failed:", err);
    return [];
  }
}

// ─── Scraper 6: pusatprestasinasional.kemendikdasmen.go.id ──────
async function scrapePuspresnas(): Promise<ScrapedEntry[]> {
  console.log("📡 [6/6] pusatprestasinasional.kemendikdasmen.go.id...");
  try {
    // Resolve s.id short links to actual Puspresnas event URLs
    const sIdLinks: Record<string, string> = {
      "OSNLomba": "https://s.id/OSNLomba",
      "LombaOpsi": "https://s.id/LombaOpsi",
      "lombadebatindonesia": "https://s.id/lombadebatindonesia",
      "lombao2sn": "https://s.id/lombao2sn",
    };

    const entries: ScrapedEntry[] = [];

    for (const [name, shortUrl] of Object.entries(sIdLinks)) {
      try {
        // Puspresnas has invalid SSL cert — temporarily disable verification
        const prevReject = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        let eventUrl = "";

        try {
          // Follow redirect to get actual URL
          const redirectRes = await fetch(shortUrl, {
            method: "HEAD",
            redirect: "follow",
            headers: { "User-Agent": "Mozilla/5.0 (compatible; BeasiswaFinder/1.0)" },
          });
          eventUrl = redirectRes.url;
        } finally {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = prevReject;
        }

        if (!eventUrl || !eventUrl.includes("pusatprestasinasional")) continue;

        // Fetch the event page HTML (with SSL bypass again)
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        let html = "";
        try {
          const pageRes = await fetch(eventUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; BeasiswaFinder/1.0)" },
          });
          html = await pageRes.text();
        } finally {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = prevReject;
        }

        // Extract JSON data from wire:snapshot or script tags
        // The page embeds structured data as HTML-encoded JSON
        // Key is 'nama_event' (not 'name' which is in the service section)
        const titleMatch = html.match(/nama_event&quot;:&quot;([^&]+)&quot;/);
        const dateMatch = html.match(/tanggal&quot;:&quot;([^&]+)&quot;/);
        const levelMatch = html.match(/&quot;nama_jenjang&quot;:&quot;([^&]+)&quot;/);
        const catMatch = html.match(/category&quot;:\{[^}]*&quot;title&quot;:&quot;([^&]+)&quot;/);
        const descMatch = html.match(/detail_singkat&quot;:&quot;([^&]{10,200})&quot;/);
        const regLinkMatch = html.match(/&quot;link&quot;:&quot;(https?:[\\/]+[^&]+)&quot;/);

        if (!titleMatch || !dateMatch) continue;

        const title = titleMatch[1].replace(/\\\//g, "/");
        const dateStr = dateMatch[1];
        const level = levelMatch ? levelMatch[1] : "SMA";
        const category = catMatch ? catMatch[1] : "Lomba";

        // Parse date range like "24 Feb - 20 Sep 2026"
        const deadline = parseIndonesianDate(dateStr);
        if (!deadline) continue;

        const desc = descMatch ? descMatch[1].replace(/\\\//g, "/") : `${title}. Ajang ${category} tingkat ${level} yang diselenggarakan oleh Pusat Prestasi Nasional.`;

        // Extract registration link and important attachments
        const eventLinks: { label: string; url: string }[] = [];
        if (regLinkMatch) {
          const regUrl = regLinkMatch[1].replace(/\\\//g, "/");
          eventLinks.push({ label: "📝 Daftar / Registrasi", url: regUrl });
        }
        eventLinks.push({ label: "📄 Lihat di Puspresnas", url: eventUrl });

        // Extract attachment links (panduan, materi, etc.)
        const attachmentRegex = /&quot;judul&quot;:&quot;([^&]+)&quot;[^}]*&quot;url&quot;:&quot;(https?:[\\/]+[^&]+)&quot;/g;
        let attMatch;
        while ((attMatch = attachmentRegex.exec(html)) !== null) {
          const attTitle = attMatch[1].replace(/\\\//g, "/");
          const attUrl = attMatch[2].replace(/\\\//g, "/");
          if (attUrl && !attUrl.includes("pusatprestasinasional.kemendikdasmen.go.id/uploads")) {
            eventLinks.push({ label: `📎 ${attTitle}`, url: attUrl });
          }
        }

        entries.push({
          title,
          type: "LOMBA",
          category: categorizeLevel(title + " " + level),
          description: desc,
          organizer: "Pusat Prestasi Nasional (Kemendikdasmen)",
          deadline,
          location: "ONLINE",
          eligibility: `Pelajar jenjang ${level} (SMA/SMK/MAK/Sederajat)`,
          sourceUrl: eventUrl,
          imageUrl: null,
          field: categorizeField(title, category),
          links: eventLinks.length > 0 ? eventLinks : undefined,
        });
      } catch (err) {
        console.error(`   ⚠️ Failed ${name}:`, err);
      }
    }

    console.log(`   ✅ ${entries.length} entries`);
    return entries;
  } catch (err) {
    console.error("   ❌ Failed:", err);
    return [];
  }
}

// ─── Upsert into database ────────────────────────────────────────
async function upsertEntries(entries: ScrapedEntry[]) {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const entry of entries) {
    if (entry.deadline < new Date()) {
      skipped++;
      continue;
    }

    try {
      const existing = await prisma.opportunity.findFirst({
        where: { title: entry.title },
      });

      const orgType = entry.organizerType || classifyOrganizerType(entry.organizer, entry.title);
      const aType = entry.alarmType || classifyAlarmType(entry.title, entry.organizer, orgType, entry.description);
      const aConfig = entry.alarmConfig || generateAlarmConfig(aType);
      const recurring = entry.isRecurring !== undefined ? entry.isRecurring : detectRecurring(entry.title);

      if (existing) {
        if (
          existing.deadline.getTime() !== entry.deadline.getTime() ||
          existing.description !== entry.description ||
          (entry.links && !existing.links) ||
          existing.organizerType !== orgType
        ) {
          await prisma.opportunity.update({
            where: { id: existing.id },
            data: {
              deadline: entry.deadline,
              description: entry.description,
              organizer: entry.organizer,
              sourceUrl: entry.sourceUrl,
              imageUrl: entry.imageUrl,
              links: entry.links ? JSON.stringify(entry.links) : existing.links,
              organizerType: orgType,
              alarmType: aType,
              alarmConfig: aConfig,
              isRecurring: recurring,
            },
          });
          updated++;
        }
      } else {
        await prisma.opportunity.create({ data: { ...entry, links: entry.links ? JSON.stringify(entry.links) : null, organizerType: orgType, alarmType: aType, alarmConfig: aConfig, isRecurring: recurring } });
        created++;
      }
    } catch (err) {
      console.error(`  ⚠️ Failed "${entry.title}":`, err);
    }
  }

  return { created, updated, skipped };
}

// ─── Cleanup: remove all expired entries ────────────────────────
async function cleanupExpired(): Promise<number> {
  const { count } = await prisma.opportunity.deleteMany({
    where: { deadline: { lt: new Date() } },
  });

  return count;
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 Starting scraper (6 sources)...\n");

  const results = await Promise.all([
    scrapeLuarkampusBeasiswa(),
    scrapeLuarkampusEvents(),
    scrapeIndbeasiswa(),
    scrapeKompetisiOnline(),
    scrapeKompetisiNasional(),
    scrapePuspresnas(),
  ]);

  const allEntries = results.flat();

  if (allEntries.length === 0) {
    console.log("\n⚠️ No entries scraped.");
    await prisma.$disconnect();
    return;
  }

  console.log(`\n📦 Total scraped: ${allEntries.length} entries`);
  console.log("💾 Upserting into database...\n");

  const { created, updated, skipped } = await upsertEntries(allEntries);

  // Clean up expired entries (>30 days past deadline)
  console.log("\n🧹 Cleaning up expired entries (>30 days past deadline)...");
  const deleted = await cleanupExpired();
  console.log(`   Deleted ${deleted} expired entries`);

  console.log("\n✅ Done!");
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped (past deadline): ${skipped}`);

  await prisma.$disconnect();
}

main().catch(console.error);
