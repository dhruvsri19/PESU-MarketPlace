import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/ui/Navbar";

import { BottomNav } from "@/components/ui/BottomNav";
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "UniMart — Campus Marketplace",
  description: "Buy and sell within your campus. The Amazon for university students.",
  keywords: ["marketplace", "campus", "university", "buy", "sell", "students"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>
          <div className="relative z-10 min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 pb-24 md:pb-0">
              {children}
            </main>
            <BottomNav />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
