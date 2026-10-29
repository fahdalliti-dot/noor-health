'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Button from '@/components/ui/button';
import { NewPatientModal, type NewPatientFormData } from '@/components/new-patient-modal';
import { PrescriptionModal } from '@/components/prescription-modal';
import { MedicalCertificateModal } from '@/components/medical-certificate-modal';
import { WhatsAppReminderModal } from '@/components/whatsapp-reminder-modal';
import { NewAppointmentModal } from '@/components/new-appointment-modal';
import { DentalOdontogramModal } from '@/components/specialties/dental-odontogram-modal';
import { ObstetricTrackerModal } from '@/components/specialties/obstetric-tracker-modal';
import { PediatricTrackerModal } from '@/components/pediatric-tracker-modal';
import { captureMedicalDocument } from '@/lib/native/camera-scanner';
import { api } from '@/lib/api';
import {
  getOfflinePatients,
  saveOfflinePatients,
  addOfflinePatient,
  queueOfflineMutation,
} from '@/lib/offline/offline-store';

export interface Patient360 {
  id: string;
  cin: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  age: number;
  gender: 'M' | 'F';
  phone: string;
  email?: string;
  address: string;
  city: string;
  mutuelle: 'AMO_CNSS' | 'CNOPS' | 'SAHAM' | 'AXA' | 'RMA' | 'AUCUNE';
  numAffiliation: string;
  bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  vitals: {
    bloodPressure: string;
    heartRate: number;
    weightKg: number;
    heightCm: number;
    temperature: number;
    bloodSugar?: number;
    lastUpdated: string;
  };
  chronicConditions: string[];
  allergies: string[];
  currentTreatments: { drug: string; dosage: string; frequency: string }[];
  consultations: {
    id: string;
    date: string;
    doctorName: string;
    motif: string;
    diagnostic: string;
    notes: string;
    treatmentPrescribed: string;
  }[];
  prescriptions: {
    id: string;
    date: string;
    medications: string[];
    doctorName: string;
  }[];
  labResults: {
    id: string;
    title: string;
    date: string;
    laboratory: string;
    status: 'normal' | 'attention' | 'critique';
    summary: string;
  }[];
}

