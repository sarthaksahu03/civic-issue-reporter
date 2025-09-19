import React, { useEffect, useState } from 'react';

// A lightweight install prompt that listens for the beforeinstallprompt event
// and shows a button to trigger the native installation dialog.
const PWAInstallPrompt: React.FC = () => {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  }

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler as EventListener);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler as EventListener);
    };
  }, []);

  // Hide if already installed (PWA standalone)
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) setVisible(false);
  }, []);

  const onInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the prompt
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-3 rounded-lg bg-sky-600 text-white shadow-lg px-4 py-3">
        <div className="text-sm hidden sm:block">Install CivicEye for quick access</div>
        <button
          onClick={onInstallClick}
          className="bg-white text-sky-700 hover:bg-slate-100 rounded-md px-3 py-1 text-sm font-medium"
        >
          Install
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
