import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InkWings - AI Children's Book Creator",
  description: "Create personalized AI-powered children's stories with beautiful illustrations. Safe, COPPA-compliant, and fun for young readers.",
  keywords: ["InkWings", "children's books", "AI stories", "personalized books", "kids reading", "COPPA compliant", "illustrated stories"],
  authors: [{ name: "InkWings" }],
  openGraph: {
    title: "InkWings - Where Stories Take Flight",
    description: "AI-powered personalized children's books with beautiful illustrations",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
