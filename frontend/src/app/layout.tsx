import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Header } from "@/components/layout/header";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CertiFit — AI Recruitment",
  description: "Intelligent candidate matching and trust scoring",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geist.className}>
        <Providers>
          <Header />
          <main className="flex-1">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}