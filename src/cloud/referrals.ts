import { supabase } from '../supabase';

// Share links carry ?ref=<CODE> — a random 6-char code from the sharer's
// profile, never an account id. These RPCs resolve/attribute it server-side.

export const REF_CODE_RE = /^[A-Za-z2-9]{6}$/;

/** Code → account uuid, for the auto-friend-request flow. Null when the code
 *  doesn't exist (expired screenshot, typo'd QR, legacy link). */
export async function resolveReferralCode(code: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('resolve_referral_code', { p_code: code });
  if (error) return null;
  return typeof data === 'string' ? data : null;
}

/** Write-once "who brought this player in" attribution. The server refuses
 *  self-referral, unknown codes, accounts older than 48h, and double claims —
 *  callers just swallow the rejection. */
export async function claimReferral(code: string): Promise<void> {
  const { error } = await supabase.rpc('claim_referral', { p_code: code });
  if (error) throw new Error(error.message);
}
