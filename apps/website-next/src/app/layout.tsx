import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/NavigationServer";
import { MobileCTABar } from "@/components/MobileCTABar";
import { AnalyticsProvider, BookingProvider } from "@/components/providers";

// Optimize fonts - only load what's needed
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
  // Only load weights actually used
  weight: ["400", "500", "600", "700"],
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "optional", // Don't block rendering for decorative font
  variable: "--font-playfair",
  preload: false, // Not critical - logo has fallback
  style: ["italic"],
  weight: ["400"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  title: {
    default: "Life Psychology Australia | Psychologist Newcastle",
    template: "%s | Life Psychology Australia",
  },
  description: "Professional psychologist in Newcastle providing anxiety therapy, depression counselling, couples therapy, and NDIS psychology services. Secure telehealth sessions across the Greater Hunter region.",
  keywords: ["psychologist Newcastle", "anxiety therapy Newcastle", "depression counselling Newcastle", "couples therapy Newcastle", "NDIS psychologist Newcastle", "telehealth psychology"],
  authors: [{ name: "Life Psychology Australia" }],
  creator: "Life Psychology Australia",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://life-psychology.com.au"),
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: "Life Psychology Australia",
    title: "Life Psychology Australia | Psychologist Newcastle",
    description: "Professional psychologist in Newcastle providing anxiety therapy, depression counselling, couples therapy, and NDIS psychology services. Secure telehealth sessions across the Greater Hunter region.",
    url: "https://www.life-psychology.com.au",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Life Psychology Australia - Nurturing Growth and Wellbeing - Professional psychology services in Newcastle featuring sunflower branding",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Life Psychology Australia | Psychologist Newcastle",
    description: "Professional psychologist in Newcastle providing anxiety therapy, depression counselling, couples therapy, and NDIS psychology services.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfairDisplay.variable}`}>
      <head>
        {/* Preload LCP image for faster rendering - full quality for all devices */}
        <link
          rel="preload"
          href="/assets/hero-zoe-main.webp"
          as="image"
          type="image/webp"
          fetchPriority="high"
        />
        {/* Preconnect to booking system - critical for conversion */}
        <link rel="preconnect" href="https://life-psychology.au2.halaxy.com" crossOrigin="anonymous" />
        {/* DNS prefetch for analytics - loaded on interaction */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      </head>
      <body className="font-sans antialiased bg-white text-gray-900 pb-[72px] md:pb-0">
        <BookingProvider>
          <Navigation />
          {children}
          <Footer />
          {/* Mobile floating CTA bar */}
          <MobileCTABar />
        </BookingProvider>
        {/* Analytics loaded last to not block rendering */}
        <AnalyticsProvider />
      </body>
    </html>
  );
}
