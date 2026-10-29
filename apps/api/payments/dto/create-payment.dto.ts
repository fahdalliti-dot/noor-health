export interface CreatePaymentDto {
  patient_id?: string;
  appointment_id?: string;
  amount: number;
  currency?: string;
  method: 'cash' | 'cmi_card' | 'virement' | 'cheque';
  status?: 'completed' | 'pending' | 'failed' | 'refunded';
  notes?: string;
  cmi_transaction_id?: string;
}

export interface MockCmiProcessDto {
  patient_id?: string;
  appointment_id?: string;
  amount: number;
  card_holder: string;
  card_number: string;
  otp_code: string;
}
