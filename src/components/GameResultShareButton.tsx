import { useEffect, useState } from 'react';
import { createShareCardLink, withCardLink } from '../cloud/shareCards';
import { isNativeApp } from '../nativeAds';
import { buildResultShare } from '../share/resultShareText';
import type { ResultShare, ShareResultData } from '../share/resultShareText';
import { renderVictoryCard } from '../share/victoryCard';
import { trackEvent } from '../telemetry';
import type { GameState } from '../types';

const SHARE_TITLE = 'DotDuel — fast 2-player dot strategy';
const FILE_NAME = 'dotduel-result.png';
const SHARE_FILE_NAME = 'dotduel-result.jpg';

// The 2× card PNG is ~6MB (film grain defeats PNG compression). For the OS
// share sheet we send a full-res JPEG q0.9 (~0.5MB) instead — messengers
// transcode to JPEG on send anyway, and the grain dithers away any banding.
// Clipboard (PNG-only API), download, and the dialog preview keep the PNG.
async function toShareJpeg(png: Blob): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(png);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = bmp.width;
      canvas.height = bmp.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return png;
      ctx.drawImage(bmp, 0, 0);
      return await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b ?? png), 'image/jpeg', 0.9);
      });
    } finally {
      bmp.close();
    }
  } catch {
    return png;
  }
}

interface Props {
  data: ShareResultData;
  state: GameState;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve((fr.result as string).split(',')[1] ?? '');
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(blob);
  });
}

function isUserCancel(e: unknown): boolean {
  const err = e as { name?: string; message?: string } | undefined;
  return err?.name === 'AbortError' || /cancel/i.test(err?.message ?? '');
}

/** OS share sheet with the image attached. Native app first, then Web Share
 *  Level 2 (mobile browsers). Returns the method used, null when the user
 *  dismissed the sheet, or 'unsupported' when no sheet exists (desktop). */
async function tryNativeShare(
  blob: Blob,
  shareText: string,
): Promise<string | null> {
  if (isNativeApp()) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([
      import('@capacitor/filesystem'),
      import('@capacitor/share'),
    ]);
    const written = await Filesystem.writeFile({
      path: SHARE_FILE_NAME,
      data: await blobToBase64(await toShareJpeg(blob)),
      directory: Directory.Cache,
    });
    try {
      await Share.share({ title: SHARE_TITLE, text: shareText, files: [written.uri] });
      return 'native-app';
    } catch (e) {
      if (isUserCancel(e)) return null;
      throw e;
    }
  }
  const file = new File([await toShareJpeg(blob)], SHARE_FILE_NAME, {
    type: 'image/jpeg',
  });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ title: SHARE_TITLE, text: shareText, files: [file] });
      return 'native';
    } catch (e) {
      if (isUserCancel(e)) return null;
      // Browser claimed support but failed — fall back to the dialog.
    }
  }
  return 'unsupported';
}

function downloadBlob(blob: Blob): void {
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objUrl;
  a.download = FILE_NAME;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(objUrl), 5000);
}

// Platform web intents carry TEXT + URL only — no web API can pre-attach an
// image (that needs per-platform paid/SDK APIs or server-side OG images, the
// planned v2). "Copy image" covers the image path on desktop: paste straight
// into Discord / WhatsApp Web / an X compose box.
function intentUrl(platform: string, share: ResultShare): string {
  const text = encodeURIComponent(share.shareText);
  const url = encodeURIComponent(share.url);
  switch (platform) {
    case 'x':
      return `https://twitter.com/intent/tweet?text=${text}`;
    case 'whatsapp':
      return `https://wa.me/?text=${text}`;
    case 'telegram':
      return `https://t.me/share/url?url=${url}&text=${text}`;
    default:
      return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  }
}

interface DialogState {
  share: ResultShare;
  blob: Blob;
  previewUrl: string;
  /** True once share.url is the unfurling card link (image travels with it). */
  cardLink: boolean;
}

