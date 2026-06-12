import { SUPABASE_URL, currentSupabaseUid, supabase } from '../supabase';
import type { ResultShare } from '../share/resultShareText';

/**
 * Personalized share-link unfurl: uploads the rendered victory card (as JPEG —
 * ~5× smaller than the PNG the share sheet uses) to the public `share-cards`
 * bucket and registers it in `share_cards`, returning a
 * `/functions/v1/r/<id>` link whose OG tags unfurl into the card on social
 * platforms. Signed-in only; any failure returns null and the caller keeps the
 * plain ?ref= URL — sharing must never break because the upload did.
 */

// Public base for share links. The Cloudflare Worker at dotduel.com/r/*
// reverse-proxies to this same Supabase function, so links unfurl from the
// pretty apex once that route is live. To switch hosts, flip these two lines —
// nothing else changes. See cloudflare/README.md.
const SHARE_LINK_BASE = `${SUPABASE_URL}/functions/v1/r`;
// const SHARE_LINK_BASE = 'https://dotduel.com/r';

function randomId(): string {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function pngToJpeg(png: Blob): Promise<Blob> {
  const bmp = await createImageBitmap(png);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas 2d unavailable');
    ctx.drawImage(bmp, 0, 0);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
        'image/jpeg',
        0.85,
      );
    });
  } finally {
    bmp.close();
  }
}

function ogTitle(share: ResultShare): string {
  const result = share.b
    ? `${share.a.score}–${share.b.score}`
    : `${share.a.score} pts`;
  return `DotDuel · ${share.headline} · ${result}`.slice(0, 120);
}

// BACKLOGGED 2026-06-12 — "to be decided if we ship it." The unfurling share
// link (upload card to Supabase Storage + pretty dotduel.com/r/<id> URL) is
// fully built and the backend is live, but parked pending a decision on whether
// it's worth the Cloudflare domain work. While false, sharing falls back to the
// plain image + ?ref= link (unchanged, always worked). Flip to true to revive,
// then do cloudflare/SETUP-STEPS.md. See cloudflare/README.md.
const ENABLE_SHARE_CARD_LINKS: boolean = false;

export async function createShareCardLink(
  share: ResultShare,
  cardPng: Blob,
): Promise<string | null> {
  if (!ENABLE_SHARE_CARD_LINKS) return null;
  const uid = currentSupabaseUid();
  if (!uid) return null;
  try {
    const jpeg = await pngToJpeg(cardPng);
    const id = randomId();
    const { error: upErr } = await supabase.storage
      .from('share-cards')
      .upload(`${uid}/${id}.jpg`, jpeg, { contentType: 'image/jpeg' });
    if (upErr) return null;
    const descr = share.shareText.replace(share.url, '').trim().slice(0, 400);
    const { error: insErr } = await supabase
      .from('share_cards')
      .insert({ id, uid, title: ogTitle(share), descr });
    if (insErr) return null;
    return `${SHARE_LINK_BASE}/${id}`;
  } catch {
    return null;
  }
}

/** Swap the share's plain URL for the unfurling card link (text included). */
export function withCardLink(share: ResultShare, link: string): ResultShare {
  return {
    ...share,
    url: link,
    shareText: share.shareText.replace(share.url, link),
  };
}
