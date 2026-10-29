/**
 * Module Notifications Push Cliniques (Web Push, FCM, APNs & In-App)
 * Conçu pour les alertes urgentes de cabinet médical :
 * - Arrivée de patient en salle d'attente
 * - Annulation de dernière minute (créneau libéré)
 * - Alerte laboratoire critique (troponine, glycémie, etc.)
 */

import { triggerHaptic } from '@/lib/native/haptics';

export interface ClinicalNotification {
  id: string;
  type: 'waiting_room' | 'cancellation' | 'critical_lab' | 'new_booking';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  patientName?: string;
  patientCin?: string;
  actionUrl?: string;
}

const STORAGE_KEY = 'noor_clinical_notifications_v1';

// Sons d'alerte médicale synthétisés via l'API Web Audio (aucun fichier externe requis)
export function playMedicalChime(priority: 'low' | 'medium' | 'high' = 'medium') {
  if (typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    if (priority === 'high') {
      // Double bip aigu d'alerte critique
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.setValueAtTime(1174.66, now + 0.12); // D6
      gainNode.gain.setValueAtTime(0.18, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    } else {
      // Carillon doux à deux tons pour arrivée salle d'attente
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.15); // E5
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    }

    osc1.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.45);
  } catch (err) {
    console.debug('[Audio] Web Audio chime not supported or muted:', err);
  }
}

/**
 * Demande la permission de notification push au navigateur / smartphone
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('[Push] Permission request failed:', err);
    return 'denied';
  }
}

/**
 * Récupère les notifications enregistrées
 */
export function getSavedNotifications(): ClinicalNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Initialise avec quelques notifications de démonstration pertinentes
      const initial: ClinicalNotification[] = [
        {
          id: 'notif-demo-1',
          type: 'waiting_room',
          title: 'Salle d\'attente • Arrivée',
          message: 'M. Omar Bennani (C102938) vient d\'arriver en salle d\'attente pour son détartrage.',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          read: false,
          priority: 'medium',
          patientName: 'Omar Bennani',
          patientCin: 'C102938',
          actionUrl: '/agenda',
        },
        {
          id: 'notif-demo-2',
          type: 'cancellation',
          title: 'Créneau libéré • Annulation',
          message: 'Annulation RDV de 14h30 par Fatima Zahra Alami. Le créneau a été réouvert sur le portail en ligne.',
          timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
          read: false,
          priority: 'low',
          patientName: 'Fatima Zahra Alami',
          patientCin: 'BK829104',
          actionUrl: '/agenda',
        },
        {
          id: 'notif-demo-3',
          type: 'critical_lab',
          title: 'Alerte Biologique Critique 🚨',
          message: 'Laboratoires BioMaroc : Troponine I à 0.45 ng/mL pour M. Yassine Mansouri (Seuil max : 0.04).',
          timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
          read: true,
          priority: 'high',
          patientName: 'Yassine Mansouri',
          patientCin: 'BE492019',
          actionUrl: '/patients',
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

/**
 * Émet une nouvelle notification clinique (OS + In-App + Audio + Haptique)
 */
export async function sendClinicalPushNotification(
  notification: Omit<ClinicalNotification, 'id' | 'timestamp' | 'read'>
): Promise<ClinicalNotification> {
  const newNotif: ClinicalNotification = {
    ...notification,
    id: `notif-${Date.now()}`,
    timestamp: new Date().toISOString(),
    read: false,
  };

  if (typeof window !== 'undefined') {
    // 1. Sauvegarder dans le store local
    const current = getSavedNotifications();
    const updated = [newNotif, ...current.slice(0, 29)]; // Conserve les 30 dernières
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // 2. Retour haptique et sonore
    if (newNotif.priority === 'high') {
      triggerHaptic('warning');
    } else {
      triggerHaptic('light');
    }
    playMedicalChime(newNotif.priority);

    // 3. Notification OS native / Push si autorisée
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((registration) => {
            const opts: any = {
              body: newNotif.message,
              icon: '/brand/icon-192.svg',
              badge: '/brand/icon-192.svg',
              vibrate: [200, 100, 200],
              data: { url: newNotif.actionUrl || '/agenda' },
            };
            registration.showNotification(newNotif.title, opts);
          });
        } else {
          new Notification(newNotif.title, {
            body: newNotif.message,
            icon: '/brand/icon-192.svg',
          });
        }
      } catch (err) {
        console.debug('[Push] Native notification display fallback:', err);
      }
    }

    // 4. Déclencher l'événement pour mettre à jour les composants React
    window.dispatchEvent(
      new CustomEvent('noor-clinical-notification-received', { detail: newNotif })
    );
  }

  return newNotif;
}

/**
 * Marque toutes les notifications comme lues
 */
export function markAllNotificationsAsRead(): void {
  if (typeof window === 'undefined') return;
  const list = getSavedNotifications().map((n) => ({ ...n, read: true }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('noor-clinical-notification-received', { detail: null }));
}
