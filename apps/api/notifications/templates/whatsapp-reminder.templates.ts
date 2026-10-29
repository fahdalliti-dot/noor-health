export interface ReminderTemplateData {
  patientName: string;
  doctorName: string;
  speciality?: string;
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  appointmentId: string;
  dateStr: string; // e.g. "Mercredi 29 Octobre"
  timeStr: string; // e.g. "10:30"
}

export interface InteractiveMessagePayload {
  recipientPhone: string;
  bodyText: string;
  buttons: Array<{ id: string; title: string }>;
  headerText?: string;
  footerText?: string;
  smsFallbackText: string;
}

export function buildWhatsAppReminderPayload(
  data: ReminderTemplateData,
  language: 'ar_MA' | 'fr_MA' = 'ar_MA',
): InteractiveMessagePayload {
  const isArabic = language === 'ar_MA';

  if (isArabic) {
    const bodyText = `سلام ${data.patientName}،\n\nكنفكروك بموعدك الطبي مع الدكتور ${data.doctorName} (${data.speciality || 'Médecine Générale'})\n\n📍 المكان: ${data.clinicName} - ${data.clinicAddress}\n📅 التاريخ: ${data.dateStr}\n⏰ التوقيت: ${data.timeStr}\n\nعافاك أكد لينا حضورك بالضغط على الزر أسفله:`;
    const smsFallbackText = `Rappel RDV Dr ${data.doctorName}: le ${data.dateStr} a ${data.timeStr} a ${data.clinicName}. Repondez OUI pour confirmer ou contactez ${data.clinicPhone}.`;

    return {
      recipientPhone: '',
      headerText: '🏥 تذكير بموعد طبي • Nura Santé',
      bodyText,
      footerText: 'نظام التدبير الطبي المتوافق مع CNDP 09-08',
      buttons: [
        { id: `CONFIRM_${data.appointmentId}`, title: '✅ تأكيد الحضور' },
        { id: `CANCEL_${data.appointmentId}`, title: '❌ اعتذار / إلغاء' },
      ],
      smsFallbackText,
    };
  }

  // French template
  const bodyText = `Bonjour ${data.patientName},\n\nNous vous rappelons votre consultation médicale avec le Dr. ${data.doctorName} (${data.speciality || 'Médecine Générale'}).\n\n📍 Cabinet: ${data.clinicName} - ${data.clinicAddress}\n📅 Date: ${data.dateStr}\n⏰ Heure: ${data.timeStr}\n\nMerci de confirmer votre présence via les boutons ci-dessous :`;
  const smsFallbackText = `Rappel RDV Dr ${data.doctorName}: le ${data.dateStr} a ${data.timeStr} au cabinet ${data.clinicName}. Pour confirmer ou annuler: ${data.clinicPhone}.`;

  return {
    recipientPhone: '',
    headerText: '🏥 Rappel de Rendez-vous Médical',
    bodyText,
    footerText: 'Nura Santé Maroc • Conforme CNDP Loi 09-08',
    buttons: [
      { id: `CONFIRM_${data.appointmentId}`, title: '✅ Je confirme' },
      { id: `CANCEL_${data.appointmentId}`, title: '❌ Annuler le RDV' },
    ],
    smsFallbackText,
  };
}
