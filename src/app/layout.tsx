import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./ThemeProvider";
import { ServiceWorkerRegister } from "./sw-register";

// Self-hosted by next/font: no third-party request, no layout shift.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
});

const SITE_URL = "https://beasiswa-finder-ali.netlify.app";
const SITE_NAME = "Lomba & Beasiswa Finder";
const DEFAULT_DESCRIPTION =
  "Temukan beasiswa dan lomba terbaru untuk pelajar Indonesia. Update otomatis setiap hari dari 9+ sumber terpercaya. LPDP, Bank Indonesia, OSN, hackathon, dan banyak lagi.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Cari Beasiswa & Lomba Gratis`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "beasiswa",
    "lomba",
    "kompetisi",
    "pelajar indonesia",
    "mahasiswa",
    "OSN",
    "LPDP",
    "beasiswa SMA",
    "beasiswa kuliah",
    "lomba essay",
    "hackathon",
    "olimpiade",
    "beasiswa S1",
    "beasiswa S2",
    "gratis",
    "pendidikan",
    "competition",
    "scholarship",
  ],
  authors: [{ name: "Aleandro Ali" }],
  creator: "Aleandro Ali",
  publisher: "Lomba & Beasiswa Finder",
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Temukan Beasiswa & Lomba Terbaru`,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Lomba & Beasiswa Finder",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Temukan Beasiswa & Lomba Terbaru`,
    description: DEFAULT_DESCRIPTION,
    images: ["/og-image.png"],
    creator: "@aleandroali",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LombaFinder",
  },
  formatDetection: {
    telephone: false,
  },
  alternates: {
    canonical: SITE_URL,
  },
  other: {
    "theme-color": "#ec7a0d",
  },
};

export const viewport: Viewport = {
  themeColor: "#ec7a0d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body className="min-h-screen transition-colors duration-200">
        <ThemeProvider>
          <ServiceWorkerRegister />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
