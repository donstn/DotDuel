# Pretty share links — plain-English setup (for Donatas)

Goal: make share links look like `dotduel.com/r/abc123` instead of the long
`ggyjxayazxbjvjbeecxa.supabase.co/...`. Cost: **free**. Time: ~30 min of
clicking, then up to a day of waiting for the internet to catch up.

You do the clicking in two websites: **Cloudflare** (free account you'll make)
and **Namecheap** (where you bought the domain). Claude does the code part at
the end. **You can stop at any step and ask Claude — nothing breaks until step 5.**

The website (the game) keeps working the whole time. The only thing that could
go wrong is `@dotduel.com` email forwarding — that's why step 3 exists. Take it
slow there.

---

## Step 1 — Make a free Cloudflare account
1. Go to **https://dash.cloudflare.com/sign-up**
2. Enter your email + a password. Verify the email they send you.
3. That's it. Don't add any paid plan.

## Step 2 — Add your domain to Cloudflare
1. In Cloudflare, click **Add a site** (or "Add a domain").
2. Type **`dotduel.com`** and continue.
3. When it asks for a plan, choose **Free** (€0). Continue.
4. Cloudflare scans your current settings. Wait for it to finish.

## Step 3 — ⚠️ Check your settings copied over (the important one)
Cloudflare shows a list of "DNS records" it found. You're checking that two
groups are present. **Don't delete anything.**

**Email (so @dotduel.com mail keeps working) — there should be 5 "MX" rows:**
- `eforward1.registrar-servers.com`
- `eforward2.registrar-servers.com`
- `eforward3.registrar-servers.com`
- `eforward4.registrar-servers.com`
- `eforward5.registrar-servers.com`
- and at least one "TXT" row that starts with `v=spf1 ...`

If any MX row or the TXT row is missing, open Namecheap in another tab
(**Domain List → dotduel.com → Manage → Advanced DNS**) and copy the missing
ones into Cloudflare with **Add record**. If you're unsure, screenshot both
screens and ask Claude before continuing.

**Website — there should be:**
- four "A" rows for `dotduel.com` pointing at `185.199.108.153`, `.109.153`,
  `.110.153`, `.111.153`
- one "CNAME" row for `www` pointing at `donstn.github.io`

## Step 4 — Set the cloud icons (orange vs grey)
Each website row has a cloud icon. Click it to toggle orange/grey.
- The four **`dotduel.com` A rows** → **orange** (Proxied).
- The **`www` CNAME row** → **grey** (DNS only).
- Leave the email MX/TXT rows as they are (grey).

Then click **Continue**.

## Step 5 — Switch your domain to Cloudflare (at Namecheap)
Cloudflare now shows you **two nameservers**, like
`alice.ns.cloudflare.com` and `bob.ns.cloudflare.com`. Keep that tab open.
1. Go to **Namecheap → Domain List → dotduel.com → Manage**.
2. Find **Nameservers**, change the dropdown to **Custom DNS**.
3. Delete what's there and paste Cloudflare's two nameservers (one per line).
4. Save (the green checkmark).
5. Back in Cloudflare, click **Done, check nameservers**.

Now you wait. Cloudflare emails you (usually within an hour, sometimes a day)
saying the site is **Active**. The game keeps working the whole time.

## Step 6 — After the "Active" email: turn on SSL
1. Cloudflare → **SSL/TLS** (left menu) → **Overview**.
2. Set the mode to **Full**. (Not "Flexible" — that one breaks the page.)

## Step 7 — Create the Worker (the bit that makes /r/ links work)
1. Cloudflare → **Workers & Pages** (left menu) → **Create** → **Create Worker**.
2. Name it `dotduel-r`. Click **Deploy** (ignore the sample code for now).
3. Click **Edit code**. Delete everything in the editor.
4. Open the file `cloudflare/r-proxy-worker.js` in this project, copy **all** of
   it, paste it into the editor, click **Deploy** (top right).

## Step 8 — Point /r/ traffic at the Worker
1. Still on the Worker page → **Settings** → **Domains & Routes** (or
   "Triggers") → **Add** → **Route**.
2. Route: **`dotduel.com/r*`**  · Zone: **`dotduel.com`** · Save.

## Step 9 — Send the rest of the apex to www (one redirect rule)
1. Cloudflare → **Rules** → **Redirect Rules** → **Create rule**.
2. Name: `apex to www`.
3. When incoming requests match: field **Hostname** · operator **equals** ·
   value **`dotduel.com`**. Add a second condition (AND): field **URI Path** ·
   operator **does not start with** · value **`/r`**.
4. Then: **Static** → URL `https://www.dotduel.com` → Preserve path & query → 301.
5. Deploy.

## Step 10 — Tell Claude, then test
1. Message Claude: **"Cloudflare is live."** Claude flips one setting in the code
   so links use `dotduel.com/r/...`, and rebuilds.
2. Sign in to the game, finish a match, tap **Share**, choose **Copy text +
   link**, and paste it into a WhatsApp message to yourself. The card picture
   should appear. 🎉

---

### If something looks wrong
- **Website down?** Set Namecheap nameservers back to `dns1.registrar-servers.com`
  and `dns2.registrar-servers.com` — that undoes everything. Then tell Claude.
- **Email stopped?** It's the MX/TXT rows from step 3 — recheck them, or ask Claude.
- **Stuck on any screen?** Screenshot it and ask Claude.