export function GameResultShareButton({ data, state }: Props) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);

  // Revoke on explicit close, NOT in the effect cleanup — StrictMode's dev
  // double-invoke would revoke the URL the remounted effect still renders.
  const closeDialog = () => {
    setDialog((d) => {
      if (d) URL.revokeObjectURL(d.previewUrl);
      return null;
    });
  };

  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDialog();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog]);

  const flash = (msg: string) => {
    setFeedback(msg);
    window.setTimeout(() => setFeedback(null), 2500);
  };

  const completed = (share: ResultShare, method: string) => {
    trackEvent('result_share_completed', {
      mode: data.mode,
      outcome: share.outcome,
      share_method: method,
    });
  };

  const onShare = async () => {
    if (busy) return;
    const share = buildResultShare(data);
    trackEvent('result_share_clicked', { mode: data.mode, outcome: share.outcome });
    setBusy(true);
    setFeedback(null);
    try {
      const blob = await renderVictoryCard({ share, state, shape: data.shape });
      let outShare = share;
      if (isNativeApp()) {
        // The native plugin has no user-activation deadline — safe to upload
        // first so the shared text carries the unfurling card link.
        const link = await createShareCardLink(share, blob);
        if (link) outShare = withCardLink(share, link);
      }
      const method = await tryNativeShare(blob, outShare.shareText);
      if (method === 'unsupported') {
        setDialog({
          share: outShare,
          blob,
          previewUrl: URL.createObjectURL(blob),
          cardLink: outShare !== share,
        });
        if (outShare === share) {
          // Upgrade the dialog's link in the background; window.open/copy get a
          // fresh activation per click, so the late swap is safe.
          void createShareCardLink(share, blob).then((link) => {
            if (!link) return;
            setDialog((d) =>
              d ? { ...d, share: withCardLink(d.share, link), cardLink: true } : d,
            );
          });
        }
      } else if (method) {
        completed(outShare, method);
      }
    } catch {
      flash('Could not share — try again');
    } finally {
      setBusy(false);
    }
  };

  const onCopyImage = async () => {
    if (!dialog) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': dialog.blob }),
      ]);
      completed(dialog.share, 'copy-image');
      flash('Image copied — paste it anywhere');
    } catch {
      flash('Couldn’t copy the image — try Download');
    }
  };

  const onCopyText = async () => {
    if (!dialog) return;
    try {
      await navigator.clipboard.writeText(dialog.share.shareText);
      completed(dialog.share, 'copy-text');
      flash('Text and link copied');
    } catch {
      flash('Couldn’t copy — try Download');
    }
  };

  const onPlatform = (platform: string) => {
    if (!dialog) return;
    window.open(intentUrl(platform, dialog.share), '_blank', 'noopener,noreferrer');
    completed(dialog.share, platform);
  };

  const onDownload = () => {
    if (!dialog) return;
    downloadBlob(dialog.blob);
    completed(dialog.share, 'download');
    flash('Image saved');
  };

  return (
    <div className="go-share-row">
      <button
        type="button"
        className="go-share-btn"
        onClick={onShare}
        disabled={busy}
      >
        {busy ? 'Preparing…' : '📤 Share result'}
      </button>
      {feedback && <span className="go-share-feedback">{feedback}</span>}
      {dialog && (
        <div
          className="share-dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Share your result"
          onClick={closeDialog}
        >
          <div className="share-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="share-dialog-head">
              <h3>Share your result</h3>
              <button
                type="button"
                className="share-dialog-close"
                aria-label="Close"
                onClick={closeDialog}
              >
                ✕
              </button>
            </div>
            <img
              className="share-dialog-preview"
              src={dialog.previewUrl}
              alt="Your result card"
            />
            <div className="share-dialog-actions">
              <button type="button" className="share-action primary" onClick={onCopyImage}>
                📋 Copy image
              </button>
              <button type="button" className="share-action" onClick={onCopyText}>
                🔗 Copy text + link
              </button>
            </div>
            <div className="share-dialog-platforms">
              <button type="button" className="share-action" onClick={() => onPlatform('x')}>
                X
              </button>
              <button type="button" className="share-action" onClick={() => onPlatform('whatsapp')}>
                WhatsApp
              </button>
              <button type="button" className="share-action" onClick={() => onPlatform('telegram')}>
                Telegram
              </button>
              <button type="button" className="share-action" onClick={() => onPlatform('facebook')}>
                Facebook
              </button>
            </div>
            <p className="share-dialog-hint">
              {dialog.cardLink
                ? 'Your link shows the card picture automatically when pasted. For an inline image, Copy image and paste it into your post.'
                : 'Platform buttons share your text and link. To include the picture, use Copy image and paste it into your post.'}
            </p>
            <button type="button" className="share-action share-dialog-download" onClick={onDownload}>
              ⬇ Download image
            </button>
            {feedback && <span className="go-share-feedback">{feedback}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
