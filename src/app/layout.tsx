import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "e-Monitoring Satker ATAB SDA PU",
  description: "Dashboard visualisasi data e-Monitoring Satker ATAB SDA PU - paket, pagu, dan progres fisik & keuangan per satker.",
  keywords: ["e-Monitoring", "PU", "ATAB", "SDA", "satker", "dashboard", "Next.js"],
  authors: [{ name: "e-Monitoring Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "e-Monitoring Satker ATAB SDA PU",
    description: "Dashboard visualisasi data e-Monitoring Satker ATAB SDA PU",
    url: "https://chat.z.ai",
    siteName: "e-Monitoring PU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "e-Monitoring Satker ATAB SDA PU",
    description: "Dashboard visualisasi data e-Monitoring Satker ATAB SDA PU",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
