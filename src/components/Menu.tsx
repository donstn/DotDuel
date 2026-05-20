import { useState } from 'react';
import { availableDifficulties, isUnlocked } from '../storage';
import type { Settings } from '../storage';
import { DIFFICULTY_LABELS, SHAPE_META } from '../types';
import type { Difficulty, GameMode, Progress, ShapeId } from '../types';

interface Props {
  progress: Progress;
  settings: Settings;
  onStart: (mode: GameMode, shape: ShapeId, difficulty?: Difficulty) => void;
  onSettingsUpdate: (next: Settings) => void;
}

export function Menu({ progress, settings, onStart, onSettingsUpdate }: Props) {
  const [mode, setMode] = useState<GameMode | null>(null);
  const [shape, setShape] = useState<ShapeId | null>(null);
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty | null>(null);

  if (!mode) {
    return (
      <div className="menu">
        <h1 className="title">
          <span className="title-dot title-dot-1">●</span>
          <span className="title-text">DotDuel</span>
          <span className="title-dot title-dot-2">●</span>
        </h1>
        <p className="subtitle">Take turns coloring dots. Complete a line — score its length.</p>
        <p className="version-badge">v29 · total points scored/given</p>
        <div className="menu-section">
          <h2>Choose mode</h2>
          <div className="menu-grid">
            <button className="menu-card" onClick={() => setMode('ai')}>
              <strong>Vs AI</strong>
              <span>Play against the bot.</span>
            </button>
            <button className="menu-card" onClick={() => setMode('hotseat')}>
              <strong>Hot-seat</strong>
              <span>Two players, one device.</span>
            </button>
            <button
              className="menu-card disabled"
              disabled
              title="Coming soon"
            >
              <strong>Multiplayer</strong>
              <span>Coming soon.</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'hotseat' && !shape) {
    return (
      <div className="menu">
        <button className="link-btn back-link" onClick={() => setMode(null)}>‹ Back</button>
        <h2>Choose shape</h2>
        <div className="menu-grid">
          {SHAPE_META.map((s) => (
            <button
              key={s.id}
              className="menu-card"
              onClick={() => setShape(s.id)}
            >
              <strong>{s.label}</strong>
              <span>{s.dots} dots</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (mode === 'hotseat' && shape) {
    return (
      <HotseatSetup
        shape={shape}
        settings={settings}
        onBack={() => setShape(null)}
        onStart={(p1, p2, swap) => {
          onSettingsUpdate({
            ...settings,
            playerName: p1,
            opponentName: p2,
            hotseatColorSwap: swap,
          });
          onStart('hotseat', shape);
        }}
      />
    );
  }

  if (mode === 'ai' && !shape) {
    return (
      <div className="menu">
        <button className="link-btn back-link" onClick={() => setMode(null)}>‹ Back</button>
        <h2>Choose shape</h2>
        <div className="menu-grid">
          {SHAPE_META.map((s) => {
            const unlockedAny = progress.unlocked[s.id] > 0;
            return (
              <button
                key={s.id}
                className={`menu-card ${unlockedAny ? '' : 'disabled'}`}
                disabled={!unlockedAny}
                onClick={() => setShape(s.id)}
                title={unlockedAny ? '' : 'Beat the previous shape on Hard to unlock'}
              >
                <strong>{s.label}</strong>
                <span>{unlockedAny ? `${s.dots} dots` : 'Locked'}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (mode === 'ai' && shape && aiDifficulty === null) {
    const all: Difficulty[] = [1, 2, 3, 4, 5];
    const available = availableDifficulties(progress, shape);
    return (
      <div className="menu">
        <button className="link-btn back-link" onClick={() => setShape(null)}>‹ Back</button>
        <h2>Choose difficulty</h2>
        <p className="hint">{SHAPE_META.find((s) => s.id === shape)!.label}</p>
        <div className="menu-grid">
          {all.map((d) => {
            const unlocked = isUnlocked(progress, shape, d) || available.includes(d);
            return (
              <button
                key={d}
                className={`menu-card ${unlocked ? '' : 'disabled'}`}
                disabled={!unlocked}
                onClick={() => setAiDifficulty(d)}
              >
                <strong>{DIFFICULTY_LABELS[d]}</strong>
                <span>{unlocked ? `Level ${d}` : 'Locked'}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (mode === 'ai' && shape && aiDifficulty !== null) {
    return (
      <VsAISetup
        shape={shape}
        difficulty={aiDifficulty}
        settings={settings}
        onBack={() => setAiDifficulty(null)}
        onStart={(name) => {
          onSettingsUpdate({ ...settings, playerName: name });
          onStart('ai', shape, aiDifficulty);
        }}
      />
    );
  }

  return null;
}

interface VsAISetupProps {
  shape: ShapeId;
  difficulty: Difficulty;
  settings: Settings;
  onBack: () => void;
  onStart: (name: string) => void;
}

function VsAISetup({ shape, difficulty, settings, onBack, onStart }: VsAISetupProps) {
  const [name, setName] = useState(settings.playerName || 'Player 1');
  const meta = SHAPE_META.find((s) => s.id === shape)!;

  const start = () => {
    onStart(name.trim() || 'Player 1');
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') start();
  };

  return (
    <div className="menu">
      <button className="link-btn back-link" onClick={onBack}>‹ Back</button>
      <h2>Who's playing?</h2>
      <p className="hint">
        {meta.label} · vs <strong>AI · {DIFFICULTY_LABELS[difficulty]}</strong>
      </p>
      <div className="hotseat-setup">
        <label className="hotseat-name">
          <span className="hotseat-name-label">
            <span className="dot-swatch dot-swatch-p1" data-swap="0" aria-hidden="true" />
            Your name — plays first
          </span>
          <input
            type="text"
            className="settings-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={onKey}
            maxLength={20}
            placeholder="Player 1"
            autoFocus
          />
        </label>
        <button className="hotseat-start" onClick={start}>
          Start game
        </button>
      </div>
    </div>
  );
}

interface HotseatSetupProps {
  shape: ShapeId;
  settings: Settings;
  onBack: () => void;
  onStart: (p1Name: string, p2Name: string, colorSwap: boolean) => void;
}

function HotseatSetup({ shape, settings, onBack, onStart }: HotseatSetupProps) {
  const [p1, setP1] = useState(settings.playerName || 'Player 1');
  const [p2, setP2] = useState(settings.opponentName || 'Player 2');
  const [swap, setSwap] = useState(settings.hotseatColorSwap);

  const meta = SHAPE_META.find((s) => s.id === shape)!;

  const start = () => {
    onStart(p1.trim() || 'Player 1', p2.trim() || 'Player 2', swap);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') start();
  };

  return (
    <div className="menu">
      <button className="link-btn back-link" onClick={onBack}>‹ Back</button>
      <h2>Who's playing?</h2>
      <p className="hint">{meta.label} · confirm or change names before starting</p>
      <div className="hotseat-setup">
        <label className="hotseat-name">
          <span className="hotseat-name-label">
            <span className="dot-swatch dot-swatch-p1" data-swap={swap ? '1' : '0'} aria-hidden="true" />
            Player 1 — plays first
          </span>
          <input
            type="text"
            className="settings-input"
            value={p1}
            onChange={(e) => setP1(e.target.value)}
            onKeyDown={onKey}
            maxLength={20}
            placeholder="Player 1"
            autoFocus
          />
        </label>
        <label className="hotseat-name">
          <span className="hotseat-name-label">
            <span className="dot-swatch dot-swatch-p2" data-swap={swap ? '1' : '0'} aria-hidden="true" />
            Player 2
          </span>
          <input
            type="text"
            className="settings-input"
            value={p2}
            onChange={(e) => setP2(e.target.value)}
            onKeyDown={onKey}
            maxLength={20}
            placeholder="Player 2"
          />
        </label>
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={swap}
            onChange={(e) => setSwap(e.target.checked)}
          />
          <span>Swap colours (Player 1 cream · Player 2 green)</span>
        </label>
        <button className="hotseat-start" onClick={start}>
          Start game
        </button>
      </div>
    </div>
  );
}
