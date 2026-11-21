// Android app: one local "keep your streak" notification, scheduled on the
// phone (no server, nothing leaves the device). From a 3-day streak on, the
// app keeps exactly one reminder pending: at the chosen local time on the
// next UTC day the player still has to play. Playing cancels and moves it.
import { Capacitor } from '@capacitor/core';
import { aliveStreak, playedToday, utcDay, type DayStreak } from './streak';

const REMINDER_ID = 4201;
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
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
    const n = aliveStreak(streak);
    if (!o.on || n < REMINDER_MIN_STREAK) return;
    let perm = (await LocalNotifications.checkPermissions()).display;
    if (perm !== 'granted') {
      if (!o.ask || perm === 'denied') return;
      perm = (await LocalNotifications.requestPermissions()).display;
      if (perm !== 'granted') return;
    }
    const now = Date.now();
    const at = remindAt(playedToday(streak, now) ? utcDay(1, now) : utcDay(0, now), o.time, now);
    if (!at) return;
    await LocalNotifications.schedule({
      notifications: [
        {
          id: REMINDER_ID,
          title: o.title(n),
          body: o.body,
          schedule: { at, allowWhileIdle: true },
          smallIcon: 'ic_stat_dotduel',
          iconColor: '#7BDB95',
        },
      ],
    });
  } catch (e) {
    console.warn('streak reminder failed:', e);
  }
}
