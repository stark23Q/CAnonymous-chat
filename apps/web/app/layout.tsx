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
  title: "NoTrace",
  description: "Invite-only anonymous community chat."
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
