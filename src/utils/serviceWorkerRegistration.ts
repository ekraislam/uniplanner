/**
 * UniPlanner — Service Worker Registration Utility
 * Handles standard PWA lifecycle events, registration, and update detection.
 */

type UpdateCallback = (registration: ServiceWorkerRegistration) => void;

let registrationInstance: ServiceWorkerRegistration | null = null;
const updateCallbacks: Set<UpdateCallback> = new Set();

export function onServiceWorkerUpdate(callback: UpdateCallback): () => void {
  updateCallbacks.add(callback);
  return () => {
    updateCallbacks.delete(callback);
  };
}

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      registrationInstance = registration;

      // Handle updates detected by the browser
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // A new update is available and waiting
              console.log('[UniPlanner] New application update available.');
              updateCallbacks.forEach((cb) => cb(registration));
            } else {
              // Initial shell cached for offline use
              console.log('[UniPlanner] App shell successfully cached for offline use.');
            }
          }
        };
      };
    } catch (error) {
      console.warn('[UniPlanner] Service Worker registration encountered an issue:', error);
    }
  };

  if (document.readyState === 'complete') {
    register();
  } else {
    window.addEventListener('load', register, { once: true });
  }
}

export function skipWaitingAndReload(): void {
  if (!registrationInstance || !registrationInstance.waiting) {
    window.location.reload();
    return;
  }

  // Instruct waiting worker to activate immediately
  registrationInstance.waiting.postMessage({ type: 'SKIP_WAITING' });

  // When active controller changes, reload client
  navigator.serviceWorker.addEventListener(
    'controllerchange',
    () => {
      window.location.reload();
    },
    { once: true }
  );
}