const INITIAL_PATIENTS: Patient360[] = [
  {
    id: 'p-1',
    cin: 'BE492019',
    firstName: 'Yassine',
    lastName: 'Mansouri',
    birthDate: '1972-04-12',
    age: 54,
    gender: 'M',
    phone: '+212661234567',
    email: 'yassine.mansouri@gmail.com',
    address: '12 Rue des Hôpitaux, Résidence Anfa',
    city: 'Casablanca',
    mutuelle: 'AMO_CNSS',
    numAffiliation: '182940291-01',
    bloodType: 'A+',
    vitals: {
      bloodPressure: '135/85',
      heartRate: 74,
      weightKg: 82,
      heightCm: 178,
      temperature: 36.8,
      bloodSugar: 1.08,
      lastUpdated: 'Aujourd\'hui à 09:15',
    },
    chronicConditions: ['Hypertension Artérielle (HTA)', 'Hypercholestérolémie essentielle'],
    allergies: ['Aucune allergie connue'],
    currentTreatments: [
      { drug: 'Amlor 5mg', dosage: '1 gélule', frequency: 'Le matin' },
      { drug: 'Tahor 20mg', dosage: '1 comprimé', frequency: 'Le soir au coucher' },
      { drug: 'Kardegic 75mg', dosage: '1 sachet', frequency: 'Le midi' },
    ],
    consultations: [
      {
        id: 'c-101',
        date: '29/10/2026',
        doctorName: 'Dr. Amine Benali',
        motif: 'Contrôle annuel cardiologie & Bilan tensionnel',
        diagnostic: 'HTA bien équilibrée sous bithérapie. Auscultation cardio-pulmonaire normale.',
        notes: 'Patient observant. Bonne tolérance clinique. Poursuite du traitement en cours.',
        treatmentPrescribed: 'Renouvellement Amlor 5mg + Tahor 20mg pour 3 mois.',
      },
      {
        id: 'c-102',
        date: '15/06/2026',
        doctorName: 'Dr. Amine Benali',
        motif: 'Suivi post-adaptation posologique',
        diagnostic: 'Bilan lipidique amélioré (LDL à 0.85 g/L). ECG de repos sinusal régulier.',
        notes: 'Pression artérielle stabilisée à 130/80 mmHg.',
        treatmentPrescribed: 'Kardegic 75mg + surveillance diététique.',
      },
    ],
    prescriptions: [
      {
        id: 'rx-201',
        date: '29/10/2026',
        doctorName: 'Dr. Amine Benali',
        medications: ['Amlor 5mg (Gélules) — 1/jour (Matin)', 'Tahor 20mg (Comprimés) — 1/jour (Soir)'],
      },
      {
        id: 'rx-202',
        date: '15/06/2026',
        doctorName: 'Dr. Amine Benali',
        medications: ['Kardegic 75mg — 1 sachet/jour'],
      },
    ],
    labResults: [
      {
        id: 'lab-301',
        title: 'Bilan Lipidique & Glycémie à jeun',
        date: '20/10/2026',
        laboratory: 'Laboratoire d\'Analyses Anfa (Casablanca)',
        status: 'normal',
        summary: 'Cholestérol Total: 1.82 g/L, Triglycérides: 1.20 g/L, Glycémie: 1.05 g/L.',
      },
      {
        id: 'lab-302',
        title: 'Électrocardiogramme (ECG 12 Dérivations)',
        date: '29/10/2026',
        laboratory: 'Cabinet Dr. Amine Benali',
        status: 'normal',
        summary: 'Rythme sinusal régulier à 72 bpm. Pas de trouble de repolarisation ischémiforme.',
      },
    ],
  },
  {
    id: 'p-2',
    cin: 'BK829104',
    firstName: 'Fatima Zahra',
    lastName: 'Alami',
    birthDate: '1984-11-20',
    age: 42,
    gender: 'F',
    phone: '+212662998877',
    email: 'fz.alami@menara.ma',
    address: '48 Avenue 2 Mars, Bourgogne',
    city: 'Casablanca',
    mutuelle: 'CNOPS',
    numAffiliation: '90281920-02',
    bloodType: 'O+',
    vitals: {
      bloodPressure: '120/75',
      heartRate: 78,
      weightKg: 68,
      heightCm: 165,
      temperature: 37.0,
      bloodSugar: 1.28,
      lastUpdated: 'Aujourd\'hui à 09:45',
    },
    chronicConditions: ['Diabète Type 2', 'Asthme d\'effort modéré'],
    allergies: ['PÉNICILLINE & BÊTA-LACTAMINES (Choc anaphylactique modéré en 2018)'],
    currentTreatments: [
      { drug: 'Metformine 850mg', dosage: '2 comprimés', frequency: 'Pendant les repas' },
      { drug: 'Ventoline 100µg', dosage: '1 à 2 bouffées', frequency: 'En cas de crise' },
    ],
    consultations: [
      {
        id: 'c-201',
        date: '29/10/2026',
        doctorName: 'Dr. Amine Benali',
        motif: 'Bilan diabétologique & Contrôle HbA1c',
        diagnostic: 'Diabète non insulinodépendant sous contrôle. HbA1c à 6.8%.',
        notes: 'Examen podologique normal, pas de lésion. Pouls distaux bien perçus.',
        treatmentPrescribed: 'Poursuite Metformine 850mg matin et soir.',
      },
    ],
    prescriptions: [
      {
        id: 'rx-301',
        date: '29/10/2026',
        doctorName: 'Dr. Amine Benali',
        medications: ['Metformine 850mg — 2 boîtes', 'Bandelettes d\'autosurveillance glycémique'],
      },
    ],
    labResults: [
      {
        id: 'lab-401',
        title: 'Hémoglobine glyquée (HbA1c) & Microalbuminurie',
        date: '18/10/2026',
        laboratory: 'Laboratoire Pasteur Maroc',
        status: 'normal',
        summary: 'HbA1c: 6.8% (Objectif < 7.0%), Microalbuminurie négative (< 15 mg/24h).',
      },
    ],
  },
  {
    id: 'p-3',
    cin: 'A928301',
    firstName: 'Khadija',
    lastName: 'Tazi',
    birthDate: '1997-03-08',
    age: 29,
    gender: 'F',
    phone: '+212663445566',
    email: 'khadija.tazi@outlook.com',
    address: '8 Rue Abou Hanifa, Gauthier',
    city: 'Casablanca',
    mutuelle: 'SAHAM',
    numAffiliation: 'SHM-449201',
    bloodType: 'B+',
    vitals: {
      bloodPressure: '115/70',
      heartRate: 80,
      weightKg: 64,
      heightCm: 168,
      temperature: 36.9,
      lastUpdated: 'Aujourd\'hui à 10:10',
    },
    chronicConditions: ['Grossesse 22 SA (Primigeste G1P0)'],
    allergies: ['Aucune allergie connue'],
    currentTreatments: [
      { drug: 'Gestarelle G', dosage: '1 capsule', frequency: 'Au petit-déjeuner' },
      { drug: 'Tardyferon B9', dosage: '1 comprimé', frequency: 'Le matin' },
    ],
    consultations: [
      {
        id: 'c-301',
        date: '29/10/2026',
        doctorName: 'Dr. Amine Benali',
        motif: 'Échographie obstétrique morphologique T2',
        diagnostic: 'Fœtus eutrophe, morphologie normale, RCF régulier à 145 bpm. DPA: 04/03/2027.',
        notes: 'Col fermé et long (38 mm). Liquide amniotique en quantité normale.',
        treatmentPrescribed: 'Poursuite de la supplémentation ferrique et folique.',
      },
    ],
    prescriptions: [
      {
        id: 'rx-401',
        date: '29/10/2026',
        doctorName: 'Dr. Amine Benali',
        medications: ['Tardyferon B9 — 1/jour pendant 3 mois', 'Calciforte D3 — 1 sachet/jour'],
      },
    ],
    labResults: [
      {
        id: 'lab-501',
        title: 'Sérologies Toxoplasmose & Rubéole',
        date: '05/09/2026',
        laboratory: 'Laboratoire Central de Casablanca',
        status: 'normal',
        summary: 'Toxoplasmose IgG positive (immunisée), Rubéole IgG positive (immunisée).',
      },
    ],
  },
  {
    id: 'p-4',
    cin: 'C102938',
    firstName: 'Omar',
    lastName: 'Bennani',
    birthDate: '1988-08-14',
    age: 38,
    gender: 'M',
    phone: '+212664556677',
    address: '89 Boulevard d\'Anfa',
    city: 'Casablanca',
    mutuelle: 'AXA',
    numAffiliation: 'AXA-992019',
    bloodType: 'A+',
    vitals: {
      bloodPressure: '122/78',
      heartRate: 70,
      weightKg: 75,
      heightCm: 174,
      temperature: 36.7,
      lastUpdated: 'Aujourd\'hui à 10:40',
    },
    chronicConditions: ['Surveillance bucco-dentaire & Parodontite légère'],
    allergies: ['Latex (Urticaire de contact)'],
    currentTreatments: [
      { drug: 'Bain de bouche Chlorhexidine 0.12%', dosage: '15ml', frequency: '2 fois/jour après brossage' },
    ],
    consultations: [
      {
        id: 'c-401',
        date: '29/10/2026',
        doctorName: 'Dr. Amine Benali',
        motif: 'Détartrage & Bilan Odontogramme',
        diagnostic: 'Tartre supra-gingival modéré. Absence de carie évolutive.',
        notes: 'Schéma dentaire mis à jour. Conseils d\'hygiène bucco-dentaire délivrés.',
        treatmentPrescribed: 'Détartrage complet + polissage.',
      },
    ],
    prescriptions: [],
    labResults: [],
  },
  {
    id: 'p-5',
    cin: 'D554433',
    firstName: 'Mehdi',
    lastName: 'Chraibi',
    birthDate: '2022-06-10',
    age: 4,
    gender: 'M',
    phone: '+212665112233',
    address: 'Quartier Oasis, Casablanca',
    city: 'Casablanca',
    mutuelle: 'AMO_CNSS',
    numAffiliation: '77281920-03',
    bloodType: 'O+',
    vitals: {
      bloodPressure: '100/60',
      heartRate: 95,
      weightKg: 16.5,
      heightCm: 104,
      temperature: 36.8,
      lastUpdated: 'Aujourd\'hui à 11:35',
    },
    chronicConditions: ['Suivi Pédiatrique & Programme National d\'Immunisation (PNI)'],
    allergies: ['Aucune allergie connue'],
    currentTreatments: [],
    consultations: [
      {
        id: 'c-501',
        date: '29/10/2026',
        doctorName: 'Dr. Amine Benali',
        motif: 'Visite systématique des 4 ans & Rappel vaccinal',
        diagnostic: 'Développement psychomoteur et staturo-pondéral excellent (+0.5 Z-score OMS).',
        notes: 'Vaccination PNI à jour. Auscultation pulmonaire et tympans libres.',
        treatmentPrescribed: 'Vitamine D (Uvedose 100 000 UI) dose annuelle.',
      },
    ],
    prescriptions: [],
    labResults: [],
  },
];

