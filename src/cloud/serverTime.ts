import { supabase } from '../supabase';

// Online clocks extrapolate the active player's time from the server's
// `turnStartedAt` (epoch-ms) against the client's local `Date.now()`. If the
// client's wall clock is skewed vs the server, that subtraction is wrong on
// every turn. measureServerSkewMs estimates the offset so callers can convert
// local time to server time: serverNow ≈ Date.now() + skew.
//
// NTP-style: sample a few times, keep the lowest-RTT sample (least asymmetric),
// and place the server timestamp at the midpoint of the request window.
export async function measureServerSkewMs(samples = 3): Promise<number> {
  let best = 0;
  let bestRtt = Infinity;
  for (let i = 0; i < samples; i++) {
    const t0 = Date.now();
    const { data, error } = await supabase.rpc('server_now_ms');
    const t1 = Date.now();
    if (error || data == null) continue;
    const rtt = t1 - t0;
    if (rtt < bestRtt) {
      bestRtt = rtt;
      best = Number(data) - (t0 + rtt / 2);
    }
  }
  return best;
}
