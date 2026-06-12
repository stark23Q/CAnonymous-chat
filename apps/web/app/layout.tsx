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
  title: "NoTrace | Secure Anonymous Space 🛡️",
  description: "Invite-only anonymous community chat.",
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%238B4AFF"/><stop offset="100%" stop-color="%23009FE2"/></linearGradient></defs><circle cx="50" cy="50" r="45" fill="black" stroke="url(%23g)" stroke-width="8"/><path d="M50 22 L72 32 V55 C72 68 62 78 50 82 C38 78 28 68 28 55 V32 Z" fill="url(%23g)" opacity="0.9"/><path d="M50 30 L66 37 V53 C66 63 59 71 50 74 C41 71 34 63 34 53 V37 Z" fill="black"/></svg>'
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
