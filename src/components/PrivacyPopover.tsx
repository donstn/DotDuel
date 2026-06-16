import { useEffect } from 'react';
import type { Consent } from '../consent';
import { ADS_ENABLED } from '../ads';
import { useT } from '../i18n';

interface Props {
  onClose: () => void;
  consent: Consent | null;
  onChangeConsent: (value: Consent) => void;
}

const EFFECTIVE_DATE = '25 May 2026';
const CONTACT_EMAIL = 'donstn@gmail.com';

export function PrivacyPopover({ onClose, consent, onChangeConsent }: Props) {
  const t = useT();
  const p = t.privacy;
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
      aria-label={p.aria}
    >
      <div className="rules-card privacy-card">
        <button className="rules-close" onClick={onClose} aria-label={p.close}>
          ✕
        </button>

        <header className="rules-header">
          <h2>{p.title}</h2>
          <p className="rules-tagline">{p.tagline}</p>
        </header>

        <div className="rules-body privacy-body">
          <section>
            <h3>{p.whoH}</h3>
            <p>
              {p.whoP} <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </section>

          <section>
            <h3>{p.collectH}</h3>
            <p>{p.collectP}</p>
            <ul className="rules-bullets">
              <li><strong>{p.collectAccountLead}</strong> {p.collectAccount}</li>
              <li><strong>{p.collectRatingLead}</strong> {p.collectRating}</li>
              <li><strong>{p.collectHistoryLead}</strong> {p.collectHistory}</li>
              <li><strong>{p.collectLiveLead}</strong> {p.collectLive}</li>
              <li><strong>{p.collectFriendsLead}</strong> {p.collectFriends}</li>
              <li><strong>{p.collectDeviceLead}</strong> {p.collectDevice}</li>
              <li><strong>{p.collectAnalyticsLead}</strong> {p.collectAnalytics}</li>
            </ul>
          </section>

          <section>
            <h3>{p.whyH}</h3>
            <ul className="rules-bullets">
              <li><strong>{p.whyContractLead}</strong> {p.whyContract}</li>
              <li><strong>{p.whyLegitLead}</strong> {p.whyLegit}</li>
              <li>
                <strong>{p.whyConsentLead}</strong>{' '}
                {ADS_ENABLED ? p.whyConsentAds : p.whyConsentNoAds}
              </li>
            </ul>
          </section>

          <section>
            <h3>{p.sharedH}</h3>
            <p>{ADS_ENABLED ? p.sharedAds : p.sharedNoAds}</p>
          </section>

          <section>
            <h3>{p.keepH}</h3>
            <ul className="rules-bullets">
              <li><strong>{p.keepAccountLead}</strong> {p.keepAccount}</li>
              <li><strong>{p.keepHistoryLead}</strong> {p.keepHistory}</li>
              <li><strong>{p.keepLiveLead}</strong> {p.keepLive}</li>
              <li><strong>{p.keepAnalyticsLead}</strong> {p.keepAnalytics}</li>
              <li><strong>{p.keepDeviceLead}</strong> {p.keepDevice}</li>
            </ul>
          </section>

          <section className="privacy-rights">
            <h3>{p.rightsH}</h3>
            <p>{p.rightsP}</p>
            <ul className="rules-bullets">
              <li><strong>{p.rightAccessLead}</strong> {p.rightAccess}</li>
              <li><strong>{p.rightRectifyLead}</strong> {p.rightRectify}</li>
              <li><strong>{p.rightEraseLead}</strong> {p.rightErase}</li>
              <li><strong>{p.rightPortLead}</strong> {p.rightPort}</li>
              <li><strong>{p.rightObjectLead}</strong> {p.rightObject}</li>
              <li><strong>{p.rightComplainLead}</strong> {p.rightComplain}</li>
            </ul>
            <p className="privacy-rankings-note">
              <strong>{p.rankingsNoteLead}</strong> {p.rankingsNote}
            </p>
          </section>

          <section>
            <h3>{p.cookiesH}</h3>
            <p>{p.cookiesP}</p>
            <div className="privacy-consent-block">
              <p>
                {p.currentChoice}{' '}
                <strong>
                  {consent === 'accepted'
                    ? p.choiceAccepted
                    : consent === 'declined'
                      ? p.choiceDeclined
                      : p.choiceUndecided}
                </strong>
              </p>
              <div className="privacy-consent-actions">
                <button
                  type="button"
                  className="consent-accept"
                  onClick={() => onChangeConsent('accepted')}
                  disabled={consent === 'accepted'}
                >
                  {p.acceptAnalytics}
                </button>
                <button
                  type="button"
                  className="consent-decline"
                  onClick={() => onChangeConsent('declined')}
                  disabled={consent === 'declined'}
                >
                  {p.declineAnalytics}
                </button>
              </div>
              <p className="settings-hint">{p.consentReloadHint}</p>
            </div>
          </section>

          <section>
            <h3>{p.contactH}</h3>
            <p>
              {p.contactP} <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </section>

          <section>
            <h3>{p.effectiveH}</h3>
            <p>
              {p.effectiveLead(EFFECTIVE_DATE)}{' '}
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
            {p.done}
          </button>
        </footer>
      </div>
    </div>
  );
}
