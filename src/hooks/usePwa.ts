import { useState, useEffect, useCallback } from 'react';
import { onServiceWorkerUpdate, skipWaitingAndReload } from '../utils/serviceWorkerRegistration';

// BeforeInstallPromptEvent type definition
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PwaStatus {
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  hasUpdate: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unsupported'>;
  applyUpdate: () => void;
}

export function usePwa(): PwaStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    const isIosStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true;
    return isStandaloneMode || isIosStandalone;
  });
  const [hasUpdate, setHasUpdate] = useState<boolean>(false);
  const [isIOS] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const isApple = /iPad|iPhone|iPod/.test(ua);
    const isMacTouch = navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1;
    return isApple || isMacTouch;
  });
  const [isAndroid] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    return /android/i.test(navigator.userAgent || '');
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Listen for SW updates
    const unsubscribeUpdate = onServiceWorkerUpdate(() => {
      setHasUpdate(true);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      unsubscribeUpdate();
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unsupported'> => {
    if (!deferredPrompt) {
      return 'unsupported';
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return 'accepted';
      }
      setDeferredPrompt(null);
      return 'dismissed';
    } catch (err) {
      console.warn('[UniPlanner] PWA installation prompt encountered an error:', err);
      return 'unsupported';
    }
  }, [deferredPrompt]);

  const applyUpdate = useCallback(() => {
    skipWaitingAndReload();
  }, []);

  return {
    isOnline,
    isInstallable: !!deferredPrompt && !isInstalled,
    isInstalled,
    hasUpdate,
    isIOS,
    isAndroid,
    promptInstall,
    applyUpdate,
  };
}
