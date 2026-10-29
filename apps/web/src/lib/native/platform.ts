import { Capacitor } from '@capacitor/core';

export function isNativeMobile(): boolean {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform();
}

export function getMobilePlatform(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined') return 'web';
  const platform = Capacitor.getPlatform();
  if (platform === 'ios') return 'ios';
  if (platform === 'android') return 'android';
  return 'web';
}
