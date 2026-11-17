import { useEffect, useRef, useState } from 'react';
import { createShareCardLink, withCardLink } from '../cloud/shareCards';
import { isNativeApp } from '../nativeAds';
import { buildResultShare } from '../share/resultShareText';
import type { ResultShare, ShareResultData } from '../share/resultShareText';
import { canvasToBlob } from '../share/cardKit';
import { renderVictoryCard } from '../share/victoryCard';
import { trackEvent } from '../telemetry';
import type { GameState } from '../types';
import { useT } from '../i18n';

const SHARE_FILE_NAME = 'dotduel-result.jpg';

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
  jpeg: Blob,
  shareText: string,
  shareTitle: string,
): Promise<string | null> {
  if (isNativeApp()) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([
      import('@capacitor/filesystem'),
      import('@capacitor/share'),
    ]);
    const written = await Filesystem.writeFile({
      path: SHARE_FILE_NAME,
      data: await blobToBase64(jpeg),
      directory: Directory.Cache,
    });
    try {
      await Share.share({ title: shareTitle, text: shareText, files: [written.uri] });
      return 'native-app';
    } catch (e) {
      if (isUserCancel(e)) return null;
      throw e;
    }
  }
  const file = new File([jpeg], SHARE_FILE_NAME, {
    type: 'image/jpeg',
  });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ title: shareTitle, text: shareText, files: [file] });
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
  a.download = SHARE_FILE_NAME;
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

/** The drawn card, ready to share: the canvas (for a PNG on demand) and the
 *  JPEG that goes to the share sheet, download and preview. */
interface Rendered {
  share: ResultShare;
  canvas: HTMLCanvasElement;
  jpeg: Blob;
}

interface DialogState {
  share: ResultShare;
  canvas: HTMLCanvasElement;
  jpeg: Blob;
  previewUrl: string;
  /** True once share.url is the unfurling card link (image travels with it). */
  cardLink: boolean;
}

export function GameResultShareButton({ data, state }: Props) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const rendered = useRef<Promise<Rendered> | null>(null);

  const prepare = (): Promise<Rendered> => {
    if (!rendered.current) {
      const share = buildResultShare(data, t);
      const job = renderVictoryCard({
        share,
        state,
        shape: data.shape,
        ptsLabel: t.share.result.ptsLabel,
        scanCaption: t.share.result.scanCaption,
      }).then(async (canvas) => ({
        share,
        canvas,
        jpeg: await canvasToBlob(canvas, 'image/jpeg', 0.9),
      }));
      job.catch(() => {
        if (rendered.current === job) rendered.current = null;
      });
      rendered.current = job;
    }
    return rendered.current;
  };

  // Draw the card while the player reads the result (after the win
  // celebration has started, when the browser is idle), so a tap on Share
  // opens the share sheet at once instead of waiting for the render.
  useEffect(() => {
    const warm = () => void prepare().catch(() => {});
    const timer = window.setTimeout(() => {
      if ('requestIdleCallback' in window) window.requestIdleCallback(warm, { timeout: 3000 });
      else warm();
    }, 2500);
    return () => window.clearTimeout(timer);
    // Once per Game Over card; the result doesn't change while it is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setBusy(true);
    setFeedback(null);
    try {
      const { share, canvas, jpeg } = await prepare();
      trackEvent('result_share_clicked', { mode: data.mode, outcome: share.outcome });
      let outShare = share;
      if (isNativeApp()) {
        // The native plugin has no user-activation deadline — safe to upload
        // first so the shared text carries the unfurling card link.
        const link = await createShareCardLink(share, jpeg);
        if (link) outShare = withCardLink(share, link);
      }
      const method = await tryNativeShare(jpeg, outShare.shareText, t.share.title);
      if (method === 'unsupported') {
        setDialog({
          share: outShare,
          canvas,
          jpeg,
          previewUrl: URL.createObjectURL(jpeg),
          cardLink: outShare !== share,
        });
        if (outShare === share) {
          // Upgrade the dialog's link in the background; window.open/copy get a
          // fresh activation per click, so the late swap is safe.
          void createShareCardLink(share, jpeg).then((link) => {
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
      flash(t.share.couldNotShare);
    } finally {
      setBusy(false);
    }
  };

  const onCopyImage = async () => {
    if (!dialog) return;
    try {
      // The clipboard takes PNG only; encoded on demand (a promise keeps the
      // click's user activation while it encodes).
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': canvasToBlob(dialog.canvas, 'image/png') }),
      ]);
      completed(dialog.share, 'copy-image');
      flash(t.share.imageCopied);
    } catch {
      flash(t.share.imageCopyFailed);
    }
  };

  const onCopyText = async () => {
    if (!dialog) return;
    try {
      await navigator.clipboard.writeText(dialog.share.shareText);
      completed(dialog.share, 'copy-text');
      flash(t.share.textCopied);
    } catch {
      flash(t.share.textCopyFailed);
    }
  };

  const onPlatform = (platform: string) => {
    if (!dialog) return;
    window.open(intentUrl(platform, dialog.share), '_blank', 'noopener,noreferrer');
    completed(dialog.share, platform);
  };

  const onDownload = () => {
    if (!dialog) return;
    downloadBlob(dialog.jpeg);
    completed(dialog.share, 'download');
    flash(t.share.imageSaved);
  };

  return (
    <div className="go-share-row">
      <button
        type="button"
        className="go-share-btn"
        onClick={onShare}
        disabled={busy}
      >
        {busy ? t.share.preparing : t.share.shareResult}
      </button>
      {feedback && <span className="go-share-feedback">{feedback}</span>}
      {dialog && (
        <div
          className="share-dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={t.share.dialogAria}
          onClick={closeDialog}
        >
          <div className="share-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="share-dialog-head">
              <h3>{t.share.dialogTitle}</h3>
              <button
                type="button"
                className="share-dialog-close"
                aria-label={t.share.close}
                onClick={closeDialog}
              >
                ✕
              </button>
            </div>
            <img
              className="share-dialog-preview"
              src={dialog.previewUrl}
              alt={t.share.resultCardAlt}
            />
            <div className="share-dialog-actions">
              <button type="button" className="share-action primary" onClick={onCopyImage}>
                {t.share.copyImage}
              </button>
              <button type="button" className="share-action" onClick={onCopyText}>
                {t.share.copyTextLink}
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
              {dialog.cardLink ? t.share.hintCardLink : t.share.hintNoCardLink}
            </p>
            <button type="button" className="share-action share-dialog-download" onClick={onDownload}>
              {t.share.downloadImage}
            </button>
            {feedback && <span className="go-share-feedback">{feedback}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
