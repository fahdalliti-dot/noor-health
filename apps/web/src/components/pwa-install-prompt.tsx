'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/button';

export function PwaInstallPrompt() {
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Only target real mobile devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android/.test(userAgent);
    if (!isMobile) return;

    // Check if already in standalone app mode
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return;

    // Check if dismissed before in this session
    const isDismissed = sessionStorage.getItem('noor_pwa_dismissed') === 'true';
    if (isDismissed) return;

    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isAppleDevice);
    setVisible(true);

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!mounted || !visible || isStandalone) {
    return null;
  }

  async function handleInstallClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setVisible(false);
      }
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setVisible(false);
    sessionStorage.setItem('noor_pwa_dismissed', 'true');
  }

  return (
    <aside
      aria-label="Invitation installation mobile"
      className="md:hidden fixed top-14 inset-x-2 max-w-sm z-30 bg-white border border-terracotta-200 rounded-2xl p-3.5 shadow-2xl animate-fade-in text-xs"
    >
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-xl bg-terracotta-100 text-terracotta-700 flex items-center justify-center text-lg font-bold shrink-0">
          📲
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-gray-900 text-xs">
              Application Mobile Noor
            </h4>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Fermer invitation installation"
              className="text-gray-400 hover:text-gray-600 p-0.5 text-sm"
            >
              &times;
            </button>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Installez Noor directement sur votre téléphone pour un accès plein écran rapide.
          </p>

          {isIos ? (
            <div className="mt-2 text-[10px] bg-sand-100 text-gray-700 p-2 rounded-lg border border-sand-200">
              Sur Safari : Appuyez sur <strong>Partager ⎋</strong> puis <strong>&quot;Sur l&apos;écran d&apos;accueil&quot; ➕</strong>.
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleInstallClick}
                className="bg-terracotta-600 hover:bg-terracotta-700 text-white text-[11px] px-3 py-1 rounded-lg"
              >
                Installer l&apos;App
              </Button>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-gray-500 hover:text-gray-700 text-[11px] px-2"
              >
                Plus tard
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
