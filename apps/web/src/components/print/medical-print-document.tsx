'use client';

import React from 'react';
import { NuraMark } from '@/components/nura-mark';
import { OfficialStamp } from './official-stamp';
import { QrVerification } from './qr-verification';

export type MedicalDocType = 'prescription' | 'amo_claim' | 'certificate';

export interface PrescriptionMedicine {
  id: string;
  name: string;
  posology: string;
  duration: string;
  instructions?: string;
  hasContraindication?: boolean;
}

export interface MedicalPrintDocumentProps {
  type: MedicalDocType;
  documentNumber: string;
  date: string;
  // Doctor & Clinic info
  doctorName?: string;
  doctorInpe?: string;
  doctorSpeciality?: string;
  clinicName?: string;
  clinicAddress?: string;
  clinicCity?: string;
  clinicPhone?: string;
  clinicEmail?: string;
  // Patient info
  patientName: string;
  patientCin?: string;
  patientAge?: string | number;
  patientGender?: 'M' | 'F' | 'Autre';
  patientAmoNumber?: string;
  // Prescription specific
  medicines?: PrescriptionMedicine[];
  // AMO Claim specific
  organism?: 'cnss' | 'cnops' | 'private';
  cotationNgap?: string;
  tariffMad?: number;
  paymentMethod?: string;
  // Certificate specific
  certificateType?: 'repos' | 'aptitude' | 'coups';
  restDays?: number;
  restDaysWords?: string;
  ittDays?: number;
  sportDiscipline?: string;
  observationNotes?: string;
}

