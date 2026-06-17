import { useEffect, useRef, useState } from 'react';
import { Board } from './Board';
import { getScenes, type Scene } from './howto/sceneBuilders';
import type { Player } from '../types';
import { useT } from '../i18n';

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/**
 * Current frame of a looping scene. Honours prefers-reduced-motion (freezes on
 * the most-complete frame, no JS loop) and a paused flag (freeze on the current
 * frame). Resets to the first frame when the scene changes.
 */
function useSceneFrame(scene: Scene, paused: boolean, reduced: boolean) {
  const [i, setI] = useState(0);
  const prevId = useRef(scene.id);
  if (prevId.current !== scene.id) {
    prevId.current = scene.id;
    setI(0); // reset during render on scene change (no flicker)
  }

  useEffect(() => {
    if (paused || reduced) return;
    const frame = scene.frames[i] ?? scene.frames[0];
    const timer = window.setTimeout(
      () => setI((p) => (p + 1) % scene.frames.length),
      frame.hold,
    );
    return () => window.clearTimeout(timer);
  }, [i, scene, paused, reduced]);

  const shown = reduced ? scene.frames.length - 1 : Math.min(i, scene.frames.length - 1);
  return scene.frames[shown];
}

function ScoreBoard({
  scores,
  winner,
  t,
}: {
  scores: Record<Player, number>;
  winner: 1 | 2 | 'draw' | null;
  t: ReturnType<typeof useT>;
}) {
  const cls = (p: Player) =>
    `howto-score-side howto-score-p${p}${winner === p ? ' is-winner' : ''}`;
  return (
    <div
      className={`howto-score${winner ? ' is-final' : ''}`}
      role="img"
      aria-label={`${t.matchFound.playerN(1)} ${scores[1]}, ${t.matchFound.playerN(2)} ${scores[2]}`}
    >
      <span className={cls(1)}>
        <span className="howto-score-dot" aria-hidden="true" />
        <span className="howto-score-num">{scores[1]}</span>
      </span>
      <span className="howto-score-sep" aria-hidden="true">
        –
      </span>
      <span className={cls(2)}>
        <span className="howto-score-num">{scores[2]}</span>
        <span className="howto-score-dot" aria-hidden="true" />
      </span>
    </div>
  );
}

export function HowToPlayPopover({ onClose }: { onClose: () => void }) {
  const t = useT();
  const reduced = usePrefersReducedMotion();
  const scenes = getScenes();
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const scene = scenes[idx];
  const swipeX = useRef<number | null>(null);
  const swiped = useRef(false);

  const frame = useSceneFrame(scene, paused, reduced);

  const go = (delta: number) =>
    setIdx((p) => (p + delta + scenes.length) % scenes.length);

  // Any scene change resumes autoplay — otherwise a paused scene leaves the next
  // one frozen on its (empty) first frame.
  useEffect(() => {
    setPaused(false);
  }, [idx]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, scenes.length]);

  const captions = t.howto.scenes as Record<string, { title: string; body: string }>;
  const cap = captions[scene.id] ?? { title: '', body: '' };

  return (
    <div
      className="rules-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={t.howto.aria}
    >
      <div className="rules-card howto-card">
        <button className="rules-close" onClick={onClose} aria-label={t.howto.close}>
          ✕
        </button>

        <header className="rules-header">
          <h2>{t.howto.title}</h2>
          <p className="rules-tagline">{t.howto.tagline}</p>
        </header>

        <div className="howto-body">
          <ScoreBoard
            scores={frame.state.scores}
            winner={frame.state.finished ? frame.state.winner : null}
            t={t}
          />

          <div
            className="howto-stage"
            onPointerDown={(e) => {
              swipeX.current = e.clientX;
              swiped.current = false;
            }}
            onPointerUp={(e) => {
              if (swipeX.current === null) return;
              const dx = e.clientX - swipeX.current;
              swipeX.current = null;
              if (Math.abs(dx) > 40) {
                swiped.current = true; // swallow the click that follows the swipe
                go(dx < 0 ? 1 : -1);
              }
            }}
          >
            <button
              type="button"
              className="howto-nav howto-prev"
              onClick={() => go(-1)}
              aria-label={t.howto.prev}
            >
              ‹
            </button>
            <button
              type="button"
              className="howto-board"
              key={scene.id}
              onClick={() => {
                if (swiped.current) {
                  swiped.current = false;
                  return;
                }
                if (!reduced) setPaused((p) => !p);
              }}
              aria-label={`${cap.title}. ${cap.body}`}
            >
              <Board
                state={frame.state}
                disabled
                lastDot={frame.lastDot}
                scoreEvent={paused || reduced ? null : frame.score}
              />
            </button>
            <button
              type="button"
              className="howto-nav howto-next"
              onClick={() => go(1)}
              aria-label={t.howto.next}
            >
              ›
            </button>
          </div>

          <div className="howto-caption" aria-live="polite">
            <strong className="howto-caption-title">{cap.title}</strong>
            <span className="howto-caption-body">{cap.body}</span>
          </div>

          <div className="howto-dots" role="group" aria-label={t.howto.title}>
            {scenes.map((s, n) => (
              <button
                key={s.id}
                type="button"
                aria-current={n === idx ? 'true' : undefined}
                aria-label={`${n + 1}/${scenes.length}: ${captions[s.id]?.title ?? s.id}`}
                className={`howto-dot ${n === idx ? 'is-active' : ''}`}
                onClick={() => setIdx(n)}
              >
                <span className="howto-dot-pip" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>

        <footer className="rules-footer-bar">
          <button className="rules-got-it" onClick={onClose}>
            {t.howto.done}
          </button>
        </footer>
      </div>
    </div>
  );
}
