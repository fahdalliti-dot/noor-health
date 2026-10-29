export interface CreateCertificateDto {
  patient_id: string;
  type: 'aptitude' | 'arret_travail' | 'coups_et_blessures' | 'prolonge_arret';
  title: string;
  content: string;
  start_date?: string;
  end_date?: string;
  itt_days?: number;
}
