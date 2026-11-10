import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import './admin.css';

interface Day {
  date: string;
  registrations: number;
  matchesVsHuman: number;
  matchesVsBot: number;
  matchesAborted: number;
  puzzlePlayers: number;
  puzzleAttempts: number;
}

interface Stats {
  generatedAt: string;
  days: Day[];
  totals: {
    registered: number;
    onlineNow: number;
    matchesAllTime: number;
    platformLastUsed: Record<string, number>;
    everUsedApp: number;
    everUsedWeb: number;
    usedBoth: number;
  };
}

type Load =
  | { kind: 'loading' }
  | { kind: 'signedOut' }
  | { kind: 'denied' }
  | { kind: 'error'; message: string }
  | { kind: 'ok'; stats: Stats };

const RANGES = [7, 30, 90, 365];

const games = (d: Day) => d.matchesVsHuman + d.matchesVsBot;

function sum(days: Day[], f: (d: Day) => number): number {
  return days.reduce((n, d) => n + f(d), 0);
}

function Chart({ days }: { days: Day[] }) {
  const ordered = [...days].reverse();
  const max = Math.max(1, ...ordered.map((d) => Math.max(games(d), d.registrations)));
  const w = 100 / ordered.length;
  return (
    <svg className="admin-chart" viewBox="0 0 100 40" preserveAspectRatio="none" role="img"
      aria-label="Online games and registrations per day">
      {ordered.map((d, i) => {
        const g = (games(d) / max) * 38;
        const r = (d.registrations / max) * 38;
        return (
          <g key={d.date}>
            <title>{`${d.date}: ${games(d)} games, ${d.registrations} registrations`}</title>
            <rect x={i * w + w * 0.1} y={40 - g} width={w * 0.4} height={g} className="bar-games" />
            <rect x={i * w + w * 0.5} y={40 - r} width={w * 0.4} height={r} className="bar-reg" />
          </g>
        );
      })}
    </svg>
  );
}

export default function AdminPage() {
  const [range, setRange] = useState(30);
  const [load, setLoad] = useState<Load>({ kind: 'loading' });

  useEffect(() => {
    let alive = true;
    setLoad({ kind: 'loading' });
    void (async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        if (alive) setLoad({ kind: 'signedOut' });
        return;
      }
      const { data, error } = await supabase.rpc('admin_stats', { p_days: range });
      if (!alive) return;
      if (error) {
        setLoad(error.message.includes('NOT_ADMIN') ? { kind: 'denied' } : { kind: 'error', message: error.message });
      } else {
        setLoad({ kind: 'ok', stats: data as Stats });
      }
    })();
    return () => {
      alive = false;
    };
  }, [range]);

  if (load.kind === 'loading') return <div className="admin"><p>Loading…</p></div>;
  if (load.kind === 'signedOut') {
    return (
      <div className="admin">
        <p>Sign in on the <a href="/">home page</a> first, then open this page again.</p>
      </div>
    );
  }
  if (load.kind === 'denied') return <div className="admin"><p>This account is not an admin.</p></div>;
  if (load.kind === 'error') return <div className="admin"><p>Could not load stats: {load.message}</p></div>;

  const { days, totals, generatedAt } = load.stats;
  const today = days[0];
  const yesterday = days[1];

  return (
    <div className="admin">
      <header>
        <h1>DotDuel admin</h1>
        <div className="admin-range" role="group" aria-label="Range">
          {RANGES.map((r) => (
            <button key={r} type="button" aria-pressed={r === range} onClick={() => setRange(r)}>
              {r} days
            </button>
          ))}
        </div>
      </header>

      <section className="admin-cards">
        <Card label="Registered players" value={totals.registered} />
        <Card label="Online now" value={totals.onlineNow} />
        <Card label="Games today" value={today ? games(today) : 0} />
        <Card label="Games yesterday" value={yesterday ? games(yesterday) : 0} />
        <Card label={`Games, last ${range} days`} value={sum(days, games)} />
        <Card label={`New players, last ${range} days`} value={sum(days, (d) => d.registrations)} />
        <Card label="Online games, all time" value={totals.matchesAllTime} />
      </section>

      <h2>App or web (signed-in players)</h2>
      <section className="admin-cards">
        <Card label="Ever used the app" value={totals.everUsedApp} />
        <Card label="Ever used the web" value={totals.everUsedWeb} />
        <Card label="Used both" value={totals.usedBoth} />
        {Object.entries(totals.platformLastUsed).map(([p, n]) => (
          <Card key={p} label={`Last seen on: ${p}`} value={n} />
        ))}
      </section>

      <h2>Per day (UTC)</h2>
      <p className="admin-legend">
        <span className="swatch bar-games" /> online games <span className="swatch bar-reg" /> registrations
      </p>
      <Chart days={days} />
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>New players</th>
              <th>Games vs people</th>
              <th>Games vs bots</th>
              <th>Aborted</th>
              <th>Puzzle players</th>
              <th>Puzzle attempts</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.date}>
                <td>{d.date}</td>
                <td>{d.registrations}</td>
                <td>{d.matchesVsHuman}</td>
                <td>{d.matchesVsBot}</td>
                <td>{d.matchesAborted}</td>
                <td>{d.puzzlePlayers}</td>
                <td>{d.puzzleAttempts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="admin-note">
        Updated {new Date(generatedAt).toLocaleString()}. Online games only: games vs the built-in bots and
        same-device games are not sent to the server. Bots are excluded from player counts.
      </p>
    </div>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-card">
      <div className="admin-card-value">{value.toLocaleString()}</div>
      <div className="admin-card-label">{label}</div>
    </div>
  );
}
