'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/button';
import {
  type ClinicalNotification,
  getSavedNotifications,
  markAllNotificationsAsRead,
  requestNotificationPermission,
  sendClinicalPushNotification,
} from '@/lib/notifications/clinical-push';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<ClinicalNotification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const popoverRef = useRef<HTMLDivElement>(null);

  const loadNotifications = () => {
    setNotifications(getSavedNotifications());
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  };

  useEffect(() => {
    loadNotifications();

    const handleUpdate = () => {
      loadNotifications();
    };

    window.addEventListener('noor-clinical-notification-received', handleUpdate);

    // Fermer le popover au clic extérieur
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('noor-clinical-notification-received', handleUpdate);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleRequestPush = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      sendClinicalPushNotification({
        type: 'waiting_room',
        title: 'Notifications Push Noor activées 🇲🇦',
        message: 'Vous recevrez désormais les alertes d\'arrivée de patients et d\'annulations en direct.',
        priority: 'low',
      });
    }
  };

  const handleSimulateWaitingRoom = () => {
    sendClinicalPushNotification({
      type: 'waiting_room',
      title: 'Salle d\'attente • Arrivée Patient',
      message: 'Mme Khadija Tazi (A928301) vient de se présenter au secrétariat.',
      priority: 'medium',
      patientName: 'Khadija Tazi',
      patientCin: 'A928301',
      actionUrl: '/agenda',
    });
  };

  const handleSimulateCancellation = () => {
    sendClinicalPushNotification({
      type: 'cancellation',
      title: 'Annulation RDV Dernière Minute',
      message: 'Le rendez-vous de 11h30 a été libéré. Créneau proposé aux patients en liste d\'attente.',
      priority: 'low',
      actionUrl: '/agenda',
    });
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bouton cloche */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Centre de notifications cliniques"
        className="relative p-2 rounded-xl text-gray-600 hover:text-terracotta-700 hover:bg-sand-100 transition focus:outline-none focus:ring-2 focus:ring-terracotta-500"
      >
        <span className="text-lg leading-none" role="img" aria-label="Cloche">
          🔔
        </span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-terracotta-600 rounded-full border-2 border-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover du centre de notifications */}
      {isOpen && (
        <div
          role="region"
          aria-label="Notifications"
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* En-tête */}
          <div className="px-4 py-3 bg-sand-50/70 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-charcoal">Alertes Cliniques</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-terracotta-100 text-terracotta-700">
                  {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsAsRead}
                className="text-xs text-terracotta-700 hover:text-terracotta-900 font-medium"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Bannière demande d'autorisation push si non accordée */}
          {permission !== 'granted' && (
            <div className="p-3 bg-amber-50/80 border-b border-amber-200/60 flex items-center justify-between gap-2">
              <div className="text-[11px] text-amber-900 leading-tight">
                <span className="font-semibold">Alertes smartphone</span> : Activez les notifications push pour les urgences.
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRequestPush}
                className="text-[10px] h-6 px-2 border-amber-300 bg-white hover:bg-amber-100 font-semibold"
              >
                Activer
              </Button>
            </div>
          )}

          {/* Liste des alertes */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500">
                Aucune alerte clinique pour le moment.
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.read;
                let badgeColor = 'bg-gray-100 text-gray-700';
                let icon = 'ℹ️';

                if (notif.type === 'waiting_room') {
                  badgeColor = 'bg-emerald-100 text-emerald-800';
                  icon = '🚪';
                } else if (notif.type === 'cancellation') {
                  badgeColor = 'bg-terracotta-100 text-terracotta-800';
                  icon = '📅';
                } else if (notif.type === 'critical_lab') {
                  badgeColor = 'bg-red-100 text-red-800';
                  icon = '🚨';
                }

                return (
                  <div
                    key={notif.id}
                    className={`p-3 transition-colors ${
                      isUnread ? 'bg-terracotta-50/20' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-base leading-none mt-0.5">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-charcoal truncate">
                            {notif.title}
                          </span>
                          <span className="text-[10px] text-gray-500 whitespace-nowrap">
                            {new Date(notif.timestamp).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 leading-snug">
                          {notif.message}
                        </p>
                        {notif.actionUrl && (
                          <Link
                            href={notif.actionUrl}
                            onClick={() => setIsOpen(false)}
                            className="inline-block mt-1 text-[11px] font-semibold text-terracotta-700 hover:underline"
                          >
                            Consulter →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Outils de simulation pour le médecin / testeur */}
          <div className="p-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-1 text-[11px]">
            <span className="text-gray-500 font-medium">Tester :</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={handleSimulateWaitingRoom}
                className="px-2 py-1 rounded bg-white border border-gray-200 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 transition font-medium"
              >
                + Arrivée patient
              </button>
              <button
                type="button"
                onClick={handleSimulateCancellation}
                className="px-2 py-1 rounded bg-white border border-gray-200 text-gray-700 hover:bg-terracotta-50 hover:text-terracotta-800 hover:border-terracotta-200 transition font-medium"
              >
                + Annulation RDV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
