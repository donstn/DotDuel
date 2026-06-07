// Provider-agnostic user shape. Components depend on THIS, not on Firebase's
// `User` or Supabase's `User`, so the backend stays swappable. Both providers
// map into it (see supabaseAuth.ts mapSupabaseUser; the Firebase path maps in
// useAuth.ts during the dual-auth bridge).
export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  provider: string; // 'google' | 'password' | ...
}
