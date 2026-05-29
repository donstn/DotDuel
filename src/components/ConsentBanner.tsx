import { ADS_ENABLED } from '../ads';

interface Props {
  onAccept: () => void;
  onDecline: () => void;
  onOpenPrivacy: () => void;
}

export function ConsentBanner({ onAccept, onDecline, onOpenPrivacy }: Props) {
  return (
    <div className="consent-banner" role="region" aria-label="Privacy choice">
      <div className="consent-banner-text">
        <strong>We respect your privacy.</strong>
        <span>
          {ADS_ENABLED ? (
            <>
              DotDuel uses optional Google Analytics to understand how the
              game is played, and Google AdSense to show small ads on menu
              screens that keep the game free to run. You can play with
              full features either way.{' '}
            </>
          ) : (
            <>
              DotDuel uses optional Google Analytics to understand how the
              game is played. You can play with full features either way.{' '}
            </>
          )}
          <button
            type="button"
            className="consent-banner-link"
            onClick={onOpenPrivacy}
          >
            Read our Privacy Policy
          </button>
          .
        </span>
      </div>
      <div className="consent-banner-actions">
        <button type="button" className="consent-decline" onClick={onDecline}>
          Decline
        </button>
        <button type="button" className="consent-accept" onClick={onAccept}>
          {ADS_ENABLED ? 'Accept' : 'Accept analytics'}
        </button>
      </div>
    </div>
  );
}
