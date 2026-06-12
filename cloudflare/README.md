# Pretty share links via Cloudflare (`dotduel.com/r/<id>`)

Goal: share links render as `https://dotduel.com/r/<id>` instead of
`https://ggyjxayazxbjvjbeecxa.supabase.co/functions/v1/r/<id>`, at **$0/mo**,
without changing how the game itself is served.

## Architecture (minimal blast radius)

- **`www.dotduel.com` stays exactly as today** — DNS-only (grey cloud) → GitHub
  Pages. The game's serving path does not change, so the live site can't break
  from this migration.
- **Apex `dotduel.com` goes through Cloudflare** (orange cloud):
  - `dotduel.com/r/*` → **Worker** (`r-proxy-worker.js`) → reverse-proxies the
    Supabase `r` Edge Function. Crawlers see OG tags served from `dotduel.com`.
  - everything else on the apex → **Single Redirect** → `www.dotduel.com` (same
    apex→www behavior GitHub already does today, just at Cloudflare's edge).

The Supabase `r` function is unchanged — the Worker just fronts it.

## One-time migration (manual, ~30 min + propagation)

DNS currently lives at **Namecheap** (`dns1/dns2.registrar-servers.com`).
Moving to Cloudflare means changing nameservers, which moves **all** records —
so the email-forwarding records below MUST be recreated or `@dotduel.com` email
silently dies.

### 0. Record everything currently at Namecheap first

Confirmed live records to recreate in Cloudflare:

| Type  | Name          | Value / target                          | Notes |
|-------|---------------|------------------------------------------|-------|
| A     | `dotduel.com` | `185.199.108.153`                        | GitHub Pages |
| A     | `dotduel.com` | `185.199.109.153`                        | GitHub Pages |
| A     | `dotduel.com` | `185.199.110.153`                        | GitHub Pages |
| A     | `dotduel.com` | `185.199.111.153`                        | GitHub Pages |
| CNAME | `www`         | `donstn.github.io`                       | GitHub Pages |
| MX    | `dotduel.com` | `eforward1.registrar-servers.com` (10)   | **Namecheap email fwd** |
| MX    | `dotduel.com` | `eforward2.registrar-servers.com` (10)   | **email fwd** |
| MX    | `dotduel.com` | `eforward3.registrar-servers.com` (10)   | **email fwd** |
| MX    | `dotduel.com` | `eforward4.registrar-servers.com` (15)   | **email fwd** |
| MX    | `dotduel.com` | `eforward5.registrar-servers.com` (20)   | **email fwd** |
| TXT   | `dotduel.com` | `v=spf1 include:spf.efwd.registrar-servers.com ~all` | **SPF — copy the exact string from Namecheap Advanced DNS** |

> ⚠️ Copy the **exact** TXT/SPF value(s) from Namecheap → Domain → Advanced DNS
> before switching. There may also be a domain-verification TXT — copy any you
> find. Getting MX/SPF wrong breaks email but not the website.

### 1. Add the site to Cloudflare

1. Cloudflare → Add a site → `dotduel.com` → **Free** plan.
2. Cloudflare auto-imports detected records. **Verify** every row from the table
   above exists; add any it missed (especially all 5 MX + the SPF TXT).
3. Cloud (proxy) status:
   - `A dotduel.com` (all four) → **Proxied** (orange).
   - `CNAME www` → **DNS only** (grey).
   - MX + TXT → DNS only (grey, automatic).

### 2. Repoint nameservers at Namecheap

Namecheap → Domain List → `dotduel.com` → Nameservers → **Custom DNS** → enter
the two Cloudflare nameservers Cloudflare gave you (e.g. `xxx.ns.cloudflare.com`).
Propagation: usually minutes, up to 24h. Cloudflare emails you when active.

### 3. SSL mode

Cloudflare → SSL/TLS → Overview → set to **Full** (GitHub Pages serves a valid
cert on the apex origin, so Full works; "Flexible" would loop).

### 4. Deploy the Worker

1. Workers & Pages → Create → Create Worker → name it `dotduel-r` → paste
   `r-proxy-worker.js` → Deploy.
2. Worker → Settings → Triggers → Routes → Add route: `dotduel.com/r*`,
   zone `dotduel.com`.

### 5. Apex-redirect rule (everything except /r)

Rules → Redirect Rules → Create → Single Redirect:
- When incoming requests match: `Hostname equals dotduel.com` AND
  `URI Path does not start with /r`
- Then: Static redirect → `https://www.dotduel.com` + path + query, 301.

(Without this, bare `dotduel.com/` still works — it falls through to the GitHub
origin which redirects to www — but the rule makes it a clean single hop.)

### 6. Flip the client link host

In `src/cloud/shareCards.ts`, swap the two `SHARE_LINK_BASE` lines:

```ts
// const SHARE_LINK_BASE = `${SUPABASE_URL}/functions/v1/r`;
const SHARE_LINK_BASE = 'https://dotduel.com/r';
```

## Verify

```
curl -sI https://dotduel.com/r/<some-real-id>      # 200, content-type text/html
curl -s  https://dotduel.com/r/<some-real-id> | grep og:image   # points at supabase storage
curl -sI https://dotduel.com/r/does-not-exist      # 302 → www.dotduel.com
curl -sI https://dotduel.com/anything              # 301 → www.dotduel.com  (after step 5)
curl -sI https://www.dotduel.com/                  # unchanged, still GitHub Pages
```

Then paste a real `/r/` link into WhatsApp/Telegram — the card preview appears.

## Rollback

Set Namecheap nameservers back to `dns1/dns2.registrar-servers.com`. Everything
reverts to the pre-migration state. (Keep the `SHARE_LINK_BASE` Supabase line
until the migration is verified, so links work in either state.)
