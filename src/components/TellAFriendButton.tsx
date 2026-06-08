import { useState } from 'react';
import { trackEvent } from '../telemetry';

const APP_URL = 'https://www.dotduel.com/';
const SHARE_TITLE = 'DotDuel — fast 2-player dot strategy';
const TEXTS = {
  invite: 'Play me a quick game of dots.',
  share: 'Try DotDuel — a fast 2-player dot strategy game.',
} as const;
const LABELS = {
  invite: '➕ Invite a friend',
  share: 'Share DotDuel',
} as const;

interface Props {
  variant: 'invite' | 'share';
  // Required for variant='invite' so the shared link carries ?ref=<uid> for
  // the auto-friend-request flow. Ignored for variant='share' — anonymous
  // shares produce a clean URL with no referral relationship.
  myUid?: string;
  className?: string;
}

// Shared share-sheet logic (native share → mailto → clipboard) used for two
// distinct user-facing flows:
//   variant='invite' — signed-in user invites someone to TRY the app; URL
//     carries ?ref=<uid> so the recipient auto-friend-requests on signup.
//   variant='share' — anonymous visitor shares the page. Clean URL, no
//     referral relationship (they have no account to invite into).
// DotDuel never sees the recipient address — privacy-clean and zero cost.
export function TellAFriendButton({ variant, myUid, className }: Props) {
  const [feedback, setFeedback] = useState<string | null>(null);

  const url =
    variant === 'invite' && myUid
      ? `${APP_URL}?ref=${encodeURIComponent(myUid)}`
      : APP_URL;
  const text = TEXTS[variant];
  const body = `${text}\n\n${url}`;

  const onShare = async () => {
    setFeedback(null);
    trackEvent('tellafriend_clicked', { variant });

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: SHARE_TITLE, text, url });
        trackEvent('tellafriend_share_completed', { variant, share_method: 'native' });
        return;
      } catch (e) {
        const err = e as { name?: string } | undefined;
        if (err?.name === 'AbortError') return;
      }
    }

    const mailto = `mailto:?subject=${encodeURIComponent(SHARE_TITLE)}&body=${encodeURIComponent(body)}`;
    try {
      const w = window.open(mailto, '_self');
      if (w) {
        trackEvent('tellafriend_share_completed', { variant, share_method: 'mailto' });
        return;
      }
    } catch {
      // ignore — popup blocked etc.
    }

    try {
      await navigator.clipboard.writeText(url);
      trackEvent('tellafriend_share_completed', { variant, share_method: 'clipboard' });
      setFeedback('Link copied — paste it anywhere');
      window.setTimeout(() => setFeedback(null), 2500);
    } catch {
      setFeedback('Could not share — try again');
      window.setTimeout(() => setFeedback(null), 2500);
    }
  };

  return (
    <>
      <button type="button" className={className ?? 'tell-a-friend-btn'} onClick={onShare}>
        {LABELS[variant]}
      </button>
      {feedback && <span className="tell-a-friend-feedback">{feedback}</span>}
    </>
  );
}
