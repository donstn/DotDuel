import { useState } from 'react';
import { trackEvent } from '../telemetry';
import { useT } from '../i18n';

const APP_URL = 'https://www.dotduel.com/';

interface Props {
  variant: 'invite' | 'share';
  // Required for variant='invite' so the shared link carries ?ref=<CODE> for
  // the auto-friend-request + referral-attribution flow. A random 6-char code
  // from the sharer's profile — never the account id. Ignored for
  // variant='share' — anonymous shares produce a clean URL.
  refCode?: string | null;
  className?: string;
}

// Shared share-sheet logic (native share → mailto → clipboard) used for two
// distinct user-facing flows:
//   variant='invite' — signed-in user invites someone to TRY the app; URL
//     carries ?ref=<CODE> so the recipient auto-friend-requests on signup.
//   variant='share' — anonymous visitor shares the page. Clean URL, no
//     referral relationship (they have no account to invite into).
// DotDuel never sees the recipient address — privacy-clean and zero cost.
export function TellAFriendButton({ variant, refCode, className }: Props) {
  const t = useT();
  const [feedback, setFeedback] = useState<string | null>(null);

  const url =
    variant === 'invite' && refCode
      ? `${APP_URL}?ref=${encodeURIComponent(refCode)}`
      : APP_URL;
  const text = variant === 'invite' ? t.share.textInvite : t.share.textShare;
  const body = `${text}\n\n${url}`;

  const onShare = async () => {
    setFeedback(null);
    trackEvent('tellafriend_clicked', { variant });

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: t.share.title, text, url });
        trackEvent('tellafriend_share_completed', { variant, share_method: 'native' });
        return;
      } catch (e) {
        const err = e as { name?: string } | undefined;
        if (err?.name === 'AbortError') return;
      }
    }

    const mailto = `mailto:?subject=${encodeURIComponent(t.share.title)}&body=${encodeURIComponent(body)}`;
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
      setFeedback(t.share.linkCopied);
      window.setTimeout(() => setFeedback(null), 2500);
    } catch {
      setFeedback(t.share.couldNotShare);
      window.setTimeout(() => setFeedback(null), 2500);
    }
  };

  return (
    <>
      <button type="button" className={className ?? 'tell-a-friend-btn'} onClick={onShare}>
        {variant === 'invite' ? t.share.labelInvite : t.share.labelShare}
      </button>
      {feedback && <span className="tell-a-friend-feedback">{feedback}</span>}
    </>
  );
}
