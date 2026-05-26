import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "@/components/common/ClientProviders";
import { Instrument_Serif, Barlow } from "next/font/google";

const headingFont = Instrument_Serif({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400"],
});

const bodyFont = Barlow({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ForkFlow - AI Agent Marketplace",
  description: "Create, monetize, and deploy AI agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${headingFont.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black text-white font-body">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
