import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Outfit } from "next/font/google";
import { ThreeJsBackground } from "@/components/threejs-background";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap"
});

export const metadata: Metadata = {
  title: "NoTrace 🎭",
  description: "Invite-only anonymous community chat.",
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%238B4AFF"/><stop offset="100%" stop-color="%23009FE2"/></linearGradient></defs><path d="M20 40 C20 30 35 25 50 25 C65 25 80 30 80 40 C80 55 75 70 50 78 C25 70 20 55 20 40 Z" fill="black" stroke="url(%23g)" stroke-width="6"/><path d="M32 42 C36 38 44 38 46 44 C42 45 35 45 32 42 Z" fill="url(%23g)"/><path d="M68 42 C64 38 56 38 54 44 C58 45 65 45 68 42 Z" fill="url(%23g)"/><path d="M25 52 C28 55 35 55 38 52" stroke="url(%23g)" stroke-width="3" fill="none"/><path d="M75 52 C72 55 65 55 62 52" stroke="url(%23g)" stroke-width="3" fill="none"/><path d="M44 62 Q50 66 56 62" stroke="url(%23g)" stroke-width="4" fill="none" stroke-linecap="round"/></svg>'
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  colorScheme: "dark"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`dark ${outfit.variable}`}>
      <body className="font-sans antialiased text-foreground bg-background overflow-hidden relative">
        <ThreeJsBackground />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