export default function PatientsRegistryPage() {
  const [patients, setPatients] = useState<Patient360[]>(() => {
    const cached = getOfflinePatients();
    if (cached && cached.length > 0) return cached;
    return INITIAL_PATIENTS;
  });
  const [selectedPatientId, setSelectedPatientId] = useState<string>(() => {
    const cached = getOfflinePatients();
    if (cached && cached.length > 0) return cached[0].id;
    return INITIAL_PATIENTS[0].id;
  });

  // Sync to local cache whenever patients change
  useEffect(() => {
    saveOfflinePatients(patients);
  }, [patients]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'cardio' | 'diabete' | 'obstetrique' | 'pediatrie'>('all');
  const [activeTab, setActiveTab] = useState<'consultations' | 'prescriptions' | 'labs' | 'identity'>('consultations');
  const [newPatientOpen, setNewPatientOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Modals for Actions
  const [rxModalOpen, setRxModalOpen] = useState(false);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [apptModalOpen, setApptModalOpen] = useState(false);
  const [dentalModalOpen, setDentalModalOpen] = useState(false);
  const [obstetricModalOpen, setObstetricModalOpen] = useState(false);
  const [pediatricModalOpen, setPediatricModalOpen] = useState(false);

  // Filtered patients
  const filteredPatients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return patients.filter((p) => {
      const matchSearch =
        !q ||
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.cin.toLowerCase().includes(q) ||
        p.phone.includes(q);

      if (!matchSearch) return false;

      if (filterCategory === 'cardio') {
        return p.chronicConditions.some((c) => /hta|cardio|tension|cholest/i.test(c));
      }
      if (filterCategory === 'diabete') {
        return p.chronicConditions.some((c) => /diab/i.test(c));
      }
      if (filterCategory === 'obstetrique') {
        return p.chronicConditions.some((c) => /grossesse|obst/i.test(c));
      }
      if (filterCategory === 'pediatrie') {
        return p.age <= 16;
      }
      return true;
    });
  }, [patients, searchQuery, filterCategory]);

  // Selected patient (defaults to first filtered patient if current is not in list)
  const patient = useMemo(() => {
    if (filteredPatients.length === 0) return null;
    const found = filteredPatients.find((p) => p.id === selectedPatientId);
    return found || filteredPatients[0];
  }, [filteredPatients, selectedPatientId]);

  const currentMockAppointment = useMemo(() => {
    if (!patient) return null;
    return {
      id: `appt-${patient.id}`,
      clinic_id: 'clinic-a',
      patient_id: patient.id,
      doctor_id: 'doc-benali-casablanca',
      starts_at: new Date().toISOString(),
      ends_at: new Date().toISOString(),
      status: 'confirmed',
      reason: 'Consultation & Suivi Dossier DMP 360°',
      source: 'staff',
      cancelled_at: null,
      cancel_reason: null,
      created_by: 'doc-benali-casablanca',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      doctor: { id: 'doc-benali-casablanca', full_name: 'Dr. Amine Benali' },
      patient: {
        id: patient.id,
        first_name: patient.firstName,
        last_name: patient.lastName,
        phone: patient.phone,
        cin: patient.cin,
      },
    } as any;
  }, [patient]);

  function handleSaveNewPatient(data: NewPatientFormData) {
    const birthYear = new Date(data.birthDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const calculatedAge = Math.max(0, currentYear - birthYear);

    const newPatient: Patient360 = {
      id: `p-${Date.now()}`,
      cin: data.cin,
      firstName: data.firstName,
      lastName: data.lastName,
      birthDate: data.birthDate,
      age: calculatedAge,
      gender: data.gender,
      phone: data.phone,
      address: data.address || 'Adresse au Maroc',
      city: data.city || 'Casablanca',
      mutuelle: data.mutuelle,
      numAffiliation: `${Math.floor(100000000 + Math.random() * 900000000)}-01`,
      bloodType: data.bloodType,
      vitals: {
        bloodPressure: '120/80',
        heartRate: 72,
        weightKg: 70,
        heightCm: 172,
        temperature: 37.0,
        lastUpdated: 'À l\'instant',
      },
      chronicConditions: data.chronicConditions
        ? data.chronicConditions.split(',').map((s) => s.trim())
        : ['Patient sans affection de longue durée (ALD)'],
      allergies: data.allergies ? [data.allergies.trim()] : ['Aucune allergie connue'],
      currentTreatments: [],
      consultations: [
        {
          id: `c-${Date.now()}`,
          date: new Date().toLocaleDateString('fr-FR'),
          doctorName: 'Dr. Amine Benali',
          motif: 'Création initiale du dossier médical',
          diagnostic: 'Patient intégré au répertoire clinique du cabinet.',
          notes: 'Dossier DMP initialisé conformément à la réglementation marocaine CNDP.',
          treatmentPrescribed: 'Bilan de santé initial.',
        },
      ],
      prescriptions: [],
      labResults: [],
    };

    // Save immediately in local offline registry with normalized fields
    addOfflinePatient(newPatient);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      queueOfflineMutation('CREATE_PATIENT', newPatient);
      setToast(`✓ Dossier créé (Mode Hors-ligne 🇲🇦) : ${newPatient.firstName} ${newPatient.lastName} — Synchronisation automatique au retour réseau.`);
    } else {
      setToast(`✓ Dossier créé : ${newPatient.firstName} ${newPatient.lastName} (${newPatient.cin})`);
      // Sync with backend API
      api.post('/patients', {
        first_name: newPatient.firstName,
        last_name: newPatient.lastName,
        phone: newPatient.phone || undefined,
        birth_date: new Date(newPatient.birthDate).toISOString().split('T')[0],
        gender: newPatient.gender === 'F' ? 'female' : 'male',
        cin: newPatient.cin ? newPatient.cin.toUpperCase() : undefined,
      }).catch((err) => {
        console.warn('Backend API sync deferred', err);
      });
    }

    setPatients((prev) => [newPatient, ...prev]);
    setSelectedPatientId(newPatient.id);
    setTimeout(() => setToast(null), 4000);
  }

  async function handleScanDocument() {
    try {
      const doc = await captureMedicalDocument('camera');
      if (doc) {
        setToast(`✓ Document numérisé (${doc.format.toUpperCase()}) rattaché au DMP.`);
        setTimeout(() => setToast(null), 4000);
      }
    } catch {
      setToast('Numérisation annulée.');
      setTimeout(() => setToast(null), 3000);
    }
  }

  // Calculate BMI (IMC)
  const bmi = patient?.vitals?.heightCm && patient?.vitals?.weightKg
    ? (patient.vitals.weightKg / Math.pow(patient.vitals.heightCm / 100, 2)).toFixed(1)
    : null;

  const bmiStatus = bmi
    ? Number(bmi) < 18.5
      ? { label: 'Insuffisance pondérale', color: 'text-amber-700 bg-amber-50 border-amber-200' }
      : Number(bmi) < 25
      ? { label: 'Corpulence normale', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
      : Number(bmi) < 30
      ? { label: 'Surpoids modéré', color: 'text-orange-700 bg-orange-50 border-orange-200' }
      : { label: 'Obésité', color: 'text-red-700 bg-red-50 border-red-200' }
    : null;

  return (
    <div className="space-y-4 font-sans">
      {/* Top Header & Search Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold text-slate-900">
              Dossier Médical Partagé (DMP 360°) & Répertoire Patient
            </h1>
            <span className="text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
              CNDP Déclaration D-W-412/2026
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dossiers cliniques chiffrés AES-256 • Suivi des antécédents, constantes vitales et ordonnances au Maroc
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleScanDocument}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sand-100 hover:bg-sand-200 text-charcoal border border-sand-300 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
            title="Numériser la CIN marocaine ou un bilan médical via la caméra"
          >
            <span>📷</span>
            <span>Scanner CIN / Document</span>
          </button>
          <Button
            size="sm"
            onClick={() => setNewPatientOpen(true)}
            className="bg-terracotta-600 hover:bg-terracotta-700 text-white font-semibold text-xs shadow-2xs"
          >
            <span>+</span> Nouveau Patient
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[280px]">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par CIN (ex: BE492019), Nom, Prénom ou Téléphone..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:bg-white focus:ring-1 focus:ring-terracotta-600 focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1 rounded-md transition ${filterCategory === 'all' ? 'bg-white font-semibold text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Tous ({patients.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('cardio')}
            className={`px-3 py-1 rounded-md transition ${filterCategory === 'cardio' ? 'bg-white font-semibold text-terracotta-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            🩸 HTA & Cardio
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('diabete')}
            className={`px-3 py-1 rounded-md transition ${filterCategory === 'diabete' ? 'bg-white font-semibold text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            🍬 Diabétiques
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('obstetrique')}
            className={`px-3 py-1 rounded-md transition ${filterCategory === 'obstetrique' ? 'bg-white font-semibold text-purple-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            🤰 Obstétrique
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('pediatrie')}
            className={`px-3 py-1 rounded-md transition ${filterCategory === 'pediatrie' ? 'bg-white font-semibold text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            👶 Pédiatrie
          </button>
        </div>
      </div>

      {/* Main Dual-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[680px]">
        {/* Left Column: Patient Registry List (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden max-h-[820px]">
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">
              Patients répertoriés ({filteredPatients.length})
            </span>
            <span className="text-slate-400 font-mono text-[11px]">Trier par récence</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {filteredPatients.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Aucun patient trouvé pour cette recherche.
              </div>
            ) : (
              filteredPatients.map((p) => {
                const isSelected = p.id === patient?.id;
                const hasAllergy = p.allergies.some((a) => !/aucune/i.test(a));

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`w-full text-left p-3 rounded-xl transition cursor-pointer border ${
                      isSelected
                        ? 'bg-terracotta-50/60 border-terracotta-400 shadow-xs'
                        : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                          {p.firstName[0]}{p.lastName[0]}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                            <span>{p.firstName} {p.lastName}</span>
                            {hasAllergy && (
                              <span className="text-[10px]" title="Allergie majeure renseignée">⚠️</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-mono text-terracotta-700 font-semibold">{p.cin}</span>
                            <span>•</span>
                            <span>{p.age} ans</span>
                            <span>•</span>
                            <span className="font-mono font-bold text-slate-700">{p.bloodType}</span>
                          </div>
                        </div>
                      </div>

                      <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {p.mutuelle.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Chronic badges preview */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.chronicConditions.slice(0, 2).map((c) => (
                        <span
                          key={c}
                          className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[200px]"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: 360° Comprehensive Dossier Inspector (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          {patient ? (
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* Patient Profile Header Card */}
              <div className="bg-gradient-to-r from-slate-50 to-amber-50/30 rounded-2xl border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-terracotta-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                    {patient.firstName[0]}{patient.lastName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-bold text-slate-900">
                        {patient.firstName} {patient.lastName}
                      </h2>
                      <span className="font-mono bg-white border border-slate-300 text-slate-800 text-xs px-2 py-0.5 rounded-md font-bold">
                        CIN : {patient.cin}
                      </span>
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-2 py-0.5 rounded-md font-mono">
                        {patient.bloodType}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>{patient.gender === 'M' ? 'Homme' : 'Femme'}, {patient.age} ans (Né(e) le {patient.birthDate})</span>
                      <span>•</span>
                      <span>📍 {patient.city}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-800">
                        {patient.mutuelle === 'AMO_CNSS' && 'CNSS — AMO (Régime Général)'}
                        {patient.mutuelle === 'CNOPS' && 'CNOPS (Secteur Public)'}
                        {patient.mutuelle === 'SAHAM' && 'Saham Assurance'}
                        {patient.mutuelle === 'AXA' && 'AXA Assurance'}
                        {patient.mutuelle === 'AUCUNE' && 'Sans Couverture (Privé)'}
                        {patient.numAffiliation && ` (N° ${patient.numAffiliation})`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Contact & Scheduling Shortcuts */}
                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/${patient.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition"
                  >
                    <span>💬</span>
                    <span>WhatsApp</span>
                  </a>
                  <Button
                    size="sm"
                    onClick={() => setApptModalOpen(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs"
                  >
                    <span>📅</span> Prendre RDV
                  </Button>
                </div>
              </div>

              {/* Major Allergy Alert Banner (If Applicable) */}
              {patient.allergies.some((a) => !/aucune/i.test(a)) && (
                <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-center justify-between text-xs animate-pulse">
                  <div className="flex items-center gap-2.5 text-rose-900">
                    <span className="text-base">⚠️</span>
                    <div>
                      <strong className="font-bold">CONTRE-INDICATION & ALLERGIE MÉDICAMENTEUSE : </strong>
                      <span>{patient.allergies.join(', ')}</span>
                    </div>
                  </div>
                  <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                    Alerte Sécurité CNDP
                  </span>
                </div>
              )}

              {/* Constantes Vitales & Biomarqueurs Dashboard */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>🩺</span>
                    <span>Dernières Constantes Vitales Enregistrées</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Relevé : {patient.vitals.lastUpdated}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {/* Tension Artérielle */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-[10px] font-semibold uppercase text-slate-400 block">
                      Tension Artérielle
                    </span>
                    <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                      {patient.vitals.bloodPressure} <span className="text-xs font-normal">mmHg</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-medium">Contrôle régulier</span>
                  </div>

                  {/* Fréquence Cardiaque */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-[10px] font-semibold uppercase text-slate-400 block">
                      Fréquence Cardiaque
                    </span>
                    <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                      {patient.vitals.heartRate} <span className="text-xs font-normal">bpm</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Pouls régulier</span>
                  </div>

                  {/* Indice de Masse Corporelle (IMC) */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-[10px] font-semibold uppercase text-slate-400 block">
                      Poids / IMC
                    </span>
                    <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                      {patient.vitals.weightKg} kg <span className="text-xs font-normal">({bmi} IMC)</span>
                    </div>
                    {bmiStatus && (
                      <span className={`text-[10px] font-medium ${bmiStatus.color}`}>
                        {bmiStatus.label}
                      </span>
                    )}
                  </div>

                  {/* Glycémie ou Température */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-[10px] font-semibold uppercase text-slate-400 block">
                      {patient.vitals.bloodSugar ? 'Glycémie à jeun' : 'Température'}
                    </span>
                    <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                      {patient.vitals.bloodSugar ? `${patient.vitals.bloodSugar} g/L` : `${patient.vitals.temperature} °C`}
                    </div>
                    <span className="text-[10px] text-slate-500">Stabilité biologique</span>
                  </div>
                </div>
              </div>

              {/* Traitements en cours */}
              {patient.currentTreatments.length > 0 && (
                <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-2 text-xs">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <span>💊</span> Traitement en cours au long cours :
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {patient.currentTreatments.map((t) => (
                      <div key={t.drug} className="bg-white p-2.5 rounded-lg border border-amber-200">
                        <div className="font-bold text-slate-900">{t.drug}</div>
                        <div className="text-[11px] text-slate-600">{t.dosage} — {t.frequency}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Specialized Modules Quick Launchers (Dental, Obstetric, Pediatric) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-slate-700">Packs Spécialités Médicales :</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setDentalModalOpen(true)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-lg text-xs font-medium cursor-pointer shadow-2xs"
                  >
                    🦷 Schéma Dentaire FDI
                  </button>
                  <button
                    type="button"
                    onClick={() => setObstetricModalOpen(true)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-lg text-xs font-medium cursor-pointer shadow-2xs"
                  >
                    🤰 Suivi Obstétrique (SA)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPediatricModalOpen(true)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-lg text-xs font-medium cursor-pointer shadow-2xs"
                  >
                    👶 Courbes OMS & PNI
                  </button>
                </div>
              </div>

              {/* Interactive Tabs (Consultations, Prescriptions, Lab Results) */}
              <div className="space-y-4">
                <div className="flex border-b border-slate-200 text-xs font-medium gap-6">
                  <button
                    type="button"
                    onClick={() => setActiveTab('consultations')}
                    className={`pb-2 transition cursor-pointer ${
                      activeTab === 'consultations'
                        ? 'text-terracotta-700 font-bold border-b-2 border-terracotta-600'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Historique des Consultations ({patient.consultations.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('prescriptions')}
                    className={`pb-2 transition cursor-pointer ${
                      activeTab === 'prescriptions'
                        ? 'text-terracotta-700 font-bold border-b-2 border-terracotta-600'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Ordonnances Délivrées ({patient.prescriptions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('labs')}
                    className={`pb-2 transition cursor-pointer ${
                      activeTab === 'labs'
                        ? 'text-terracotta-700 font-bold border-b-2 border-terracotta-600'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Examens & Bilans ({patient.labResults.length})
                  </button>
                </div>

                {/* Tab 1: Consultations Timeline */}
                {activeTab === 'consultations' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Parcours chronologique des actes et observations</span>
                      <Button
                        size="sm"
                        onClick={() => setRxModalOpen(true)}
                        className="bg-terracotta-600 hover:bg-terracotta-700 text-white text-xs font-semibold"
                      >
                        + Rédiger Ordonnance
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {patient.consultations.map((c) => (
                        <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>📅 {c.date}</span>
                              <span className="text-slate-400">·</span>
                              <span className="text-terracotta-700">{c.motif}</span>
                            </div>
                            <span className="text-slate-400 font-mono text-[11px]">{c.doctorName}</span>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                            <div className="font-semibold text-slate-800">Diagnostic retenu :</div>
                            <p className="text-slate-600">{c.diagnostic}</p>
                            {c.notes && (
                              <p className="text-[11px] text-slate-500 italic mt-1 border-t border-slate-100 pt-1">
                                Note : {c.notes}
                              </p>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-600">
                            <strong>Prescription : </strong> {c.treatmentPrescribed}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 2: Prescriptions List */}
                {activeTab === 'prescriptions' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Ordonnances officielles avec QR Code d&apos;authenticité</span>
                      <Button
                        size="sm"
                        onClick={() => setRxModalOpen(true)}
                        className="bg-terracotta-600 hover:bg-terracotta-700 text-white text-xs font-semibold"
                      >
                        + Nouvelle Ordonnance
                      </Button>
                    </div>

                    {patient.prescriptions.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                        Aucune ordonnance délivrée pour le moment.
                      </div>
                    ) : (
                      patient.prescriptions.map((rx) => (
                        <div key={rx.id} className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-4 text-xs">
                          <div>
                            <div className="font-bold text-slate-900">
                              Ordonnance du {rx.date}
                            </div>
                            <ul className="list-disc list-inside text-slate-600 mt-1 space-y-0.5">
                              {rx.medications.map((m) => (
                                <li key={m}>{m}</li>
                              ))}
                            </ul>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRxModalOpen(true)}
                            className="text-xs"
                          >
                            🖨 Imprimer PDF
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Tab 3: Lab Results & Imaging */}
                {activeTab === 'labs' && (
                  <div className="space-y-3 text-xs">
                    <span className="text-slate-500 block">Bilans de laboratoire et imageries numérisées</span>
                    {patient.labResults.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                        Aucun bilan biologique téléversé.
                      </div>
                    ) : (
                      patient.labResults.map((l) => (
                        <div key={l.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>🧪 {l.title}</span>
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold uppercase">
                                {l.status}
                              </span>
                            </div>
                            <span className="font-mono text-slate-400 text-[11px]">{l.date}</span>
                          </div>
                          <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono text-[11px]">
                            {l.summary}
                          </p>
                          <div className="text-[11px] text-slate-400">
                            Source : {l.laboratory}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-slate-400 text-xs">
              Sélectionnez un patient dans la colonne de gauche.
            </div>
          )}
        </div>
      </div>

      {/* Modal: New Patient Register */}
      <NewPatientModal
        open={newPatientOpen}
        onOpenChange={setNewPatientOpen}
        onSave={handleSaveNewPatient}
      />

      {/* Modal: Prescription Pad */}
      <PrescriptionModal
        open={rxModalOpen}
        onOpenChange={setRxModalOpen}
        appointment={{
          id: 'rx-direct',
          patient: {
            id: patient?.id || 'p-1',
            first_name: patient?.firstName || '',
            last_name: patient?.lastName || '',
            cin: patient?.cin || '',
            phone: patient?.phone || '',
          },
        } as any}
      />

      {/* Modal: Medical Certificate */}
      <MedicalCertificateModal
        open={certModalOpen}
        onOpenChange={setCertModalOpen}
        appointment={{
          id: 'cert-direct',
          patient: {
            id: patient?.id || 'p-1',
            first_name: patient?.firstName || '',
            last_name: patient?.lastName || '',
            cin: patient?.cin || '',
          },
        } as any}
      />

      {/* Modal: WhatsApp Reminder / Contact */}
      <WhatsAppReminderModal
        open={whatsAppModalOpen}
        onOpenChange={setWhatsAppModalOpen}
        appointment={{
          id: 'wa-direct',
          patient: {
            id: patient?.id || 'p-1',
            first_name: patient?.firstName || '',
            last_name: patient?.lastName || '',
            phone: patient?.phone || '',
          },
        } as any}
      />

      {/* Modal: New Appointment */}
      <NewAppointmentModal
        open={apptModalOpen}
        onOpenChange={setApptModalOpen}
        doctorId="doc-benali-casablanca"
        doctorName="Dr. Amine Benali"
        timezone="Africa/Casablanca"
        defaultDate={new Date()}
        onSuccess={() => {
          setApptModalOpen(false);
          setToast('Rendez-vous planifié avec succès pour ce patient');
          setTimeout(() => setToast(null), 3000);
        }}
      />

      {/* Specialty Modals */}
      <DentalOdontogramModal
        open={dentalModalOpen}
        onOpenChange={setDentalModalOpen}
        appointment={currentMockAppointment}
      />
      <ObstetricTrackerModal
        open={obstetricModalOpen}
        onOpenChange={setObstetricModalOpen}
        appointment={currentMockAppointment}
      />
      <PediatricTrackerModal
        open={pediatricModalOpen}
        onOpenChange={setPediatricModalOpen}
        appointment={currentMockAppointment}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 bg-emerald-600 text-white text-xs font-semibold rounded-lg px-4 py-2.5 shadow-lg z-50 flex items-center gap-2 animate-fade-in"
        >
          <span>✓</span>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
