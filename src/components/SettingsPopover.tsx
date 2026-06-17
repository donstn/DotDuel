import { useEffect, useState } from 'react';
import { resetStats } from '../storage';
import type { Settings } from '../storage';
import { useT } from '../i18n';

type ChallengePolicy = 'everyone' | 'friends-only' | 'nobody';

interface Props {
  settings: Settings;
  cloudDisplayName: string | null;
  onChange: (next: Settings) => void;
  onResetProgress: () => void;
  onClose: () => void;
  // Privacy fields (Alpha 0.2.0.0). Undefined when the user isn't signed in;
  // in that case the Privacy section is hidden — these settings are
  // server-side and need a cloud profile.
  challengePolicy?: ChallengePolicy;
  showPresence?: boolean;
  onChangePrivacy?: (next: {
    challengePolicy?: ChallengePolicy;
    showPresence?: boolean;
  }) => void;
  /** Opens the colour-theme picker (relocated here from the footer). */
  onOpenThemes: () => void;
}

export function SettingsPopover({
  settings,
  cloudDisplayName,
  onChange,
  onResetProgress,
  onClose,
  challengePolicy,
  showPresence,
  onChangePrivacy,
  onOpenThemes,
}: Props) {
  const t = useT();
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
      aria-label={t.settings.aria}
    >
      <div className="rules-card settings-card">
        <button className="rules-close" onClick={done} aria-label={t.settings.close}>
          ✕
        </button>

        <header className="rules-header">
          <h2>{t.settings.title}</h2>
          <p className="rules-tagline">{t.settings.tagline}</p>
        </header>

        <div className="settings-body">
          <section className="settings-section">
            <label className="settings-label">
              <span>{t.settings.yourName}</span>
              <input
                type="text"
                className="settings-input"
                value={cloudDisplayName ?? local.playerName}
                maxLength={20}
                onChange={(e) =>
                  !cloudDisplayName &&
                  setLocal((s) => ({ ...s, playerName: e.target.value }))
                }
                placeholder={t.menu.player1Placeholder}
                readOnly={!!cloudDisplayName}
                aria-readonly={!!cloudDisplayName}
              />
            </label>
            <p className="settings-hint">
              {cloudDisplayName
                ? t.settings.yourNameHintSignedIn(cloudDisplayName)
                : t.settings.yourNameHint}
            </p>
          </section>

          <section className="settings-section">
            <h3>{t.settings.hotseatOpponent}</h3>
            <label className="settings-label">
              <span>{t.settings.player2Name}</span>
              <input
                type="text"
                className="settings-input"
                value={local.opponentName}
                maxLength={20}
                onChange={(e) =>
                  setLocal((s) => ({ ...s, opponentName: e.target.value }))
                }
                placeholder={t.menu.player2Placeholder}
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
              <span>{t.settings.swapColours}</span>
            </label>
          </section>

          <section className="settings-section">
            <h3>{t.settings.appearanceH}</h3>
            <div className="settings-theme-row">
              <span>{t.settings.colourTheme}</span>
              <button
                type="button"
                className="settings-theme-btn"
                onClick={() => {
                  done();
                  onOpenThemes();
                }}
              >
                {t.settings.changeTheme}
              </button>
            </div>
          </section>

          {onChangePrivacy && (
            <section className="settings-section">
              <h3>{t.settings.privacyH}</h3>
              <label className="settings-label">
                <span>{t.settings.whoCanChallenge}</span>
                <select
                  className="settings-input"
                  value={challengePolicy ?? 'everyone'}
                  onChange={(e) =>
                    onChangePrivacy({
                      challengePolicy: e.target.value as ChallengePolicy,
                    })
                  }
                >
                  <option value="everyone">{t.settings.everyone}</option>
                  <option value="friends-only">{t.settings.friendsOnly}</option>
                  <option value="nobody">{t.settings.nobody}</option>
                </select>
              </label>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={showPresence ?? true}
                  onChange={(e) =>
                    onChangePrivacy({ showPresence: e.target.checked })
                  }
                />
                <span>{t.settings.showStatus}</span>
              </label>
              <p className="settings-hint">{t.settings.showStatusHint}</p>
            </section>
          )}

          <section className="settings-section settings-danger">
            <div className="settings-danger-row">
              <button
                className="settings-danger-btn"
                onClick={() => {
                  if (confirm(t.settings.resetProgressConfirm)) {
                    onResetProgress();
                  }
                }}
              >
                {t.settings.resetProgress}
              </button>
              <button
                className="settings-danger-btn"
                onClick={() => {
                  if (confirm(t.settings.resetStatsConfirm)) {
                    resetStats();
                  }
                }}
              >
                {t.settings.resetStats}
              </button>
            </div>
            <p className="settings-hint">{t.settings.renameNote}</p>
          </section>
        </div>

        <footer className="rules-footer-bar">
          <button className="rules-got-it" onClick={done}>
            {t.settings.done}
          </button>
        </footer>
      </div>
    </div>
  );
}
