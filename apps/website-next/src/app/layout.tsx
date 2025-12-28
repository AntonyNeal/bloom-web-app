import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

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
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: "Life Psychology Australia",
  },
  twitter: {
    card: "summary_large_image",
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
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-white text-gray-900">
        {children}
        <Footer />
      </body>
    </html>
  );
}
