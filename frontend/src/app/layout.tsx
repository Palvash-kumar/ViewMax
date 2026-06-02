import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AuthProvider from "@/components/AuthProvider";
import QueryProvider from "@/components/QueryProvider";

export const metadata: Metadata = {
  title: "ViewMax - Premium Movie Ticket Booking",
  description: "Next-generation movie ticket booking platform with immersive seat selection and premium cinema experience.",
  keywords: ["movies", "tickets", "cinema", "booking", "IMAX", "ViewMax"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <QueryProvider>
          <AuthProvider>
            <Navbar />
            <main className="pt-16">
              {children}
            </main>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
