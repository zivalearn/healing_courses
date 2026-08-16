export type EnrollmentStatus =
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'expired'
  | 'refunded';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded';

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  payment_status: PaymentStatus;
  amount_paid: number;
  enrolled_at?: string;
  expires_at?: string | null;
  completed_at?: string | null;
  last_accessed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type CreateEnrollmentInput = {
  id?: string;
  user_id: string;
  course_id: string;
  status?: EnrollmentStatus;
  payment_status?: PaymentStatus;
  amount_paid?: number;
  enrolled_at?: string;
  expires_at?: string | null;
  completed_at?: string | null;
  last_accessed_at?: string | null;
};

export type UpdateEnrollmentInput = Partial<
  Omit<Enrollment, 'id' | 'user_id' | 'course_id' | 'created_at' | 'updated_at'>
>;
