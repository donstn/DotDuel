// Share-link unfurl: GET /functions/v1/r/<id>
//
// Serves a tiny HTML page whose OG/Twitter meta tags point at the sharer's
// stored victory-card image, so pasting the link on WhatsApp / X / Telegram /
// Discord / Facebook renders the card inline WITH a clickable link (the thing
// raw web-intent shares can't do for free). Crawlers read the tags; humans are
// redirected instantly (meta refresh + JS) to www.dotduel.com/?ref=<uid>,
// feeding the existing referral/auto-friend flow.
//
// PUBLIC endpoint — deploy with `--no-verify-jwt` (crawlers carry no JWT).
// Unknown/invalid ids redirect to the homepage, no error surface.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const HOME = 'https://www.dotduel.com/';

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}

Deno.serve(async (req) => {
  const id = new URL(req.url).pathname.split('/').filter(Boolean).pop() ?? '';
  if (!/^[A-Za-z0-9_-]{8,32}$/.test(id)) {
    return Response.redirect(HOME, 302);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data } = await admin
    .from('share_cards')
    .select('uid, title, descr')
    .eq('id', id)
    .maybeSingle();
  if (!data) return Response.redirect(HOME, 302);

  const img = `${SUPABASE_URL}/storage/v1/object/public/share-cards/${data.uid}/${id}.jpg`;
  const self = `${SUPABASE_URL}/functions/v1/r/${id}`;
  const target = `${HOME}?ref=${encodeURIComponent(data.uid)}`;
  const title = esc(data.title);
  const descr = esc(data.descr);

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<meta name="description" content="${descr}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="DotDuel">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${descr}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${esc(self)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${descr}">
<meta name="twitter:image" content="${esc(img)}">
<meta http-equiv="refresh" content="0;url=${esc(target)}">
</head>
<body>
<p>Taking you to <a href="${esc(target)}">DotDuel</a>…</p>
<script>location.replace(${JSON.stringify(target)});</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=86400',
    },
  });
});
