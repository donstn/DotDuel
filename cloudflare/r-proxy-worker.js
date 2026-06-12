// Cloudflare Worker — reverse-proxies dotduel.com/r/<id> to the Supabase `r`
// Edge Function so share links unfurl from the pretty apex domain instead of
// *.supabase.co. Bind to route:  dotduel.com/r/*
//
// Deploy (no wrangler / no build step needed):
//   Cloudflare dashboard → Workers & Pages → Create application → Create Worker
//   → paste this file → Deploy. Then add the route under the worker's Settings →
//   Triggers → Routes:  dotduel.com/r*   (zone: dotduel.com)
//
// Why PROXY and not a 302 redirect: some chat crawlers (WhatsApp, iMessage)
// surface the *final* URL after a redirect, which would leak the supabase.co
// host and defeat the point. Proxying keeps the whole exchange on dotduel.com;
// the OG image inside the HTML can still live on Supabase Storage.

const ORIGIN = 'https://ggyjxayazxbjvjbeecxa.supabase.co/functions/v1/r';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const id = url.pathname.replace(/^\/r\//, '').replace(/\/$/, '');
    if (!id) return Response.redirect('https://www.dotduel.com/', 302);

    // redirect:'manual' so an unknown-id 302 (function → homepage) is passed
    // through verbatim rather than followed here.
    const upstream = await fetch(`${ORIGIN}/${encodeURIComponent(id)}`, {
      headers: { 'user-agent': request.headers.get('user-agent') || '' },
      redirect: 'manual',
    });

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: new Headers(upstream.headers),
    });
  },
};
