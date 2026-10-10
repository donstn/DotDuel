import { useEffect, useMemo, useState } from 'react';
import { dateToUtcKey } from '../dailyPuzzles';
import {
  fetchDailyMonth,
  fetchFirstDailyDate,
  type DailyMonth,
} from '../cloud/dailyLeaderboard';
import { useLang, useT } from '../i18n';

interface Props {
  myUid: string | null;
  onClose: () => void;
}

// Months are 'YYYY-MM' keys and days 'YYYY-MM-DD' keys, all UTC (the daily
// puzzle rolls over at midnight UTC), so every Date here is built with Date.UTC
// and formatted with timeZone: 'UTC' to avoid local-timezone drift.
function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

function utcDate(dayKey: string): Date {
  return new Date(`${dayKey}T00:00:00Z`);
}

// Daily-puzzle results calendar. A month grid shows each day's winning score
// (👑 on days the viewer won); tapping a day lists everyone who finished that
// day's puzzle, best first. Today is shown live.
export function PuzzleLeaderboardPopover({ myUid, onClose }: Props) {
  const t = useT();
  const { lang } = useLang();
  const today = dateToUtcKey();
  const thisMonth = today.slice(0, 7);

  const [month, setMonth] = useState(thisMonth);
  const [selected, setSelected] = useState<string | null>(today);
  const [cache, setCache] = useState<Record<string, DailyMonth | 'error'>>({});
  const [firstMonth, setFirstMonth] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    let alive = true;
    fetchFirstDailyDate().then((d) => {
      if (alive && d) setFirstMonth(d.slice(0, 7));
    });
    return () => {
      alive = false;
    };
  }, []);

  const data = cache[month];

  useEffect(() => {
    if (data !== undefined && data !== 'error') return;
    let alive = true;
    fetchDailyMonth(month).then((m) => {
      if (alive) setCache((c) => ({ ...c, [month]: m ?? 'error' }));
    });
    return () => {
      alive = false;
    };
    // data is intentionally omitted: refetch only on month change or Retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, reloadTick]);

  // Landing on a past month: open its most recent played day.
  useEffect(() => {
    if (selected !== null || !data || data === 'error') return;
    const days = [...data.results.keys()].sort();
    if (days.length > 0) setSelected(days[days.length - 1]);
  }, [data, selected]);

  const goMonth = (delta: number) => {
    const next = shiftMonth(month, delta);
    setMonth(next);
    setSelected(next === thisMonth ? today : null);
  };

  const fmt = useMemo(
    () => ({
      month: new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric', timeZone: 'UTC' }),
      day: new Intl.DateTimeFormat(lang, { month: 'long', day: 'numeric', timeZone: 'UTC' }),
      weekday: new Intl.DateTimeFormat(lang, { weekday: 'narrow', timeZone: 'UTC' }),
    }),
    [lang],
  );

  // Monday-first weekday initials (2024-01-01 was a Monday).
  const weekdays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        fmt.weekday.format(new Date(Date.UTC(2024, 0, 1 + i))),
      ),
    [fmt],
  );

  const cells = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
    const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const out: (string | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= count; d++) out.push(`${month}-${String(d).padStart(2, '0')}`);
    return out;
  }, [month]);

  const onBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const monthTitle = fmt.month.format(utcDate(`${month}-01`));
  const canPrev = firstMonth !== null && month > firstMonth;
  const canNext = month < thisMonth;
  const loaded = data && data !== 'error' ? data : null;
  const dayResults = loaded && selected ? loaded.results.get(selected) ?? [] : [];
  const dayDef = loaded && selected ? loaded.defs.get(selected) : undefined;

  return (
    <div
      className="rules-overlay"
      onClick={onBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label={t.puzzleBoard.aria}
    >
      <div className="rules-card puzzle-lb-card">
        <button className="rules-close" onClick={onClose} aria-label={t.puzzleBoard.close}>
          ✕
        </button>

        <header className="rules-header">
          <h2>{t.puzzleBoard.title}</h2>
          <p className="rules-tagline">{t.puzzleBoard.tagline}</p>
        </header>

        <div className="puzzle-lb-body">
          <div className="pcal-nav">
            <button
              className="pcal-nav-btn"
              onClick={() => goMonth(-1)}
              disabled={!canPrev}
              aria-label={t.puzzleBoard.prevMonth}
            >
              ‹
            </button>
            <span className="pcal-month">{monthTitle}</span>
            <button
              className="pcal-nav-btn"
              onClick={() => goMonth(1)}
              disabled={!canNext}
              aria-label={t.puzzleBoard.nextMonth}
            >
              ›
            </button>
          </div>

          <div className="pcal-grid" role="group" aria-label={monthTitle}>
            {weekdays.map((w, i) => (
              <span key={`w${i}`} className="pcal-weekday" aria-hidden="true">
                {w}
              </span>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <span key={`b${i}`} className="pcal-blank" />;
              const results = loaded?.results.get(day);
              const winner = results?.[0];
              const isToday = day === today;
              const future = day > today;
              const played = results !== undefined;
              const iWon = !!winner && myUid !== null && winner.uid === myUid;
              const iPlayed = !!results && myUid !== null && results.some((r) => r.uid === myUid);
              const label = fmt.day.format(utcDate(day));
              const cls = [
                'pcal-day',
                played && 'pcal-played',
                isToday && 'pcal-today',
                day === selected && 'pcal-selected',
                iPlayed && 'pcal-mine',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <button
                  key={day}
                  className={cls}
                  disabled={future || (!played && !isToday)}
                  onClick={() => setSelected(day)}
                  aria-pressed={day === selected}
                  aria-label={
                    winner
                      ? t.puzzleBoard.cellWinner(label, winner.displayName, winner.best)
                      : t.puzzleBoard.cellEmpty(label)
                  }
                >
                  <span className="pcal-num">{Number(day.slice(8))}</span>
                  <span className="pcal-score">
                    {iWon ? '👑' : winner ? winner.best : ''}
                  </span>
                </button>
              );
            })}
          </div>

          {data === undefined ? (
            <p className="settings-hint">{t.puzzleBoard.loading}</p>
          ) : data === 'error' ? (
            <p className="settings-hint">
              {t.puzzleBoard.loadError}{' '}
              <button className="pcal-retry" onClick={() => setReloadTick((n) => n + 1)}>
                {t.puzzleBoard.retry}
              </button>
            </p>
          ) : selected ? (
            <section className="pcal-day-detail" aria-live="polite">
              <div className="pcal-day-head">
                <span className="pcal-day-title">
                  {selected === today ? t.puzzleBoard.today : fmt.day.format(utcDate(selected))}
                  {selected === today && <span className="pcal-live">{t.puzzleBoard.live}</span>}
                </span>
                {dayResults.length > 0 && (
                  <span className="pcal-day-count">{t.puzzleBoard.players(dayResults.length)}</span>
                )}
              </div>
              {dayDef && (
                <p className="pcal-day-info">
                  {t.puzzleBoard.dayInfo(t.shapes[dayDef.shape], t.difficulty[dayDef.aiLevel])}
                </p>
              )}
              {dayResults.length === 0 ? (
                <p className="puzzle-lb-empty">
                  {selected === today ? t.puzzleBoard.todayEmpty : t.puzzleBoard.dayEmpty}
                </p>
              ) : (
                <ol className="puzzle-lb-list">
                  {dayResults.map((r, i) => {
                    const isMe = myUid !== null && r.uid === myUid;
                    return (
                      <li
                        key={r.uid}
                        className={`puzzle-lb-row${isMe ? ' puzzle-lb-row-me' : ''}`}
                      >
                        <span className="puzzle-lb-rank">{i === 0 ? '👑' : i + 1}</span>
                        <span className="puzzle-lb-name" title={r.displayName}>
                          {r.displayName}
                          {isMe && <span className="puzzle-lb-you">{t.puzzleBoard.you}</span>}
                        </span>
                        <span className="puzzle-lb-margin">{r.best}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          ) : null}
        </div>

        <footer className="rules-footer-bar">
          <button className="rules-got-it" onClick={onClose}>
            {t.puzzleBoard.done}
          </button>
        </footer>
      </div>
    </div>
  );
}
