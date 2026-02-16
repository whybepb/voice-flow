import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import DashboardShell from "@/components/DashboardShell";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VoiceFlow — AI Booking Automation",
  description: "Automate confirmation calls and manage bookings with AI-powered voice agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <DashboardShell>
          {children}
        </DashboardShell>
      </body>
    </html>
  );
}
