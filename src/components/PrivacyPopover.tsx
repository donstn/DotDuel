import { useEffect } from 'react';
import type { Consent } from '../consent';
import { ADS_ENABLED } from '../ads';

interface Props {
  onClose: () => void;
  consent: Consent | null;
  onChangeConsent: (value: Consent) => void;
}

const EFFECTIVE_DATE = '25 May 2026';
const CONTACT_EMAIL = 'donstn@gmail.com';

export function PrivacyPopover({ onClose, consent, onChangeConsent }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="rules-overlay"
      onClick={onBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Privacy Policy"
    >
      <div className="rules-card privacy-card">
        <button className="rules-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <header className="rules-header">
          <h2>Privacy Policy</h2>
          <p className="rules-tagline">
            What we collect, why we collect it, and how to delete it.
          </p>
        </header>

        <div className="rules-body privacy-body">
          <section>
            <h3>Who we are</h3>
            <p>
              DotDuel is an independent two-player dot-coloring game. The
              controller of your personal data under GDPR is the developer.
              Contact: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </section>

          <section>
            <h3>What we collect</h3>
            <p>Only what's needed to make the game work and stay fair.</p>
            <ul className="rules-bullets">
              <li>
                <strong>Account:</strong> email, display name, sign-in
                provider (Google or password), account creation date.
                Source: you, via Supabase Auth at sign-up.
              </li>
              <li>
                <strong>Multiplayer rating:</strong> your current Elo,
                placement-games counter, and last-played timestamp.
                Source: computed server-side at the end of every ranked
                match.
              </li>
              <li>
                <strong>Match history:</strong> each ranked match stores
                both players' UIDs, display names, final scores, rating
                deltas, shape, time control, duration, and how the game
                ended (normal / timeout / resign).
              </li>
              <li>
                <strong>Live game state:</strong> while a multiplayer game
                is in progress we store the board, clock, and your turn
                in our Realtime Database. This is deleted shortly after
                the game ends.
              </li>
              <li>
                <strong>Device-only data:</strong> your single-player
                progress, vs-AI/hot-seat stats, theme preference, and
                tutorial-seen flag. Stored in your browser's localStorage
                and never transmitted to us.
              </li>
              <li>
                <strong>Analytics (only if you accept):</strong> Google
                Analytics auto-collected events — page views, device
                model, locale, screen size, anonymous session ID. Not
                tied to your account in our system.
              </li>
            </ul>
          </section>

          <section>
            <h3>Why we collect it (lawful bases)</h3>
            <ul className="rules-bullets">
              <li>
                <strong>Contract (Art. 6.1.b):</strong> account, rating,
                match history, live game state — all required to operate
                the multiplayer service you signed up for.
              </li>
              <li>
                <strong>Legitimate interest (Art. 6.1.f):</strong>
                leaderboard and ranked play — to provide a fair,
                competitive environment for all players.
              </li>
              <li>
                <strong>Consent (Art. 6.1.a):</strong>{' '}
                {ADS_ENABLED ? (
                  <>
                    Google Analytics AND Google AdSense — both only load
                    after you click Accept on the consent banner. Declined
                    or undecided means neither starts.
                  </>
                ) : (
                  <>
                    Google Analytics — only loaded after you click Accept
                    on the consent banner. Declined or undecided means it
                    never starts.
                  </>
                )}
              </li>
            </ul>
          </section>

          <section>
            <h3>Who it's shared with</h3>
            <p>
              We use Supabase (database, authentication, realtime
              infrastructure and serverless functions, hosted in the EU)
              as our backend provider, plus Google for sign-in and
              consent-gated Analytics
              {ADS_ENABLED ? (
                <>
                  , plus Google AdSense to serve small banner ads on a
                  few menu screens. Both Analytics and AdSense load only
                  after you accept the consent banner
                </>
              ) : (
                <>. Analytics only loads after you accept the consent banner</>
              )}
              . Supabase and Google process data under their standard
              terms / Data Processing Addenda. We do not sell or share
              your data with any other third party.
              {ADS_ENABLED ? null : (
                <> We do not currently use third-party ad networks.</>
              )}
            </p>
          </section>

          <section>
            <h3>How long we keep it</h3>
            <ul className="rules-bullets">
              <li>
                <strong>Account + leaderboard:</strong> until you delete
                your account.
              </li>
              <li>
                <strong>Match history:</strong> up to 24 months after the
                match ended, then permanently deleted.
              </li>
              <li>
                <strong>Live game state:</strong> deleted within ~24 hours
                of game end.
              </li>
              <li>
                <strong>Analytics:</strong> per Google's defaults
                (currently 14 months for event data).
              </li>
              <li>
                <strong>Device-only data:</strong> stays until you clear
                your browser data.
              </li>
            </ul>
          </section>

          <section className="privacy-rights">
            <h3>Your rights</h3>
            <p>Under GDPR you have the right to:</p>
            <ul className="rules-bullets">
              <li>
                <strong>Access</strong> the personal data we hold about
                you — use <em>Download my data</em> in your Profile.
              </li>
              <li>
                <strong>Rectify</strong> inaccurate data — use the
                <em> Rename</em> button in your Profile.
              </li>
              <li>
                <strong>Erase</strong> your account ("right to be
                forgotten") — use <em>Delete my account</em> in your
                Profile. Effect is immediate.
              </li>
              <li>
                <strong>Port</strong> your data — the download above is a
                machine-readable JSON file you can take elsewhere.
              </li>
              <li>
                <strong>Object</strong> to analytics — use the toggle below
                or click Decline on the banner at first launch.
              </li>
              <li>
                <strong>Lodge a complaint</strong> with your national data
                protection authority if you believe we've mishandled your
                data.
              </li>
            </ul>
            <p className="privacy-rankings-note">
              <strong>Important note on rankings.</strong> If you delete
              your account (or are removed for any reason), your display
              name and account identifier are scrubbed from all public
              records. However, the rating changes you caused on other
              players' Elo are NOT reversed — past matches are immutable.
              Opponents you played against keep their rating gains and
              losses; their match history shows "Deleted player" where
              your name used to be.
            </p>
          </section>

          <section>
            <h3>Cookies and analytics</h3>
            <p>
              We do not set tracking cookies. Our sign-in (Supabase Auth)
              uses first-party session storage to keep you signed in.
              Google Analytics uses cookies, but only if you accept below.
            </p>
            <div className="privacy-consent-block">
              <p>
                Current analytics choice:{' '}
                <strong>
                  {consent === 'accepted'
                    ? 'Accepted'
                    : consent === 'declined'
                      ? 'Declined'
                      : 'Not yet decided'}
                </strong>
              </p>
              <div className="privacy-consent-actions">
                <button
                  type="button"
                  className="consent-accept"
                  onClick={() => onChangeConsent('accepted')}
                  disabled={consent === 'accepted'}
                >
                  Accept analytics
                </button>
                <button
                  type="button"
                  className="consent-decline"
                  onClick={() => onChangeConsent('declined')}
                  disabled={consent === 'declined'}
                >
                  Decline analytics
                </button>
              </div>
              <p className="settings-hint">
                Switching from Accepted to Declined will reload the page
                to fully stop the Analytics SDK.
              </p>
            </div>
          </section>

          <section>
            <h3>How to contact us</h3>
            <p>
              For any privacy question, data-access request, or complaint:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </section>

          <section>
            <h3>Effective date</h3>
            <p>
              This policy is effective from {EFFECTIVE_DATE}. We'll update
              it here if anything material changes. The canonical version
              is published at{' '}
              <a
                href="https://www.dotduel.com/privacy.html"
                target="_blank"
                rel="noreferrer"
              >
                dotduel.com/privacy.html
              </a>
              .
            </p>
          </section>
        </div>

        <footer className="rules-footer-bar">
          <button className="rules-got-it" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
