# 🎓 Lomba & Beasiswa Finder

> Temukan beasiswa dan lomba terbaru untuk pelajar & mahasiswa Indonesia. Update otomatis dari 6 sumber terpercaya.

## 🌐 Live Demo

**[beasiswa-finder-ali.netlify.app](https://beasiswa-finder-ali.netlify.app)**

## ✨ Fitur

- **129+ kesempatan** — Lomba & beasiswa dari sumber real
- **Filter lengkap** — Tipe, kategori, lokasi, penyelenggara, bidang, dinas/swasta
- **Smart Alarm** — Notifikasi cerdas berdasarkan jenis event (Sidanira, Elite Cup, Team League)
- **Kalender** — Lihat deadline secara visual per bulan
- **Sudah Daftar** — Tandai lomba yang sudah didaftari
- **WhatsApp Share** — Bagikan ke grup WhatsApp dengan satu klik
- **Dark Mode** — Mode gelap untuk kenyamanan malam hari
- **PWA** — Install seperti app di HP
- **Admin Panel** — Kelola data di `/admin`

## 📊 Sumber Data

| Sumber | Tipe |
|--------|------|
| luarkampus.id | Beasiswa & Events |
| indbeasiswa.com | Beasiswa |
| kompetisionline.com | Lomba Online |
| Puspresnas (Kemendikdasmen) | Lomba Nasional |
| Manual Entry | 30+ lomba tambahan |

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Hosting:** Netlify
- **Dark Mode:** Custom ThemeProvider

## 🚀 Getting Started

```bash
# Clone
git clone https://github.com/Ali-alt-xm/-lomba-beasiswa-finder-.git
cd lomba-beasiswa-finder

# Install
npm install

# Setup database
npx prisma db push

# Seed data
npm run db:seed

# Run scraper (ambil data terbaru)
npm run scrape

# Dev server
npm run dev
```

Buka `http://localhost:3000`

## 📁 Project Structure

```
lomba-beasiswa-finder/
├── src/app/
│   ├── page.tsx          # Halaman utama (card grid + filter)
│   ├── admin/page.tsx    # Admin panel (CRUD)
│   ├── layout.tsx        # Layout + PWA meta
│   ├── ThemeProvider.tsx  # Dark mode provider
│   └── api/              # API routes
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data
├── scripts/
│   └── scrape.ts         # Scraper (6 sources)
└── public/
    ├── manifest.json     # PWA manifest
    └── sw.js             # Service worker
```

## 🔧 Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run scrape` | Scrape data dari 6 sumber |
| `npm run db:seed` | Seed database |
| `npm run db:push` | Push schema ke database |

## 📱 Screenshots

### Desktop
![Desktop View](https://via.placeholder.com/800x600?text=Desktop+View)

### Mobile
![Mobile View](https://via.placeholder.com/400x800?text=Mobile+View)

## 🤝 Contributing

1. Fork repository
2. Buat branch baru (`git checkout -b fitur-baru`)
3. Commit changes (`git commit -m 'Add fitur baru'`)
4. Push ke branch (`git push origin fitur-baru`)
5. Buka Pull Request

## 📄 License

MIT License - Feel free to use for your own projects!

---

Dibuat dengan ❤️ untuk pelajar Indonesia 🇮🇩
