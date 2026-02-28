import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/ui/Navbar";
import { BottomNav } from "@/components/ui/BottomNav";
import { NewUserGate } from "@/components/NewUserGate";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MarketPlace — Campus Marketplace",
  description: "Buy and sell within your campus. The best marketplace for PESU students.",
  keywords: ["marketplace", "campus", "university", "buy", "sell", "students", "PESU"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${syne.variable}`} style={{ margin: 0, padding: 0 }}>
        <AuthProvider>
          <Navbar />
          <main style={{ minHeight: '100vh', paddingBottom: '120px' }}>
            {children}
          </main>
          <BottomNav />
          <NewUserGate />
        </AuthProvider>
      </body>
    </html>
  );
}
