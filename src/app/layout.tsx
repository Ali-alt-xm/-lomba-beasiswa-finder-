import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "./ThemeProvider";
import { ServiceWorkerRegister } from "./sw-register";

export const metadata: Metadata = {
  title: "Lomba & Beasiswa Finder",
  description:
    "Temukan beasiswa dan lomba terbaru untuk mahasiswa Indonesia. LPDP, Bank Indonesia, hackathon, debat, dan banyak lagi.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LombaFinder",
  },
  formatDetection: {
    telephone: false,
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
    <html lang="id" suppressHydrationWarning>
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
