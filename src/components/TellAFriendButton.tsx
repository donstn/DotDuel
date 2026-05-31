import { useState } from 'react';
import { trackEvent } from '../firebase';

const APP_URL = 'https://www.dotduel.com/';
const SHARE_TITLE = 'DotDuel — fast 2-player dot strategy';
const SHARE_TEXT = "Play me a quick game of dots.";

interface Props {
  myUid: string;
}

// Tell-a-friend: invite a non-DotDuel user to TRY the app. NOT the friend
// system flow — this is the viral-growth pattern.
//   - Mobile (navigator.share supported): open the OS share sheet
//   - Desktop / fallback: open a mailto: with prefilled body
//   - Final fallback: copy the referral URL to clipboard
// DotDuel never sees the recipient address — privacy-clean and zero cost.
//
// The ?ref=<inviterUid> query param is picked up on landing (App.tsx) and
// triggers an automatic friend request when the recipient signs up.
export function TellAFriendButton({ myUid }: Props) {
  const [feedback, setFeedback] = useState<string | null>(null);

  const url = `${APP_URL}?ref=${encodeURIComponent(myUid)}`;
  const body = `${SHARE_TEXT}\n\n${url}`;

  const onShare = async () => {
    setFeedback(null);
    trackEvent('tellafriend_clicked', { has_ref: myUid ? 'true' : 'false' });

    // 1. Native share sheet (mobile + some desktop browsers)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url });
        trackEvent('tellafriend_share_completed', { share_method: 'native' });
        return;
      } catch (e) {
        // AbortError on user cancel is expected; anything else falls through
        const err = e as { name?: string } | undefined;
        if (err?.name === 'AbortError') return;
      }
    }

    // 2. mailto: fallback — opens the user's default email client
    const mailto = `mailto:?subject=${encodeURIComponent(SHARE_TITLE)}&body=${encodeURIComponent(body)}`;
    try {
      const w = window.open(mailto, '_self');
      if (w) {
        trackEvent('tellafriend_share_completed', { share_method: 'mailto' });
        return;
      }
    } catch {
      // ignore — popup blocked etc.
    }

    // 3. Copy-to-clipboard final fallback
    try {
      await navigator.clipboard.writeText(url);
      trackEvent('tellafriend_share_completed', { share_method: 'clipboard' });
      setFeedback('Link copied — paste it anywhere');
      window.setTimeout(() => setFeedback(null), 2500);
    } catch {
      setFeedback('Could not share — try again');
      window.setTimeout(() => setFeedback(null), 2500);
    }
  };

  return (
    <>
      <button
        type="button"
        className="tell-a-friend-btn"
        onClick={onShare}
      >
        ➕ Invite a friend to the app
      </button>
      {feedback && <span className="tell-a-friend-feedback">{feedback}</span>}
    </>
  );
}
