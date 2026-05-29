import { useEffect, useState } from 'react';

interface Props {
  remainingAtRefMs: number;
  refTime: number;
  isRunning: boolean;
}

const LOW_TIME_MS = 10_000;
const TICK_MS = 200;

function format(ms: number): string {
  const safe = Math.max(0, Math.floor(ms));
  const minutes = Math.floor(safe / 60_000);
  const seconds = Math.floor((safe % 60_000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function ClockBadge({ remainingAtRefMs, refTime, isRunning }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(id);
  }, [isRunning]);

  // When the clock isn't running, the stored remaining value is authoritative.
  // When running, extrapolate locally from refTime (the server's turnStartedAt).
  // Clamp the elapsed value to non-negative — if the server's refTime briefly
  // appears to be in the FUTURE relative to the client (clock skew between
  // server and client, ~few hundred ms typical), the raw subtraction would
  // ADD to remaining and display values higher than the starting time.
  const elapsedMs = Math.max(0, now - refTime);
  const remaining = isRunning && refTime > 0
    ? remainingAtRefMs - elapsedMs
    : remainingAtRefMs;
  const safeRemaining = Math.max(0, remaining);
  const low = safeRemaining <= LOW_TIME_MS;

  return (
    <span
      className={`clock-badge${isRunning ? ' is-running' : ''}${low ? ' is-low' : ''}`}
      aria-label={`${format(safeRemaining)} remaining`}
    >
      {format(safeRemaining)}
    </span>
  );
}
