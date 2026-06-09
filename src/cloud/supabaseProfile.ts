import { supabase } from '../supabase';

// Keep the Supabase profile's display_name in sync with the player's DotDuel
// name (sourced from the Firebase cloud profile during the dual-auth bridge),
// so every Supabase feature shows it instead of falling back per call.
// display_name is owner-writable + not guarded, so a plain RLS update works.
export async function syncProfileName(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: trimmed })
    .eq('id', user.id);
  if (error) console.warn('syncProfileName error:', error.message);
}

// Privacy preferences (challenge policy, presence visibility, hidden friend
// list). These columns are owner-writable + unguarded, so a plain RLS update
// works. Replaces the old Firestore users/{uid} write.
export async function updatePrivacy(next: {
  challengePolicy?: 'everyone' | 'friends-only' | 'nobody';
  showPresence?: boolean;
  friendListHidden?: boolean;
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const patch: Record<string, unknown> = {};
  if (next.challengePolicy !== undefined) patch.challenge_policy = next.challengePolicy;
  if (next.showPresence !== undefined) patch.show_presence = next.showPresence;
  if (next.friendListHidden !== undefined) patch.friend_list_hidden = next.friendListHidden;
  if (Object.keys(patch).length === 0) return;
  const { error } = await supabase.from('profiles').update(patch).eq('id', user.id);
  if (error) console.warn('updatePrivacy error:', error.message);
}
