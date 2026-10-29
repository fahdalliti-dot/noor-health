import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNativeMobile } from './platform';

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
  if (typeof window === 'undefined') return;

  if (isNativeMobile()) {
    try {
      if (type === 'light') {
        Haptics.impact({ style: ImpactStyle.Light });
      } else if (type === 'medium') {
        Haptics.impact({ style: ImpactStyle.Medium });
      } else if (type === 'heavy') {
        Haptics.impact({ style: ImpactStyle.Heavy });
      } else if (type === 'success') {
        Haptics.notification({ type: NotificationType.Success });
      } else if (type === 'warning') {
        Haptics.notification({ type: NotificationType.Warning });
      } else if (type === 'error') {
        Haptics.notification({ type: NotificationType.Error });
      }
      return;
    } catch {
      // Fall through to web vibration
    }
  }

  // Web Vibration API fallback
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'light') navigator.vibrate(12);
      else if (type === 'medium') navigator.vibrate(25);
      else if (type === 'heavy') navigator.vibrate(45);
      else if (type === 'success') navigator.vibrate([15, 50, 20]);
      else if (type === 'warning' || type === 'error') navigator.vibrate([30, 60, 30]);
    } catch {
      // Ignore vibration error on unsupported platforms
    }
  }
}
