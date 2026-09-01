import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function dateStr(y: number, m: number, d: number): Date {
  return new Date(y, m - 1, d);
}

function guessField(title: string, desc: string): string {
  const t = (title + " " + desc).toLowerCase();
  if (/sains|ilmu pengetahuan|matematika|ipa|fisika|kimia|biologi|komputer|teknologi|informatika|robot|ai|hackathon|coding|programming|sains/.test(t)) return "sains_teknologi";
  if (/seni|film|musik|lagu|tari|gambar|fotografi|desain|creative|creativity/.test(t)) return "seni_budaya";
  if (/olahraga|sport|futsal|basket|voli|atletik|catur/.test(t)) return "olahraga";
  if (/debat|essay|menulis|opini|public speaking|karya tulis|ilmiah|penelitian/.test(t)) return "akademik";
  if (/bisnis|kewirausahaan|business|startup|entrepreneur|ekonomi|keuangan/.test(t)) return "bisnis";
  if (/sosial|kemanusiaan|lingkungan|zakat|peduli|relawan|volunteer/.test(t)) return "sosial";
  return "umum";
}

async function main() {
  await prisma.opportunity.deleteMany();

  const opportunities = [
    // ═══════════════════════════════════════
    //  BEASISWA — Dalam Negeri (SD/SMP/SMA)
    // ═══════════════════════════════════════
    {
      title: "Program Indonesia Pintar (PIP) 2026",
      type: "BEASISWA",
      category: "SD",
      description:
        "Bantuan pendidikan dari pemerintah untuk siswa SD/sederajat dari keluarga kurang mampu. Cair per tahun: SD Rp 450.000, SMP Rp 750.000, SMA Rp 1.000.000.",
      organizer: "Kementerian Pendidikan RI",
      deadline: dateStr(2026, 12, 31),
      location: "ONLINE",
      eligibility: "Siswa SD aktif, terdaftar dalam DTKS/KPS, dari keluarga prasejahtera.",
      sourceUrl: "https://indbeasiswa.com/program-indonesia-pintar-pip/",
      imageUrl: null,
    },
    {
      title: "Beasiswa PIP (Program Indonesia Pintar) SMP",
      type: "BEASISWA",
      category: "SMP",
      description:
        "Bantuan pendidikan untuk siswa SMP/sederajat dari keluarga kurang mampu. Rp 750.000 per tahun untuk biaya pendidikan dan perlengkapan sekolah.",
      organizer: "Kementerian Pendidikan RI",
      deadline: dateStr(2026, 12, 31),
      location: "ONLINE",
      eligibility: "Siswa SMP aktif, terdaftar dalam DTKS/KPS.",
      sourceUrl: "https://indbeasiswa.com/program-indonesia-pintar-pip/",
      imageUrl: null,
    },
    {
      title: "Beasiswa PIP (Program Indonesia Pintar) SMA/SMK",
      type: "BEASISWA",
      category: "SMA_SMK",
      description:
        "Bantuan pendidikan untuk siswa SMA/SMK/sederajat dari keluarga kurang mampu. Rp 1.000.000 per tahun untuk biaya pendidikan dan perlengkapan sekolah.",
      organizer: "Kementerian Pendidikan RI",
      deadline: dateStr(2026, 12, 31),
      location: "ONLINE",
      eligibility: "Siswa SMA/SMK aktif, terdaftar dalam DTKS/KPS.",
      sourceUrl: "https://indbeasiswa.com/program-indonesia-pintar-pip/",
      imageUrl: null,
    },
    {
      title: "Sekolah Cendekia BAZNAS (SCB) 2026–2027",
      type: "BEASISWA",
      category: "SMP",
      description:
        "Sekolah gratis berasrama untuk lulusan SD/sederajat dari keluarga kurang mampu. Selama 3 tahun SMP, termasuk asrama, seragam, buku, dan biaya hidup.",
      organizer: "Badan Amil Zakat Nasional (BAZNAS)",
      deadline: dateStr(2026, 9, 5),
      location: "JAKARTA",
      eligibility: "Lulusan SD/sederajat, berasal dari keluarga kurang mampu, lulus seleksi.",
      sourceUrl: "https://indbeasiswa.com/sekolah-cendekia-baznas",
      imageUrl: null,
    },
    {
      title: "Beasiswa SMA Unggulan CT ARSA Foundation 2026",
      type: "BEASISWA",
      category: "SMA_SMK",
      description:
        "Sekolah gratis di SMA Unggulan CT ARSA Foundation Sukoharjo untuk lulusan SMP/MTs. Gratis biaya sekolah, asrama, seragam, sepatu, buku, dan alat tulis selama 3 tahun.",
      organizer: "CT ARSA Foundation",
      deadline: dateStr(2026, 9, 4),
      location: "OTHER",
      eligibility: "Lulusan SMP/MTs tahun 2026, lulus seleksi.",
      sourceUrl: "https://indbeasiswa.com/beasiswa-sma-unggulan",
      imageUrl: null,
    },
    {
      title: "Beasiswa SMA Gratis Pradita Dirgantara 2026",
      type: "BEASISWA",
      category: "SMA_SMK",
      description:
        "Beasiswa SMA di Pradita Dirgantara untuk lulusan SMP. Jalur: Keluarga Pra Sejahtera, Daerah 3T/Afirmasi, atau Juara OSN/PDC.",
      organizer: "Pradita Dirgantara",
      deadline: dateStr(2026, 9, 18),
      location: "OTHER",
      eligibility: "Lulusan SMP sederajat, dari keluarga prasejahtera / daerah 3T / juara OSN.",
      sourceUrl: "https://indbeasiswa.com/beasiswa-sma-gratis",
      imageUrl: null,
    },
    {
      title: "Beasiswa Pelajar Bontang BESCA dari Badak LNG",
      type: "BEASISWA",
      category: "SMA_SMK",
      description:
        "Beasiswa gratis biaya pendidikan di SD, SMP, dan SMA Vidatra (YPVDP) untuk pelajar di Bontang.",
      organizer: "Badak LNG",
      deadline: dateStr(2026, 9, 11),
      location: "OTHER",
      eligibility: "Pelajar Bontang, lulus seleksi administrasi dan wawancara.",
      sourceUrl: "https://indbeasiswa.com/beasiswa-pelajar-bontang",
      imageUrl: null,
    },
    {
      title: "Beasiswa ASEAN Scholarships — SMP & SMA di Singapura",
      type: "BEASISWA",
      category: "SMA_SMK",
      description:
        "Beasiswa penuh dari Pemerintah Singapura untuk pelajar Indonesia melanjutkan SMP dan SMA di Singapura. Tunjangan tahunan, tiket pesawat, akomodasi hostel, biaya sekolah, dan asuransi.",
      organizer: "Pemerintah Singapura",
      deadline: dateStr(2026, 9, 16),
      location: "ONLINE",
      eligibility: "Pelajar Indonesia SD/SMP, usia sesuai kriteria, lulus seleksi bertahap.",
      sourceUrl: "https://indbeasiswa.com/beasiswa-sma-di-singapura",
      imageUrl: null,
    },
    {
      title: "Beasiswa JIS (Jakarta Intercultural School) 2026",
      type: "BEASISWA",
      category: "SMA_SMK",
      description:
        "Beasiswa 100% biaya sekolah dari kelas 8-9 hingga lulus (kelas 12) di JIS. Program IB Diploma dan AP Capstone Diploma.",
      organizer: "Jakarta Intercultural School (JIS)",
      deadline: dateStr(2026, 9, 14),
      location: "JAKARTA",
      eligibility: "Pelajar kelas 8-9, akademik unggul, lulus seleksi.",
      sourceUrl: "https://indbeasiswa.com/beasiswa-jis",
      imageUrl: null,
    },

    // ═══════════════════════════════════════
    //  BEASISWA — Kuliah (D3/S1/S2/S3)
    // ═══════════════════════════════════════
    {
      title: "Beasiswa Unggulan Kemendikdasmen 2026",
      type: "BEASISWA",
      category: "KULIAH",
      description:
        "Beasiswa pemerintah untuk jenjang S1, S2, dan S3. Biaya pendidikan ditanggung penuh. Pendaftaran dibuka 20 Agustus 2026.",
      organizer: "Kementerian Pendidikan Dasar dan Menengah RI",
      deadline: dateStr(2026, 8, 24),
      location: "ONLINE",
      eligibility: "WNI, aktif kuliah S1/S2/S3, IPK minimal, lolos seleksi.",
      sourceUrl: "https://beasiswaunggulan.kemendikdasmen.go.id/",
      imageUrl: null,
    },
    {
      title: "Beasiswa LPDP Tahap 2 — Pendaftaran 30 Juni s/d 31 Juli 2026",
      type: "BEASISWA",
      category: "KULIAH",
      description:
        "Beasiswa Lembaga Pengelola Dana Pendidikan untuk S2, S3, Dokter Spesialis, dan Non-Degree. Fully funded: biaya kuliah, tunjangan hidup, tiket pesawat, asuransi. Seleksi bakat skolastik 27-28 September 2026.",
      organizer: "Kementerian Keuangan RI (LPDP)",
      deadline: dateStr(2026, 9, 28),
      location: "ONLINE",
      eligibility: "WNI, S1/S2, IPK min 3.0, usia max 35 tahun (S2), max 40 tahun (S3).",
      sourceUrl: "https://lpdp.kemenkeu.go.id/beasiswa/pendaftaran-beasiswa/",
      imageUrl: null,
    },
    {
      title: "Beasiswa Kepemimpinan TELADAN — Tanoto Foundation 2026",
      type: "BEASISWA",
      category: "KULIAH",
      description:
        "Program beasiswa kepemimpinan untuk mahasiswa S1. Pengembangan leadership + dana pendidikan. Deadline 7 September 2026.",
      organizer: "Tanoto Foundation",
      deadline: dateStr(2026, 9, 7),
      location: "ONLINE",
      eligibility: "Mahasiswa aktif S1, aktif berorganisasi, IPK min 3.0.",
      sourceUrl: "https://luarkampus.id/beasiswa",
      imageUrl: null,
    },
    {
      title: "Beasiswa Bakti BCA 2027",
      type: "BEASISWA",
      category: "KULIAH",
      description:
        "Beasiswa BCA untuk mahasiswa semester 4 & 5. Tunjangan biaya pendidikan selama 1 tahun (Januari–Desember). Pendaftaran Agustus–September 2026.",
      organizer: "Bank Central Asia (BCA)",
      deadline: dateStr(2026, 9, 30),
      location: "ONLINE",
      eligibility: "Mahasiswa aktif semester 4-5, IPK min 3.0, aktif berorganisasi.",
      sourceUrl: "https://www.bca.co.id/id/tentang-bca/CSR/Bakti-BCA/bakti-pendidikan/beasiswa-bakti-bca",
      imageUrl: null,
    },
    {
      title: "Beasiswa NAMA Women Advancement — UGM 2026",
      type: "BEASISWA",
      category: "KULIAH",
      description:
        "Beasiswa untuk mahasiswi UGM dari NAMA Foundation. Deadline 31 Agustus 2026.",
      organizer: "NAMA Foundation x UGM",
      deadline: dateStr(2026, 8, 31),
      location: "YOGYAKARTA",
      eligibility: "Mahasiswi aktif S1 di UGM, IPK min 3.2.",
      sourceUrl: "https://luarkampus.id/beasiswa",
      imageUrl: null,
    },
    {
      title: "Beasiswa Bayan Peduli — UGM (D4/S1) 2026",
      type: "BEASISWA",
      category: "KULIAH",
      description:
        "Beasiswa dari Bayan Group untuk mahasiswa D4/S1 di Universitas Gadjah Mada. Deadline 25 Agustus 2026.",
      organizer: "Bayan Group x UGM",
      deadline: dateStr(2026, 8, 25),
      location: "YOGYAKARTA",
      eligibility: "Mahasiswa aktif D4/S1 di UGM, IPK min 3.0.",
      sourceUrl: "https://luarkampus.id/beasiswa",
      imageUrl: null,
    },
    {
      title: "Beasiswa GENIUZ Kaltim (D3/D4/S1) 2026",
      type: "BEASISWA",
      category: "KULIAH",
      description:
        "Beasiswa dari Pemerintah Kalimantan Timur untuk mahasiswa D3/D4/S1. Deadline 3 September 2026.",
      organizer: "Pemerintah Prov. Kalimantan Timur",
      deadline: dateStr(2026, 9, 3),
      location: "ONLINE",
      eligibility: "WNI, mahasiswa aktif D3/D4/S1, berasal dari/menempuh kuliah di Kaltim.",
      sourceUrl: "https://luarkampus.id/beasiswa",
      imageUrl: null,
    },
    {
      title: "Beasiswa Fulbright S2/S3 — Amerika Serikat 2026",
      type: "BEASISWA",
      category: "KULIAH",
      description:
        "Beasiswa penuh dari Pemerintah AS untuk studi S2/S3. Fully funded: biaya kuliah, tiket pesawat PP, biaya hidup, asuransi kesehatan. Deadline 18 Februari 2026.",
      organizer: "AMINEF / Pemerintah AS",
      deadline: dateStr(2026, 9, 18),
      location: "ONLINE",
      eligibility: "WNI, S1, pengalaman kerja, TOEFL iBT min 80, IPK min 3.0.",
      sourceUrl: "https://indbeasiswa.com/beasiswa-fulbright",
      imageUrl: null,
    },
    {
      title: "Beasiswa Turkiye Burslari — Pemerintah Turki 2026",
      type: "BEASISWA",
      category: "KULIAH",
      description:
        "Beasiswa penuh dari Pemerintah Turki untuk Diploma, S1, S2, dan S3. Gratis biaya kuliah, tunjangan bulanan, asrama, asuransi, kursus bahasa Turki.",
      organizer: "Pemerintah Turki",
      deadline: dateStr(2026, 9, 20),
      location: "ONLINE",
      eligibility: "WNI, usia sesuai jenjang, IPK min 3.0, lolos wawancara.",
      sourceUrl: "https://indbeasiswa.com/beasiswa-turki-burslari",
      imageUrl: null,
    },
    {
      title: "Beasiswa SISGP — Pemerintah Swedia 2026",
      type: "BEASISWA",
      category: "KULIAH",
      description:
        "Beasiswa S2 dari Pemerintah Swedia. Full tuition fee + tunjangan SEK 12.000/bulan + biaya perjalanan SEK 15.000 + asuransi. Deadline 25 Februari 2026.",
      organizer: "Pemerintah Swedia (SI)",
      deadline: dateStr(2026, 9, 25),
      location: "ONLINE",
      eligibility: "WNI, S1, diterima di universitas Swedia, pengalaman kerja min 3000 jam.",
      sourceUrl: "https://indbeasiswa.com/beasiswa-s2-swedia-sisgp/",
      imageUrl: null,
    },
    {
      title: "Beasiswa Eiffel Excellence — Prancis 2026",
      type: "BEASISWA",
      category: "KULIAH",
      description:
        "Beasiswa S2/S3 dari Kementerian Luar Negeri Prancis. Tunjangan €1.200–€2.100/bulan, gratis biaya kuliah, tiket pesawat PP, asuransi. Deadline 8 Januari 2026.",
      organizer: "Kementerian Luar Negeri Prancis",
      deadline: dateStr(2026, 9, 8),
      location: "ONLINE",
      eligibility: "WNI, diterima di universitas Prancis, usia max 30 tahun (S2), max 35 tahun (S3).",
      sourceUrl: "https://indbeasiswa.com/beasiswa-eiffel",
      imageUrl: null,
    },
    {
      title: "Beasiswa KIP Kuliah 2026 — Jalur SNBP/SNBT",
      type: "BEASISWA",
      category: "KULIAH",
      description:
        "Kartu Indonesia Pintar Kuliah: biaya pendidikan (UKT/SPP) + bantuan biaya hidup per bulan. Bisa daftar melalui jalur SNBP, SNBT, atau mandiri.",
      organizer: "Kementerian Pendidikan RI",
      deadline: dateStr(2026, 12, 31),
      location: "ONLINE",
      eligibility: "Lulusan SMA/SMK, terdaftar dalam DTKS/KPS, diterima di PTN/PTS.",
      sourceUrl: "https://indbeasiswa.com/cara-mendaftar-kip-kuliah/",
      imageUrl: null,
    },

    // ═══════════════════════════════════════
    //  LOMBA — SD
    // ═══════════════════════════════════════
    {
      title: "Olimpiade Siswa Indonesia (YGO 2026) — SD",
      type: "LOMBA",
      category: "SD",
      description:
        "Olimpiade online gratis untuk siswa SD. Mapel: Bahasa Inggris, Bahasa Indonesia, Matematika, IPA, IPS. Terdaftar di Kemenkumham. Gratis ikut!",
      organizer: "Olimpiade Siswa Indonesia",
      deadline: dateStr(2026, 9, 1),
      location: "ONLINE",
      eligibility: "Siswa aktif SD kelas 3-6, gratis pendaftaran.",
      sourceUrl: "https://kompetisi.olimpiadesiswaindonesia.com/",
      imageUrl: null,
    },
    {
      title: "Kompetisi Anak Bangsa 2026 — SD & SMP",
      type: "LOMBA",
      category: "SD",
      description:
        "Kompetisi daring nasional untuk SD dan SMP. 22–23 Agustus 2026, kuota 800 peserta. Medali + e-sertifikat + seleksi Beasiswa Emas.",
      organizer: "Kompetisi Nasional Prestasi Nusantara",
      deadline: dateStr(2026, 8, 22),
      location: "ONLINE",
      eligibility: "Siswa SD/SMP aktif, kuota terbatas 800 peserta.",
      sourceUrl: "https://kompetisi.olimpiadesiswaindonesia.com/",
      imageUrl: null,
    },
    {
      title: "OLIMPIADE SISWA INDONESIA 50 — SD",
      type: "LOMBA",
      category: "SD",
      description:
        "Olimpiade online ke-50 untuk siswa SD. 29–30 Agustus 2026, kuota 1000 peserta. Medali emas/perak/perunggu + e-sertifikat + tiket Beasiswa Emas.",
      organizer: "Olimpiade Siswa Indonesia",
      deadline: dateStr(2026, 8, 29),
      location: "ONLINE",
      eligibility: "Siswa aktif SD, kuota 1000 peserta.",
      sourceUrl: "https://kompetisi.olimpiadesiswaindonesia.com/",
      imageUrl: null,
    },

    // ═══════════════════════════════════════
    //  LOMBA — SMP
    // ═══════════════════════════════════════
    {
      title: "Kompetisi Anak Bangsa 2026 — SMP",
      type: "LOMBA",
      category: "SMP",
      description:
        "Kompetisi daring nasional untuk SMP. 22–23 Agustus 2026, kuota 800 peserta. Medali + e-sertifikat + seleksi Beasiswa Emas.",
      organizer: "Kompetisi Nasional Prestasi Nusantara",
      deadline: dateStr(2026, 8, 22),
      location: "ONLINE",
      eligibility: "Siswa aktif SMP, kuota terbatas 800 peserta.",
      sourceUrl: "https://kompetisi.olimpiadesiswaindonesia.com/",
      imageUrl: null,
    },
    {
      title: "OLIMPIADE SISWA INDONESIA 50 — SMP",
      type: "LOMBA",
      category: "SMP",
      description:
        "Olimpiade online ke-50 untuk siswa SMP. 29–30 Agustus 2026, kuota 1000 peserta. Medali + e-sertifikat + seleksi Beasiswa Emas.",
      organizer: "Olimpiade Siswa Indonesia",
      deadline: dateStr(2026, 8, 29),
      location: "ONLINE",
      eligibility: "Siswa aktif SMP, kuota 1000 peserta.",
      sourceUrl: "https://kompetisi.olimpiadesiswaindonesia.com/",
      imageUrl: null,
    },

    // ═══════════════════════════════════════
    //  LOMBA — SMA/SMK
    // ═══════════════════════════════════════
    {
      title: "Best Indonesian Student Competition (BISC) 2026 — SMA",
      type: "LOMBA",
      category: "SMA_SMK",
      description:
        "Kompetisi online tingkat SMA. 5–6 September 2026, kuota 900 peserta. Total peserta terdaftar: 778. Medali + e-sertifikat + seleksi Beasiswa Emas.",
      organizer: "Olimpiade Siswa Indonesia",
      deadline: dateStr(2026, 9, 5),
      location: "ONLINE",
      eligibility: "Siswa aktif SMA, kuota 900 peserta.",
      sourceUrl: "https://kompetisi.olimpiadesiswaindonesia.com/",
      imageUrl: null,
    },
    {
      title: "Kompetisi Pelajar Nasional (KPN) 2026 — SMA",
      type: "LOMBA",
      category: "SMA_SMK",
      description:
        "Kompetisi nasional untuk SMA. 12–13 September 2026, kuota 800 peserta. Medali + e-sertifikat + seleksi Beasiswa Emas.",
      organizer: "Olimpiade Siswa Indonesia",
      deadline: dateStr(2026, 9, 12),
      location: "ONLINE",
      eligibility: "Siswa aktif SMA, kuota 800 peserta.",
      sourceUrl: "https://kompetisi.olimpiadesiswaindonesia.com/",
      imageUrl: null,
    },
    {
      title: "Indonesian Student Educhampionship 2026 — SMA",
      type: "LOMBA",
      category: "SMA_SMK",
      description:
        "Kompetisi edukasi nasional untuk SMA. 19–20 September 2026, kuota 1000 peserta. Medali + e-sertifikat + seleksi Beasiswa Emas.",
      organizer: "Olimpiade Siswa Indonesia",
      deadline: dateStr(2026, 9, 19),
      location: "ONLINE",
      eligibility: "Siswa aktif SMA, kuota 1000 peserta.",
      sourceUrl: "https://kompetisi.olimpiadesiswaindonesia.com/",
      imageUrl: null,
    },
    {
      title: "Kompetisi Nasional Talenta Muda (KONSTANTA) Batch 4 — SMA",
      type: "LOMBA",
      category: "SMA_SMK",
      description:
        "Kompetisi nasional daring terkurasi PUSPRESNAS. Level Advanced: Penyisihan 20 Sep, Final 4 Okt 2026. Level Proficient: Penyisihan 27 Sep, Final 11 Okt 2026.",
      organizer: "Kompetisi Nasional Prestasi Nusantara",
      deadline: dateStr(2026, 9, 20),
      location: "ONLINE",
      eligibility: "Siswa SMA, terdaftar di SIMT Kurasi Kemendikdasmen.",
      sourceUrl: "https://kompetisinasional.com/index",
      imageUrl: null,
    },

    // ═══════════════════════════════════════
    //  LOMBA — Kuliah / Umum
    // ═══════════════════════════════════════
    {
      title: "Intelligent Education Competition (EDUCOM) Batch 3 — Mahasiswa",
      type: "LOMBA",
      category: "KULIAH",
      description:
        "Kompetisi edukasi daring nasional. Level Intermediate: Penyisihan 11 Okt, Final 25 Okt 2026. Level Advanced: Penyisihan 25 Okt, Final 8 Nov 2026.",
      organizer: "Kompetisi Nasional Prestasi Nusantara",
      deadline: dateStr(2026, 10, 11),
      location: "ONLINE",
      eligibility: "Mahasiswa aktif, terdaftar di SIMT Kurasi Kemendikdasmen.",
      sourceUrl: "https://kompetisinasional.com/index",
      imageUrl: null,
    },
    {
      title: "Olimpiade Kompetensi Akademik Nasional (DEKOMNAS) Batch 2",
      type: "LOMBA",
      category: "KULIAH",
      description:
        "Olimpiade kompetensi akademik nasional. Intermediate: Penyisihan 8 Nov, Final 22 Nov. Advanced: 29 Nov–13 Des. Proficient: 6–20 Des 2026.",
      organizer: "Kompetisi Nasional Prestasi Nusantara",
      deadline: dateStr(2026, 11, 8),
      location: "ONLINE",
      eligibility: "Mahasiswa aktif, terdaftar di SIMT Kurasi Kemendikdasmen.",
      sourceUrl: "https://kompetisinasional.com/index",
      imageUrl: null,
    },
  ];

  for (const opp of opportunities) {
    await prisma.opportunity.create({
      data: {
        ...opp,
        field: guessField(opp.title, opp.description),
        createdAt: new Date(),
      },
    });
  }

  console.log(`✅ Seeded ${opportunities.length} real opportunities`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
