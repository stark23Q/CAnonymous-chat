"use client";

import { useEffect, useState } from "react";
import { X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      
    setTimeout(() => {
      setIsStandalone(standalone);
    }, 0);

    // Check iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIos(ios);

    // Dismissed before? Don't show again for 7 days
    const dismissed = localStorage.getItem("pwa-banner-dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    // Android: capture beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!standalone) setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS: show manual instructions if not standalone
    if (ios && !standalone) {
      setTimeout(() => setShowBanner(true), 3000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-banner-dismissed", Date.now().toString());
  };

  if (!showBanner || isStandalone) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300"
      role="dialog"
      aria-label="Install NoTrace app"
    >
      <div
        className="relative rounded-2xl border border-white/10 p-4 shadow-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(139,74,255,0.15) 0%, rgba(0,159,226,0.15) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Glow accent */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(139,74,255,0.08) 0%, rgba(0,159,226,0.08) 100%)",
            boxShadow: "inset 0 0 30px rgba(139,74,255,0.1)",
          }}
        />

        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-all"
          aria-label="Dismiss install prompt"
          id="pwa-dismiss-btn"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 relative">
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #8B4AFF, #009FE2)",
              boxShadow: "0 4px 15px rgba(139,74,255,0.4)",
            }}
          >
            <Smartphone className="w-6 h-6 text-white" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">Add NoTrace to Home Screen</p>
            {isIos ? (
              <p className="text-white/50 text-xs mt-0.5">
                Tap <span className="text-white/70">Share</span> →{" "}
                <span className="text-white/70">Add to Home Screen</span>
              </p>
            ) : (
              <p className="text-white/50 text-xs mt-0.5">
                Install the app for a better experience
              </p>
            )}
          </div>

          {/* CTA (Android only — iOS uses manual steps) */}
          {!isIos && deferredPrompt && (
            <button
              onClick={handleInstall}
              id="pwa-install-btn"
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-semibold transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, #8B4AFF, #009FE2)",
                boxShadow: "0 2px 12px rgba(139,74,255,0.5)",
              }}
            >
              <Download className="w-3.5 h-3.5" />
              Install
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
