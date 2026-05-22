import { useEffect, useState } from 'react';
import { resetStats } from '../storage';
import type { Settings } from '../storage';

interface Props {
  settings: Settings;
  cloudDisplayName: string | null;
  onChange: (next: Settings) => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export function SettingsPopover({
  settings,
  cloudDisplayName,
  onChange,
  onResetProgress,
  onClose,
}: Props) {
  const [local, setLocal] = useState<Settings>(settings);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        commit();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  function commit() {
    onChange(local);
  }

  function done() {
    commit();
    onClose();
  }

  const onBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      commit();
      onClose();
    }
  };

  return (
    <div
      className="rules-overlay"
      onClick={onBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div className="rules-card settings-card">
        <button className="rules-close" onClick={done} aria-label="Close settings">
          ✕
        </button>

        <header className="rules-header">
          <h2>Settings</h2>
          <p className="rules-tagline">Saved locally on this device.</p>
        </header>

        <div className="settings-body">
          <section className="settings-section">
            <label className="settings-label">
              <span>Your name</span>
              <input
                type="text"
                className="settings-input"
                value={cloudDisplayName ?? local.playerName}
                maxLength={20}
                onChange={(e) =>
                  !cloudDisplayName &&
                  setLocal((s) => ({ ...s, playerName: e.target.value }))
                }
                placeholder="Player 1"
                readOnly={!!cloudDisplayName}
                aria-readonly={!!cloudDisplayName}
              />
            </label>
            <p className="settings-hint">
              {cloudDisplayName
                ? `Signed in as ${cloudDisplayName}. Rename in Profile.`
                : 'Used in Vs-AI mode AND as Player 1 in Hot-seat.'}
            </p>
          </section>

          <section className="settings-section">
            <h3>Hot-seat opponent</h3>
            <label className="settings-label">
              <span>Player 2 name</span>
              <input
                type="text"
                className="settings-input"
                value={local.opponentName}
                maxLength={20}
                onChange={(e) =>
                  setLocal((s) => ({ ...s, opponentName: e.target.value }))
                }
                placeholder="Player 2"
              />
            </label>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={local.hotseatColorSwap}
                onChange={(e) =>
                  setLocal((s) => ({ ...s, hotseatColorSwap: e.target.checked }))
                }
              />
              <span>Swap colours (Player 1 cream · Player 2 green)</span>
            </label>
          </section>

          <section className="settings-section settings-danger">
            <button
              className="settings-danger-btn"
              onClick={() => {
                if (confirm('Reset progress? Unlocked shapes and levels will be lost.')) {
                  onResetProgress();
                }
              }}
            >
              Reset progress
            </button>
            <button
              className="settings-danger-btn"
              onClick={() => {
                if (confirm('Reset stats? Every player\'s W/D/L history on this device will be erased.')) {
                  resetStats();
                }
              }}
            >
              Reset stats
            </button>
            <p className="settings-hint">
              Note: renaming yourself starts a fresh stats row. Old name's history is kept under that old name.
            </p>
          </section>
        </div>

        <footer className="rules-footer-bar">
          <button className="rules-got-it" onClick={done}>
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
