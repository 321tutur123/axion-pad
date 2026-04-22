import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Axion Pad — Macro Keyboard",
  description: "Clavier macro RP2040 ultra-configurable. Conçu pour les créateurs, streamers et power users.",
  openGraph: {
    title: "Axion Pad",
    description: "Clavier macro RP2040 ultra-configurable",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-black text-white antialiased`}>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
