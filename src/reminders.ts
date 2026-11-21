// Android app: one "keep your streak" reminder. From a 3-day streak on, the
// app keeps exactly one pending: at the chosen local time on the next UTC day
// the player still has to play. Playing in the app moves it; at reminder time
// the native StreakReminderWorker first asks the server (reminder_status, by a
// random per-player key, not the account id) and stays silent if the player
// already played that day anywhere, e.g. on the website.
import { Capacitor, registerPlugin } from '@capacitor/core';
import { aliveStreak, playedToday, utcDay, type DayStreak } from './streak';
import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from './supabase';

interface StreakReminderPlugin {
  schedule(o: {
    at: number;
    day: string;
    deadline: number;
    title: string;
    body: string;
    key: string;
    url: string;
    apikey: string;
  }): Promise<void>;
  cancel(): Promise<void>;
}
const StreakReminder = registerPlugin<StreakReminderPlugin>('StreakReminder');

// Per app run; the key never changes for an account.
let keyCache: { sid: string; key: string } | null = null;
async function reminderKey(): Promise<string> {
  const { data: sess } = await supabase.auth.getSession();
  const sid = sess.session?.user.id;
  if (!sid) return '';
  if (keyCache?.sid === sid) return keyCache.key;
  const { data, error } = await supabase.rpc('my_reminder_key');
  if (error || typeof data !== 'string') return '';
  keyCache = { sid, key: data };
  return data;
}

export const REMINDER_MIN_STREAK = 3;

export interface ReminderOptions {
  on: boolean;
  time: string; // 'HH:MM', local
  /** May show Android's notification permission prompt. */
  ask: boolean;
  title: (n: number) => string;
  body: string;
}

/** The moment to remind for `day` (UTC): `time` on that local date, or the
 *  local date before when the timezone pushes it past the UTC day. */
export function remindAt(day: string, time: string, now: number): Date | null {
  const [h, m] = time.split(':').map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const [y, mo, d] = day.split('-').map((x) => parseInt(x, 10));
  const start = Date.UTC(y, mo - 1, d);
  const end = start + 86_400_000;
  for (const shift of [0, -1, 1]) {
    const at = new Date(y, mo - 1, d + shift, h, m, 0, 0);
    const t = at.getTime();
    if (t >= start && t < end && t > now + 60_000) return at;
  }
  return null;
}

export async function syncStreakReminder(streak: DayStreak | null | undefined, o: ReminderOptions): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await StreakReminder.cancel();
    const n = aliveStreak(streak);
    if (!o.on || n < REMINDER_MIN_STREAK) return;
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    let perm = (await LocalNotifications.checkPermissions()).display;
    if (perm !== 'granted') {
      if (!o.ask || perm === 'denied') return;
      perm = (await LocalNotifications.requestPermissions()).display;
      if (perm !== 'granted') return;
    }
    const now = Date.now();
    const day = playedToday(streak, now) ? utcDay(1, now) : utcDay(0, now);
    const at = remindAt(day, o.time, now);
    if (!at) return;
    const [y, mo, d] = day.split('-').map((x) => parseInt(x, 10));
    await StreakReminder.schedule({
      at: at.getTime(),
      day,
      deadline: Date.UTC(y, mo - 1, d + 1),
      title: o.title(n),
      body: o.body,
      key: await reminderKey(),
      url: SUPABASE_URL,
      apikey: SUPABASE_ANON_KEY,
    });
  } catch (e) {
    console.warn('streak reminder failed:', e);
  }
}