export function MedicalPrintDocument({
  type,
  documentNumber,
  date,
  doctorName = 'Dr. Amine Benali',
  doctorInpe = '104829384',
  doctorSpeciality = 'Cardiologie & Maladies Vasculaires',
  clinicName = 'Cabinet de Cardiologie Dr. Amine Benali',
  clinicAddress = '45 Boulevard Zerktouni, 3ème étage',
  clinicCity = 'Casablanca',
  clinicPhone = '+212 522 334455',
  clinicEmail = 'contact@cabinet-benali.ma',
  patientName,
  patientCin = 'BE849201',
  patientAge = '42 ans',
  patientGender = 'M',
  patientAmoNumber = '198273910',
  medicines = [],
  organism = 'cnss',
  cotationNgap = 'CS (Consultation Spécialiste)',
  tariffMad = 350,
  paymentMethod = 'Espèces',
  certificateType = 'repos',
  restDays = 3,
  restDaysWords = 'trois',
  ittDays = 15,
  sportDiscipline = 'Football et activités physiques générales',
  observationNotes = 'État fébrile avec asthénie intense nécessitant du repos au lit.',
}: MedicalPrintDocumentProps) {
  const getDocTitle = () => {
    switch (type) {
      case 'prescription':
        return 'ORDONNANCE MÉDICALE';
      case 'amo_claim':
        return 'FEUILLE DE SOINS ET PRISE EN CHARGE AMO';
      case 'certificate':
        if (certificateType === 'repos') return 'CERTIFICAT MÉDICAL DE REPOS (ITT)';
        if (certificateType === 'aptitude') return "CERTIFICAT MÉDICAL D'APTITUDE PHYSIQUE";
        return 'CERTIFICAT MÉDICAL INITIAL (COUPS ET BLESSURES)';
    }
  };

  const getDocSubtitle = () => {
    switch (type) {
      case 'prescription':
        return 'Réglementation Officielle Marocaine • Validité 3 mois';
      case 'amo_claim':
        return organism === 'cnss'
          ? 'Caisse Nationale de Sécurité Sociale (CNSS) • Assurance Maladie Obligatoire'
          : organism === 'cnops'
          ? 'Caisse Nationale des Organismes de Prévoyance Sociale (CNOPS)'
          : 'Compagnie d Assurance Privée Mutuelle Santé';
      case 'certificate':
        return "Établi conformément aux règles du Code de Déontologie Médicale (Ordre National des Médecins)";
    }
  };

  return (
    <div className="medical-print-document bg-white text-stone-900 font-sans p-8 md:p-10 max-w-[210mm] min-h-[297mm] mx-auto shadow-lg print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none relative flex flex-col justify-between border border-stone-200 print:border-none">
      
      {/* Microprint Guilloche Security Border */}
      <div className="absolute inset-2 border border-stone-200/60 pointer-events-none rounded print:border-stone-300">
        <div className="absolute top-0 left-4 -translate-y-1/2 bg-white px-2 text-[7.5px] font-mono text-stone-400 uppercase tracking-widest">
          Royaume du Maroc • Ministère de la Santé • Noor Soin Numérique
        </div>
        <div className="absolute bottom-0 right-4 translate-y-1/2 bg-white px-2 text-[7.5px] font-mono text-stone-400 uppercase tracking-widest">
          Conforme Loi CNDP N° 09-08 • Décret INPE
        </div>
      </div>

      <div className="relative z-10 space-y-6">
        
        {/* ========================================================================= */}
        {/* 1. OFFICIAL VECTOR NOOR BRAND & CLINIC HEADER */}
        {/* ========================================================================= */}
        <div className="border-b-2 border-terracotta-700/80 pb-5">
          <div className="flex items-start justify-between gap-4">
            
            {/* Left: Doctor Credentials & INPE */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-display text-xl font-bold text-stone-950 tracking-tight">
                  {doctorName}
                </span>
                <span className="text-xs bg-terracotta-100 text-terracotta-800 font-bold px-2 py-0.5 rounded font-mono">
                  INPE : {doctorInpe}
                </span>
              </div>
              <div className="text-xs font-semibold text-terracotta-800">
                {doctorSpeciality}
              </div>
              <div className="text-[11px] text-stone-600 font-medium">
                Lauréat de la Faculté de Médecine et de Pharmacie
              </div>
              <div className="text-[10px] text-stone-500 font-mono">
                N° Autorisation CNOM : 14820/CAS • N° Patente : 34819024
              </div>
            </div>

            {/* Right: Vector Brand Emblem Noor & Arab Calligraphy */}
            <div className="text-right space-y-1 shrink-0">
              <div className="flex items-center justify-end gap-2.5">
                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-1.5">
                    <span className="font-display text-2xl font-bold tracking-tight text-stone-900">
                      Noor
                    </span>
                    <span className="font-serif text-lg font-bold text-terracotta-600">
                      نُور
                    </span>
                  </div>
                  <div className="text-[9px] uppercase tracking-widest font-semibold text-stone-500">
                    Soin Numérique Maroc
                  </div>
                </div>
                <NuraMark size={38} />
              </div>
              
              <div className="text-[10.5px] text-stone-600 font-sans pt-1">
                <div>{clinicName}</div>
                <div>{clinicAddress}, {clinicCity}</div>
                <div>Tél : <span className="font-mono">{clinicPhone}</span> • <span className="font-mono">{clinicEmail}</span></div>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. DOCUMENT TYPE TITLE & METADATA BAR */}
        {/* ========================================================================= */}
        <div className="bg-stone-50/90 border border-stone-200/80 rounded-lg p-3.5 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-sm font-extrabold text-stone-900 tracking-wider uppercase font-display flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-terracotta-600 inline-block"></span>
              {getDocTitle()}
            </h1>
            <p className="text-[10.5px] text-stone-600 font-medium">
              {getDocSubtitle()}
            </p>
          </div>
          <div className="text-right text-[11px] font-mono">
            <div>Réf : <span className="font-bold text-stone-900">{documentNumber}</span></div>
            <div>Date : <span className="font-semibold text-stone-800">{date}</span></div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. PATIENT IDENTIFICATION SECTION */}
        {/* ========================================================================= */}
        <div className="border border-stone-200 rounded-lg p-3 bg-white text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <span className="text-[10px] text-stone-400 uppercase font-semibold block">Patient(e)</span>
            <span className="font-bold text-stone-900 text-sm">{patientName}</span>
          </div>
          <div>
            <span className="text-[10px] text-stone-400 uppercase font-semibold block">CIN / Identifiant</span>
            <span className="font-mono font-bold text-stone-800">{patientCin}</span>
          </div>
          <div>
            <span className="text-[10px] text-stone-400 uppercase font-semibold block">Âge / Genre</span>
            <span className="font-medium text-stone-800">{patientAge} • {patientGender === 'M' ? 'Masculin' : 'Féminin'}</span>
          </div>
          <div>
            <span className="text-[10px] text-stone-400 uppercase font-semibold block">Immatriculation AMO</span>
            <span className="font-mono font-bold text-stone-800">{patientAmoNumber}</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. DOCUMENT BODY (SPECIFIC PER TYPE) */}
        {/* ========================================================================= */}

        {/* A. ORDONNANCE MÉDICALE */}
        {type === 'prescription' && (
          <div className="space-y-4 min-h-[280px]">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <div className="text-xs font-bold text-stone-700 tracking-wider uppercase font-mono">
                Médicaments & Posologies Prescrites :
              </div>
              <div className="text-[11px] text-stone-500 italic">
                (Délivrance sous réserve de vérification officinale)
              </div>
            </div>

            {medicines.length === 0 ? (
              <div className="text-center py-12 text-stone-400 italic text-xs">
                Aucun médicament prescrit sur ce document.
              </div>
            ) : (
              <div className="space-y-4">
                {medicines.map((med, idx) => (
                  <div key={med.id || idx} className="pl-2 border-l-2 border-terracotta-500 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono font-bold text-stone-500 text-xs">{idx + 1}.</span>
                      <span className="font-bold text-stone-900 text-sm tracking-tight">{med.name}</span>
                    </div>
                    <div className="text-xs text-stone-700 pl-4 font-medium">
                      ↳ <span className="font-semibold text-stone-900">{med.posology}</span> pendant{' '}
                      <span className="underline decoration-terracotta-400 decoration-2">{med.duration}</span>
                    </div>
                    {med.instructions && (
                      <div className="text-[11px] text-stone-500 italic pl-4">
                        Note praticien : {med.instructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-6 text-[10.5px] text-stone-500 border-t border-stone-200/80 space-y-0.5">
              <p>• Ne pas modifier les doses sans accord médical préalable.</p>
              <p>• En cas d&apos;effets indésirables inhabituels, contacter immédiatement le cabinet médical.</p>
            </div>
          </div>
        )}

        {/* B. FEUILLE DE SOINS AMO */}
        {type === 'amo_claim' && (
          <div className="space-y-4 min-h-[280px]">
            <div className="border border-stone-300 rounded-lg overflow-hidden text-xs">
              <div className="bg-stone-100 font-bold p-2.5 text-stone-800 uppercase tracking-wider text-[11px] border-b border-stone-300 flex justify-between">
                <span>Codification des Actes Médicaux (Nomenclature NGAP Maroc)</span>
                <span>Organisme : {organism.toUpperCase()}</span>
              </div>
              <table className="w-full text-left">
                <thead className="bg-stone-50 text-[10px] text-stone-500 uppercase border-b border-stone-200">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Lettre Clé & Acte</th>
                    <th className="p-2.5">Coefficient</th>
                    <th className="p-2.5 text-right">Honoraires (MAD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-xs">
                  <tr>
                    <td className="p-2.5 font-mono">{date}</td>
                    <td className="p-2.5 font-semibold text-stone-900">
                      {cotationNgap}
                    </td>
                    <td className="p-2.5 font-mono">1.0</td>
                    <td className="p-2.5 text-right font-mono font-bold text-stone-900">
                      {tariffMad.toFixed(2)} DH
                    </td>
                  </tr>
                  <tr className="bg-stone-50/50">
                    <td colSpan={3} className="p-2.5 text-right font-bold text-stone-700">
                      Total Honoraires Facturés :
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-terracotta-700 text-sm">
                      {tariffMad.toFixed(2)} DH
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <span>✓</span> Honoraires intégralement perçus par le cabinet
              </div>
              <div className="text-[11px] text-emerald-800">
                Mode de règlement : <span className="font-bold">{paymentMethod}</span>. Montant en toutes lettres :{' '}
                <span className="font-semibold italic">Trois cent cinquante Dirhams marocains</span>.
              </div>
              <div className="text-[10px] text-emerald-700 font-mono">
                Quittance N° REC-2026-1048 délivrée ce jour au bénéficiaire.
              </div>
            </div>
          </div>
        )}

        {/* C. CERTIFICAT MÉDICAL OFFICIEL */}
        {type === 'certificate' && (
          <div className="space-y-5 min-h-[280px] text-xs leading-relaxed">
            <div className="p-4 bg-stone-50/60 rounded-lg border border-stone-200 text-stone-800 space-y-4">
              <p className="font-serif text-sm">
                Je soussigné, <span className="font-bold text-stone-950">{doctorName}</span>, Docteur en Médecine,
                spécialiste en {doctorSpeciality}, inscrit au tableau de l&apos;Ordre National des Médecins sous le N°{' '}
                <span className="font-mono font-bold text-stone-900">{doctorInpe}</span>,
              </p>

              <p className="font-serif text-sm">
                Certifie avoir examiné ce jour, le{' '}
                <span className="font-bold text-stone-900">{date}</span>, le(la) nommé(e) :{' '}
                <span className="font-bold text-stone-950 underline">{patientName}</span>, titulaire de la Carte d&apos;Identité
                Nationale (CIN) N° <span className="font-mono font-bold">{patientCin}</span>.
              </p>

              {certificateType === 'repos' && (
                <div className="p-3 bg-white rounded border border-stone-300 space-y-2">
                  <div className="font-bold text-stone-900 text-sm">
                    Constatation Médicale & Incapacité Totale de Travail (ITT) :
                  </div>
                  <p className="text-stone-700">
                    L&apos;état de santé du patient nécessite un repos médical strict avec arrêt temporaire de toute activité
                    professionnelle d&apos;une durée de{' '}
                    <span className="font-bold text-terracotta-700 text-sm">
                      {restDays} jours ({restDaysWords} jours)
                    </span>
                    , à compter de ce jour, sauf complication ultérieure.
                  </p>
                  {observationNotes && (
                    <p className="text-xs text-stone-500 italic">
                      Motif d&apos;ordre clinique : {observationNotes}
                    </p>
                  )}
                </div>
              )}

              {certificateType === 'aptitude' && (
                <div className="p-3 bg-white rounded border border-stone-300 space-y-2">
                  <div className="font-bold text-stone-900 text-sm">
                    Aptitude Médicale :
                  </div>
                  <p className="text-stone-700">
                    L&apos;examen clinique complet réalisé ce jour ne met en évidence aucune contre-indication médicale apparente à
                    la pratique de :{' '}
                    <span className="font-bold text-stone-950">{sportDiscipline}</span>.
                  </p>
                </div>
              )}

              {certificateType === 'coups' && (
                <div className="p-3 bg-white rounded border border-stone-300 space-y-2">
                  <div className="font-bold text-stone-900 text-sm">
                    Constatation Médico-Légale de Coups et Blessures :
                  </div>
                  <p className="text-stone-700">
                    L&apos;examen met en évidence des lésions traumatiques récentes entraînant une Incapacité Totale de Travail (ITT)
                    fixée à titre provisoire à{' '}
                    <span className="font-bold text-red-700 text-sm">{ittDays} jours</span>, sous réserve de complications
                    secondaires.
                  </p>
                  {observationNotes && (
                    <p className="text-xs text-stone-600">
                      Description des lésions : {observationNotes}
                    </p>
                  )}
                </div>
              )}

              <p className="font-serif text-xs text-stone-600 italic pt-2">
                En foi de quoi, le présent certificat est délivré en main propre à l&apos;intéressé(e) pour servir et valoir ce que
                de droit.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 5. OFFICIAL FOOTER: STAMP, SIGNATURE & QR VERIFICATION */}
      {/* ========================================================================= */}
      <div className="relative z-10 pt-6 border-t-2 border-stone-300 mt-6">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          
          {/* Authenticity QR Code & Cryptographic Fingerprint */}
          <div className="space-y-1">
            <QrVerification
              documentId={documentNumber}
              inpe={doctorInpe}
              patientName={patientName}
              date={date}
              size={90}
            />
            <div className="text-[9px] text-stone-400 font-mono">
              Horodatage légal : {date} 10:30 GMT+1 (Africa/Casablanca)
            </div>
          </div>

          {/* Doctor Official Stamp & Vector Signature */}
          <div className="shrink-0 text-right">
            <OfficialStamp
              doctorName={doctorName}
              doctorInpe={doctorInpe}
              doctorSpeciality={doctorSpeciality}
              city={clinicCity}
            />
          </div>

        </div>

        {/* Legal Regulatory Notice */}
        <div className="text-center text-[8.5px] text-stone-400 font-mono pt-4 border-t border-stone-200 mt-3">
          Document généré par Noor Soin Numérique Maroc (Loi CNDP 09-08 • Agrément Déontologique National).
          Toute reproduction frauduleuse ou falsification expose à des poursuites pénales prévues par le Code Pénal Marocain.
        </div>
      </div>

    </div>
  );
}
