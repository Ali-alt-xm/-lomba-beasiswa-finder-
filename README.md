<div align="center">

# Lomba & Beasiswa Finder

**Discover scholarships and competitions for Indonesian students -- automatically updated daily.**

[![Netlify Status](https://api.netlify.com/api/v1/badges/b5c8bc00-0000-0000-0000-000000000000/deploy-status)](https://app.netlify.com/sites/beasiswa-finder-ali/deploys)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat&logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38BDF8?style=flat&logo=tailwindcss)
![PostgreSQL](https://img.shields.io/badge/Neon_PostgreSQL-4169E1?style=flat&logo=postgresql)

**[Live Demo](https://beasiswa-finder-ali.netlify.app)**

</div>

---

## Features

| Feature | Description |
|---------|-------------|
| Smart Search & Filters | Filter by type, category, level (SD/SMP/SMA/Kuliah), field, cost, organizer type, and location |
| Auto-Scraping | 9+ sources scraped daily via GitHub Actions -- new lomba appear automatically |
| Push Notifications | Smart deadline alerts with context-aware checklists (sidanira letters, team coordination, early registration) |
| Calendar Export | One-tap Google Calendar or .ics download for any deadline |
| WhatsApp Share | Share filtered lists directly to WhatsApp groups |
| Shareable URLs | Filters encoded in URLs -- share a specific view with one link |
| Bookmarks | Save items without setting reminders |
| Dark Mode | Full dark mode support |
| PWA | Installable on mobile -- feels like a native app |
| Live Stats | Real-time dashboard of all opportunities |
| Feedback System | In-app feedback sent directly to admin email |
| Smart Alarms | Intelligent deadline reminders with type-specific checklists |

## Tech Stack

```
Frontend:  Next.js 14 (App Router) + TypeScript + Tailwind CSS
Database:  PostgreSQL (Neon) + Prisma ORM
Scraping:  Custom Node.js scrapers (9 sources)
Hosting:   Netlify (frontend) + GitHub Actions (scraper)
PWA:       Service Worker + Web Push API (VAPID)
Email:     Web3Forms (feedback to email)
```

## Scraping Sources

The app automatically scrapes from **9 sources** daily:

| # | Source | Type | What it finds |
|---|--------|------|---------------|
| 1 | indbeasiswa.com | Beasiswa | Scholarships for all levels |
| 2 | beasiswapascasarjana.com | Beasiswa | Post-undergrad scholarships |
| 3 | s.id/OSNLomba | Lomba | OSN & academic competitions |
| 4 | s.id/LombaOpsi | Lomba | Science olympiads |
| 5 | s.id/lombadebatindonesia | Lomba | Debate competitions |
| 6 | s.id/lombao2sn | Lomba | Sports competitions |
| 7 | olimnesia.com | Lomba | 80+ events with JSON data |
| 8 | posi.id | Lomba | POSI competitions |
| 9 | Static annual events | Lomba | EMC, KMNR, SMC (recurring) |

## Getting Started

### Prerequisites
- Node.js 20+
- Neon PostgreSQL database (free tier)

### Setup

```bash
# Clone the repo
git clone https://github.com/Ali-alt-xm/-lomba-beasiswa-finder-.git
cd -lomba-beasiswa-finder-

# Install dependencies
npm install

# Set up database
cp .env.example .env
# Edit .env with your Neon DATABASE_URL
npx prisma db push

# Seed data
npm run scrape

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

```
DATABASE_URL=postgresql://...        # Neon connection string
WEB3FORMS_KEY=...                    # web3forms.com access key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...     # Push notification public key
VAPID_PRIVATE_KEY=...                # Push notification private key
NEXT_PUBLIC_VAPID_EMAIL=mailto:...   # VAPID contact email
```

## Project Structure

```
src/
  app/
    page.tsx              # Home page with filters & cards
    layout.tsx            # Root layout with theme
    not-found.tsx         # Custom 404 page
    error.tsx             # Error boundary
    opportunity/[id]/     # Detail page per lomba/beasiswa
    stats/page.tsx        # Live statistics dashboard
    admin/page.tsx        # Admin panel
    api/
      opportunities/      # CRUD API
      push/               # Web push notifications
      feedback/           # Email feedback
  lib/prisma.ts           # Prisma client singleton
  ThemeProvider.tsx        # Dark mode context
scripts/
  scrape.ts               # 9-source scraper
prisma/
  schema.prisma           # Database schema
.github/workflows/
  scrape.yml              # Daily auto-scrape
  notify.yml              # Push notification scheduler
```

## Smart Alarm System

The app doesn't just remind -- it **prepares** students with context-aware checklists:

| Alarm Type | Trigger | Checklist |
|------------|---------|-----------|
| Sidanira | 14 days before | Request official school recommendation letter from principal |
| Team League | 21 days before | Share registration link with coach, coordinate team |
| Elite Cup | 45 days before | Register early -- slots fill fast for high-demand competitions |

## Contributing

Contributions are welcome! Feel free to open an issue or submit a PR.

## License

MIT

---

**Built for Indonesian students**

*Auto-scraped data from 9 sources, updated daily at 06:00 WIB*
