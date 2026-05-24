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
          DotDuel uses optional Google Analytics to understand how the game
          is played. You can play with full features either way.{' '}
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
          Accept analytics
        </button>
      </div>
    </div>
  );
}
