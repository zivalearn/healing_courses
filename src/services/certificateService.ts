import { supabase } from '../lib/supabase';
import {
  Certificate,
  CreateCertificateInput,
  RevokeCertificateInput,
} from '../types/certificate';

/**
 * Generate a default unique certificate number if one is not provided.
 */
function generateCertificateNumber(): string {
  const prefix = 'CERT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Create a new certificate record in Supabase.
 */
export async function createCertificate(
  certData: CreateCertificateInput
): Promise<{ data: Certificate | null; error: Error | null }> {
  try {
    const now = new Date().toISOString();
    const certNumber = certData.certificate_number || generateCertificateNumber();

    const payload = {
      ...certData,
      certificate_number: certNumber,
      issued_at: certData.issued_at || now,
      is_revoked: certData.is_revoked ?? false,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('certificates')
      .insert(payload)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }
    return { data: data as Certificate, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Get a certificate by its UUID ID.
 */
export async function getCertificate(
  id: string
): Promise<{ data: Certificate | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }
    return { data: data as Certificate | null, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Fetch all certificates for a specific user ID.
 */
export async function getUserCertificates(
  userId: string
): Promise<{ data: Certificate[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('user_id', userId)
      .order('issued_at', { ascending: false });

    if (error) {
      return { data: [], error };
    }
    return { data: (data as Certificate[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

/**
 * Verify a certificate by either verification_token or certificate_number.
 */
export async function verifyCertificate(
  tokenOrNumber: string
): Promise<{ data: Certificate | null; error: Error | null; isValid: boolean }> {
  try {
    // Check by verification_token first, then by certificate_number
    let { data, error } = await supabase
      .from('certificates')
      .select('*')
      .or(`verification_token.eq.${tokenOrNumber},certificate_number.eq.${tokenOrNumber}`)
      .maybeSingle();

    if (error) {
      return { data: null, error, isValid: false };
    }

    if (!data) {
      return { data: null, error: null, isValid: false };
    }

    const certificate = data as Certificate;
    const isRevoked = certificate.is_revoked === true;
    const isExpired = certificate.expires_at ? new Date(certificate.expires_at) < new Date() : false;
    const isValid = !isRevoked && !isExpired;

    return {
      data: certificate,
      error: null,
      isValid,
    };
  } catch (err: any) {
    return { data: null, error: err, isValid: false };
  }
}

/**
 * Revoke a certificate by setting is_revoked = true, revoked_at, and revoke_reason.
 */
export async function revokeCertificate(
  id: string,
  revokeInfo?: RevokeCertificateInput | string
): Promise<{ data: Certificate | null; error: Error | null }> {
  try {
    const now = new Date().toISOString();
    const reason = typeof revokeInfo === 'string' ? revokeInfo : revokeInfo?.revoke_reason;
    const revokedAt = typeof revokeInfo === 'object' && revokeInfo?.revoked_at ? revokeInfo.revoked_at : now;

    const payload = {
      is_revoked: true,
      revoked_at: revokedAt,
      revoke_reason: reason || 'Revoked by admin',
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('certificates')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }
    return { data: data as Certificate | null, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Delete a certificate record by ID.
 */
export async function deleteCertificate(
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('certificates')
      .delete()
      .eq('id', id);

    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

/**
 * Fetch all certificates across all users.
 */
export async function getAllCertificates(): Promise<{ data: Certificate[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .order('issued_at', { ascending: false });

    if (error) {
      return { data: [], error };
    }
    return { data: (data as Certificate[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

export const certificateService = {
  getAllCertificates,
  createCertificate,
  getCertificate,
  getUserCertificates,
  verifyCertificate,
  revokeCertificate,
  deleteCertificate,
};

export default certificateService;
