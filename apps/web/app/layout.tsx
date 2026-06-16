import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Outfit } from "next/font/google";
import { ThreeJsBackground } from "@/components/threejs-background";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap"
});

const APP_NAME = "NoTrace";
const APP_DESCRIPTION = "Invite-only anonymous community chat. Speak freely. Leave no trace.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: "NoTrace 🎭",
    template: "%s | NoTrace"
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME
  },
  formatDetection: {
    telephone: false
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: "NoTrace 🎭",
    description: APP_DESCRIPTION
  },
  twitter: {
    card: "summary",
    title: "NoTrace 🎭",
    description: APP_DESCRIPTION
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/icons/icon-152.png", sizes: "152x152", type: "image/png" }
    ],
    shortcut: "/icons/icon-192.png"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  colorScheme: "dark",
  themeColor: "#8B4AFF"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`dark ${outfit.variable}`}>
      <head>
        {/* PWA service worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(reg) { console.log('[SW] Registered', reg.scope); })
                    .catch(function(err) { console.warn('[SW] Failed:', err); });
                });
              }
            `
          }}
        />
        {/* iOS PWA splash screens */}
        <link rel="apple-touch-startup-image" href="/splash.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="NoTrace" />
      </head>
      <body className="font-sans antialiased text-foreground bg-background overflow-hidden relative">
        <ThreeJsBackground />
        <div className="relative z-10">{children}</div>
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
