'use client';

import { useEffect } from 'react';

export function PwaServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.debug('[Noor SW] Registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.debug('[Noor SW] Registration error:', err);
        });
    }
  }, []);

  return null;
}
