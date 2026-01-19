import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Video Session | Life Psychology Australia",
  description: "Join your telehealth video session with Life Psychology Australia.",
  robots: {
    index: false,  // Don't index session pages
    follow: false,
  },
};

export default function SessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {children}
    </div>
  );
}
