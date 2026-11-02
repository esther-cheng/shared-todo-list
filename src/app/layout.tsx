import type { Metadata, Viewport } from "next";
import { Lato, Grand_Hotel } from "next/font/google";
import "./globals.css";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "700", "900"],
});

const grandHotel = Grand_Hotel({
  variable: "--font-grand-hotel",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Tandem • Life's better in sync.",
  description: "Life's better in sync. A warm, collaborative shared group workspace with lead-time reminders, notes, and task radar.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F4F3F5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${lato.variable} ${grandHotel.variable} h-full antialiased overflow-x-hidden`}
    >
      <body className="min-h-full flex flex-col bg-[#F4F3F5] text-[#171923] font-sans selection:bg-[#B78AF2]/30 selection:text-[#171923] overflow-x-hidden w-full max-w-full">
        {children}
      </body>
    </html>
  );
}
