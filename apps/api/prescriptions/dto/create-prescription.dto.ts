export interface PrescriptionItemDto {
  medication_name: string;
  dosage: string;
  form: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface CreatePrescriptionDto {
  patient_id: string;
  appointment_id?: string;
  prescription_date?: string;
  diagnosis?: string;
  notes?: string;
  items: PrescriptionItemDto[];
}
