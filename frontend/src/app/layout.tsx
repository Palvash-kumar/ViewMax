import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AuthProvider from "@/components/AuthProvider";
import QueryProvider from "@/components/QueryProvider";
import PWAProvider from "@/components/PWAProvider";

export const metadata: Metadata = {
  title: "ViewMax - Premium Movie Ticket Booking",
  description: "Next-generation movie ticket booking platform with immersive seat selection and premium cinema experience.",
  keywords: ["movies", "tickets", "cinema", "booking", "IMAX", "ViewMax"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ViewMax",
  },
  openGraph: {
    type: "website",
    title: "ViewMax - Premium Cinema Experience",
    description: "Book movie tickets with the most immersive seat selection experience.",
    siteName: "ViewMax",
  },
};

export const viewport: Viewport = {
  themeColor: "#f59e0b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="antialiased min-h-screen">
        <QueryProvider>
          <AuthProvider>
            <PWAProvider>
              <Navbar />
              <main className="pt-16">
                {children}
              </main>
            </PWAProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
