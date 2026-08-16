export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_id?: string | null;
  certificate_number: string;
  verification_token?: string | null;
  issued_at?: string | null;
  expires_at?: string | null;
  pdf_url?: string | null;
  student_name?: string | null;
  course_title?: string | null;
  instructor_name?: string | null;
  final_score?: number | null;
  is_revoked?: boolean;
  revoked_at?: string | null;
  revoke_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type CreateCertificateInput = {
  id?: string;
  user_id: string;
  course_id: string;
  enrollment_id?: string | null;
  certificate_number?: string;
  verification_token?: string | null;
  issued_at?: string | null;
  expires_at?: string | null;
  pdf_url?: string | null;
  student_name?: string | null;
  course_title?: string | null;
  instructor_name?: string | null;
  final_score?: number | null;
  is_revoked?: boolean;
  revoked_at?: string | null;
  revoke_reason?: string | null;
};

export type RevokeCertificateInput = {
  revoke_reason?: string;
  revoked_at?: string;
};
