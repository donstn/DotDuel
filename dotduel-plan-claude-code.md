# DotDuel — augimo, SEO ir pasiekimų perdarymo planas (užduotis Claude Code)

> Įklijuok visą šį failą į Claude Code repozitorijos šaknyje. Dirbk fazėmis, po kiekvienos fazės sustok, parodyk diff santrauką ir laukik patvirtinimo.
>
> **Peržiūrėta 2026-10-10 (Claude Code, prieš realų kodą, `main` @ Alpha 0.4.12.4).** Pataisymai pažymėti **⚠** (faktas neatitiko kodo) arba **✎** (keičiu rekomendaciją). Pilna peržiūros santrauka — skyriuje „Peržiūros išvados“ iškart po auditu.

## 0. Kontekstas

- Produktas: DotDuel (www.dotduel.com) — 2 žaidėjų taškų strategijos žaidimas, kilęs iš lietuviško popierinio žaidimo **„skarelė"**.
- Stack: **React 18 + Vite 5 + TypeScript (strict), be routerio** (ekranų būsenų mašina `App.tsx`). Supabase (Postgres+RLS, auth, realtime, Edge Functions, pg_cron), Capacitor 8 (Android). **Hostingas: GitHub Pages** (statinis, `main` → `.github/workflows/deploy.yml`) — nėra serverio, ISR, edge middleware ar response header'ių. AdSense web'e, AdMob Android'e.
- Režimai: vs AI (5 lygiai: Beginner, Easy, Medium, Hard, Impossible), hot-seat, ranked online (Elo, laiko kontrolės 1/3/5 min = Bullet/Blitz/Rapid, bot'ų fallback'as), 3 žaidžiamos lentos (Triangle 36, Square 49, Rectangle 63; Rhombus yra geometrijoje, bet daily/ranked/pasiekimuose neįtraukta), daily puzzle su leaderboard'u, draugai/kvietimai/referral'ai.
- **⚠ i18n jau yra:** 6 kalbos (en, lt, es, pt, pl, cs), savas zero-dep `src/i18n`. Pasiekimai jau yra (97 vnt., žr. Fazę 6).
- Android: Play Console **internal testing**; kitas žingsnis — closed testing (≥12 testuotojų / 14 d.). Viešo Play Store URL dar nėra.
- Monetizacija: tik reklamos. **⚠ $0.99 prenumeratos kode nėra** — tai tik planas (`monetization_plan.md`).
- Privalomas apribojimas: **zero-cost / be licencinių mokesčių** stack'as (MIT/Apache/BSD/ISC; jokių mokamų SaaS runtime kelyje). Kiekvienai naujai priklausomybei nurodyti licenciją ir kainą.

### Dabartinės būklės auditas (atliktas 2026-10-10, patikrintas prieš kodą)

1. ✅ **Visa svetainė indeksuojama kaip vienas URL.** `public/sitemap.xml` turi tik `/` (lastmod 2026-06-01). `/rules` grąžina 404 (GH Pages, nėra `404.html`). Long-tail puslapių nėra.
2. ❔ **Brand paieška silpna** — kodu nepatikrinama. Pirmiausia pažiūrėti Search Console (ar `/` išvis indeksuotas, kokios užklausos). Vienas URL + SPA be turinio HTML'e tai paaiškintų.
3. ✅ **Raktažodžiai nukreipti į nelaimimas užklausas** — `<title>`, description, `og:*`, JSON-LD `keywords` ir `<noscript>` tekstas remiasi „tic-tac-toe / Dots and Boxes / chess / Connect Four / Gomoku / Othello“.
4. ✅ **„Skarelė“, Lietuva, kilmė nepaminėti** niekur (nei `index.html`, nei i18n, nei Play listing'e).
5. ⚠ **Prieštaringi teiginiai — patvirtinta, bet kita forma:**
   - FAQ (JSON-LD + `<noscript>`): „No ads on the gameplay screen“ — **netiesa**: `App.tsx` žaidimo ekrane renderina `<AdBanner placement="ingame" />` be jokio režimo filtro (`isAdsAllowedForThisUser()` tikrina tik `ADS_ENABLED` ir grandfather datą). Tikėtina, kad reklama rodoma ir ranked žaidime — tada klaidingas ir privacy teiginys.
   - `public/privacy.html` 57 eil. — sugadintas sakinys: „We never see ranked multiplayer game screens carry ads“.
   - FAQ „no premium tier“ — **šiuo metu teisinga** (prenumeratos nėra). Bus neteisinga tik įdiegus `monetization_plan.md`.
6. ✅ `meta keywords` yra, Google jį ignoruoja — šalinti.
7. ✅ `user-scalable=no, maximum-scale=1.0` yra. **✎** Bet žaidimo ekranui tai sąmoninga (hard rule: niekas neišeina už viewport'o, `body { overflow: hidden }`). Taisyti tik turinio puslapiuose; žaidimo route'e palikti arba pakeisti `touch-action` (iOS vis tiek ignoruoja `user-scalable=no`).
8. ✅ Privacy canonical `/privacy.html`, sitemap'e jo nėra.
9. ⚠ **JSON-LD YRA** — `index.html` turi `VideoGame` ir `FAQPage` blokus. Problema ne nebuvimas, o turinys: `playMode: "CoOp"` (co-op nėra), `operatingSystem: "Any"`, `gamePlatform: "PWA"`, „chess-like/othello“ raktažodžiai, klaidingas FAQ apie reklamas. Be to: Google nuo 2023 m. FAQ rich results rodo tik autoritetingiems gov/health puslapiams, o `HowTo` rich results panaikinti — tikėtis jų iš šių schemų nereikia.
10. ➕ **Naujai rasta:** `<meta http-equiv="Content-Security-Policy">` turi `frame-ancestors 'none'` — naršyklės jį **ignoruoja meta žymoje**, o GH Pages header'ių nustatyti negali. Šiandien iframe embed'inimas faktiškai neblokuojamas (svarbu 4.6).

---

## Peržiūros išvados (Claude Code, 2026-10-10)

**Architektūra identifikuota iš esmės teisingai** (React+TS, Supabase, Capacitor, AdSense/AdMob, režimai). Bet plane yra penkios prielaidos, kurios neatitinka realybės ir keičia darbų apimtį:

| # | Plano prielaida | Realybė kode | Poveikis |
|---|---|---|---|
| A | Hostingas nežinomas, siūloma ISR / `@vercel/og` / edge | **GitHub Pages**, grynai statinis | Viskas, kas dinamiška (`/g/<id>`, `/c/<code>`, OG paveikslai, puzzle archyvas), turi būti arba **build-time** (+ GH Actions cron rebuild), arba **Supabase Edge Function**. Vercel Hobby draudžia komercinį naudojimą → Pro mokamas → pažeidžia zero-cost. Bendrinimo nuorodų unfurl'as jau pastatytas ir išjungtas (`ENABLE_SHARE_CARD_LINKS=false`, `r` Edge Function, `cloudflare/SETUP-STEPS.md`) — 4.2 turi remtis juo, ne nauju sprendimu. |
| B | Daily puzzle = užduotis su sprendimu („42 % išsprendė“, „<30 s“, „2/3“) | Daily = **serverio sugeneruota bendra atidarymo pozicija + pilnas žaidimas prieš L3–L5 AI su 3 min laikrodžiu**, rezultatas = taškai, leaderboard'as. Vieno teisingo sprendimo nėra. | 3 fazės `/puzzles/<date>` ir 4.1 share formatas perrašyti (žr. žemiau). Sprendimo „slėpimo iki vidurnakčio“ nereikia. |
| C | Pasiekimų sistema neaiški, siūlomas perdarymas nuo nulio | **Jau įdiegta ir paleista:** 97 pasiekimai, 13 kategorijų, `src/achievements/` (catalog, engine, store, cloudSync, toast, popover), Supabase `player_achievements`, „featured“ badge rodomas prie vardo žaidžiant, išversta į 6 kalbas | Fazė 6 = **evoliucija**, ne perrašymas. ID nekeisti (sinchronizuojami debesyje). |
| D | Ranked: siūloma viena eilė „Square 49 + Blitz“, AI fallback „aiškiai pažymėtas“ | Ranked lentos **atrakinamos pagal ranked žaidimų skaičių** (Triangle 0, Square 50, Rectangle 100). Bot fallback'as **jau yra** (`request-bot-match`) ir **jau pažymėtas** `MatchFoundScreen` („BOT“). Eilė = laiko kontrolė × lenta. | 5.1 didžioji dalis padaryta. Square-only ranked sulaužytų atrakinimo progresiją ir dalį pasiekimų. Pirma išmatuoti laukimą. |
| E | GA4 eventai — nauji pavadinimai | Jau siunčiama ~19 eventų (`first_visit`, `game_started`, `game_first_score`, `game_finished`, `daily_puzzle_started/solved`, `result_share_*`, `tellafriend_*`, `ref_param_landed`, `referral_claimed`, `friend_invite_*`, `multiplayer_button_clicked`…) | Nepervadinti (prarastume istoriją). Pridėti tik trūkstamus. |

**Prieštaravimai pačiame plane:**
- 2.1 „SPA į `/play`, `/` tik CTA“ ↔ 5.4 „pirmas ėjimas ≤5 s“. Papildomas paspaudimas + navigacija kertasi su tikslu. **✎ Rekomendacija:** žaidimas lieka `/` (taip pat ten veikia `?ref=` referral nuorodos ir Capacitor), o į `/` HTML'ą build metu įdedamas tikras matomas turinys (ne `<noscript>`) — trumpas aprašas + nuorodos į turinio puslapius. Turinio puslapiai — statiniai po subkeliais.
- 4.4 „premium analizė“ ir 6 „premium kosmetika“ remiasi mokėjimais, kurių nėra. Kol monetizacijos sprendimas nepriimtas — viskas nemokama.

**Prioritetas:** dabartinis aktyvus darbas yra Play Store closed testing (≥12 testuotojų / 14 d.). Šis planas su juo konkuruoja laiku — siūlau pirmiausia daryti **pigius, didelio poveikio** punktus: 2.2 meta/FAQ/privacy pataisymus (valanda darbo, rizika AdSense/Play politikai), tada 2.1 + `/skarele` + `/how-to-play`.

---

## FAZĖ 1 — Repo auditas (jokių pakeitimų)

**✎ Dauguma atsakymų jau žinomi** (žr. peržiūros išvadas). Likę klausimai, kuriuos reikia atsakyti prieš kodą:

1. ~~Build įrankis / routeris / hostingas~~ → Vite 5, be routerio, GH Pages, `public/` kopijuojamas į `dist/` kaip yra.
2. Daily puzzle: `daily-puzzle` Edge Function generuoja; **patikrinti**, ar praėjusių dienų pozicijos lieka DB ir kiek laiko (archyvui ir `retention_sweep`).
3. Pasiekimai: **ne kurti sąrašą nuo nulio**, o sugeneruoti `achievements-audit.md` iš `src/achievements/catalog.ts` + `engine.ts`: id, kategorija, sąlyga, ar turi skaitinį progresą (galima progreso juosta), tik klientas ar serveris. Pastaba: `player_achievements_insert_own` RLS leidžia klientui įrašyti bet ką — retumo % būtų apgaunamas.
4. GA4: sąrašas aukščiau (E). Patikrinti `telemetry.ts` session cap ir ar eventai siunčiami tik po consent (taip — tada visi piltuvo % skaičiuojami tik iš sutikusių).
5. Matchmaking: eilės raktas = `time_control` × `shape` (`supabase/functions/matchmake`). Išmatuoti realų laukimo laiką ir bot-fallback dalį prieš keičiant (Fazė 5).
6. ➕ Patikrinti, ar `AdBanner placement="ingame"` rodomas ranked/daily žaidime (audito p. 5).
7. ➕ Ar `matches` lentelė saugo ėjimų seką (reikia 4.2 replay'ams). `matchHistory.ts` jos neskaito; gyvi `games` trinami po 24 h (`retention_sweep`).

---

## FAZĖ 2 — Techninis SEO pagrindas

### 2.1 Prerender / SSG
Tikslas: kiekvienas turinio puslapis turi pilną HTML be JS.
- **✎** Kadangi routerio nėra ir hostingas statinis, mažiausiai invazyvu: **build-time skriptas** `scripts/build-pages.ts` (paleidžiamas po `vite build` per `tsx`, jau naudojamas), generuojantis `dist/<route>/index.html` iš TSX/Markdown šablonų su `react-dom/server` `renderToStaticMarkup`. Be naujų priklausomybių. `vite-react-ssg` (MIT) — tik jei reikės hydration interaktyviems elementams.
- Žaidimo SPA lieka `/` (žr. peržiūros išvadas), turinio puslapiai — statiniai subkeliuose. Pridėti `404.html` (GH Pages) su nuorodomis.
- Interaktyvūs pavyzdžiai turinio puslapiuose: statinis SVG iš `geometry.ts` + maža hydrated sala; ne visas `App`.

### 2.2 Meta ir techniniai pataisymai — **daryti pirmiausia**
- Pašalinti `meta keywords` ir JSON-LD `keywords`.
- Viewport: turinio puslapiams `width=device-width, initial-scale=1, viewport-fit=cover`; žaidimo `/` — palikti dabartinį arba pereiti prie `touch-action` ant lentos, **patikrinus 320×568** (hard rule).
- **Ištaisyti FAQ** (JSON-LD + `<noscript>`): ads rodomi ir žaidimo ekrane web'e (arba pašalinti ingame ad iš ranked ir tai aiškiai parašyti). Ištaisyti `privacy.html` 57 eil. sakinį. Vienas tiesos šaltinis `src/content/facts.ts` → FAQ, JSON-LD, privacy fragmentai.
- JSON-LD: pašalinti `CoOp`, `operatingSystem: "Any"` → `"Web, Android"`, `gamePlatform` → `["Web Browser", "Android"]`.
- Kiekvienam puslapiui: unikalus `<title>` (≤60), `meta description` (≤155), `canonical`, `og:*`. **✎** `hreflang` — tik toms kalboms, kurių turinio puslapis realiai išverstas (pradžiai en + lt + `x-default`), nors app'as turi 6 kalbas.
- Sitemap generuoti build metu iš visų route'ų su realiais `lastmod`; pridėti `/privacy.html`. Atskiras `sitemap-puzzles.xml` + index — tik kai bus archyvas.
- ➕ `frame-ancestors` iš meta CSP nieko nedaro — arba pašalinti (kad neklaidintų), arba priimti, kad apsauga nuo clickjacking'o GH Pages'e neįmanoma be Cloudflare.

### 2.3 Struktūrizuoti duomenys (JSON-LD)
- Homepage: pataisytas `VideoGame` (+ `isBasedOn` → `/skarele`, kai puslapis bus).
- **✎** `FAQPage` palikti (nekenkia), bet rich snippet'ų nesitikėti. `HowTo` nenaudoti (Google rich results panaikinti) → taisyklėms `Article`.
- `BreadcrumbList` turinio puslapiuose; `Organization` (logo). **⚠** `sameAs` → Play Store įdėti tik kai listing'as bus viešas (dabar internal testing).
- Testas (`vitest`, MIT, $0 — naujas dev dep): parsina sugeneruotą `dist/**/*.html`, validuoja JSON-LD kaip JSON su privalomais laukais.

### 2.4 Performance
- Lighthouse CI (`@lhci/cli`, Apache-2.0, $0) į `deploy.yml`: turinio puslapiams Performance ≥90, SEO 100, A11y ≥95. Žaidimo `/` — tik informacinis (be gate'o), nes reklamos ir CMP traukia balą žemyn.
- Fontai jau self-hosted + preload; patikrinti `font-display: swap`. OG paveikslas `og-card.png` jau yra.
- Žaidimo bundle'as turinio puslapiuose iš viso nekraunamas (atskiri HTML).

**Priėmimo kriterijai:** `curl https://www.dotduel.com/how-to-play/` grąžina pilną tekstą HTML'e; sitemap ≥10 URL; Rich Results Test be klaidų; FAQ/privacy teiginiai atitinka kodą.

---

## FAZĖ 3 — Turinio puslapiai (paieškos „paviršius")

Visi puslapiai: EN + LT (`/lt/...`). Kiekvieno apačioje CTA „Play now — no signup“ → `/`.

| URL | Tikslinė užklausa | Turinys |
|---|---|---|
| `/how-to-play` | how to play dot game, dot game rules | Taisyklės per 30 s + SVG pavyzdžiai: linijos užbaigimas, keli vienu ėjimu, pending claim. **✎** Teksto šaltinis — esamas `RulesPopover`/`HowToPlayPopover` + i18n, kad nesidubliuotų |
| `/skarele` (+ `/lt/skarele`) | skarelė žaidimas, lithuanian pen and paper game | **Svarbiausias puslapis.** Kilmė, kaip žaista ant languoto popieriaus, kuo DotDuel skiriasi (biggest-only + pending). Nuotrauka — tik savo daryta (autorinės teisės) |
| `/paper-games` | pen and paper games for two | Sąrašinis straipsnis su nuorodomis į DotDuel |
| `/vs/dots-and-boxes` | dots and boxes online/alternative | Palyginimas |
| `/vs/tic-tac-toe` | harder tic tac toe | Palyginimas |
| `/strategy` + 3–4 `/strategy/<slug>` | dot game strategy | **✎** Remtis `simulation-results.md` (pvz. Triangle stiprus antro ėjimo pranašumas) — unikalus, patikrinamas turinys |
| `/ai` | play dot game vs computer | 5 lygiai (Beginner…Impossible), ką kiekvienas daro (lentelė iš CLAUDE.md) |
| `/daily` + `/daily/YYYY-MM-DD` | daily strategy puzzle | **⚠ perrašyta, žr. žemiau** |
| `/faq` | — | Iš `facts.ts` |
| `/press` | — | Press kit: logo, screenshot'ai (jau yra `play-store/screenshots/`), aprašymas EN/LT |

**✎ Daily archyvas (atitinka realią mechaniką):** kiekviena diena — puslapis su lentos forma, AI lygiu, atidarymo pozicija (SVG iš serverio seed'o), dienos top 10 rezultatų ir vidurkiu, CTA „Play today's board“. Generuojama **GH Actions cron** (kasnakt po 00:05 UTC) → rebuild → deploy; duomenys skaitomi per anon raktą iš viešai skaitomų lentelių. Šiandienos puslapio rezultatus rodyti tik po dienos pabaigos. **Priklauso nuo** Fazės 1 p. 2 (ar senos pozicijos saugomos). Leaderboard'e rodyti tik `display_name` (jau viešas) — jokių uid.

**Neindeksuoti:** profiliai, match'ų ID, `/g/`, `/c/` nuorodos (`noindex`).

### 3.1 Autoriaus blogas su admin prisijungimu (Donato reikalavimas, 2026-10-10)
Tikslas: Donatas rašo įrašus (kas yra žaidimas, kodėl sukurtas, ateities tikslai…) per naršyklę, prisijungęs kaip admin. Blogas — tas pats `/skarele` tipo SEO ir PR turinys, todėl įrašai **turi būti statiniame HTML** (kitaip Google jų nemato).

**Architektūra (be naujų mokamų paslaugų):**
- **Saugojimas:** Supabase lentelė `blog_posts (id, slug unique, lang, title, excerpt, body_md, cover_url, status draft|published, published_at, updated_at)`. Paveikslai — vieša Supabase Storage bucket'as `blog`.
- **Admin teisė — tik serveryje:** lentelė `admins(uid)` (įrašoma rankiniu SQL), RLS: `select` viešai tik `status='published'`; `insert/update/delete` ir draft'ų skaitymas — tik `exists(select 1 from admins where uid = auth.uid())`. Storage politika tokia pati. Kliento „isAdmin“ flag'as tik UI paslėpimui, ne apsaugai.
- **Prisijungimas:** esamas Google sign-in (jau veikia) — atskiro slaptažodžio nereikia.
- **Redaktorius:** paslėptas app'o ekranas (pvz. `/?admin=blog` arba meniu punktas, matomas tik admin'ui): įrašų sąrašas, Markdown laukas + gyva peržiūra, paveikslo įkėlimas, „Save draft“ / „Publish“. Markdown → HTML: `marked` (MIT, $0) + `DOMPurify` (Apache-2.0, $0) sanitizavimas.
- **Publikavimas į statinį HTML:** Fazės 2.1 `scripts/build-pages.ts` build metu nuskaito publikuotus įrašus (anon raktu) ir generuoja `/blog/` + `/blog/<slug>/` (+ sitemap, `Article` JSON-LD, OG). Kaip įrašas pasiekia svetainę:
  - paprasčiausia: GH Actions **cron** kas valandą/naktį perbuildina (įrašas pasirodo su vėlavimu);
  - geriau: „Publish“ kviečia Edge Function `blog-publish`, kuri patikrina admin ir siunčia GitHub `repository_dispatch` → deploy (~2 min). Reikia GitHub fine-grained token'o kaip Supabase secret (tik Actions dispatch teisė šiam repo).
- **Kalbos:** įrašas turi `lang` (en/lt); `hreflang` sieti per bendrą `slug`.
- **Apimtis:** vidutinė, ~2–4 darbo dienos (lentelė+RLS ~0.5 d., redaktorius ~1–1.5 d., build integracija ~1 d., publish trigger ~0.5 d.). Didžiausia priklausomybė — Fazė 2.1 (build-pages skriptas), be jo blogas būtų nematomas Google.
- **Alternatyva be login'o** (pigiausia): Markdown failai repo `content/blog/*.md`, rašomi per GitHub web redaktorių → PR → merge → deploy. Nulis naujo kodo backend'e, bet ne „admin login“ patirtis.
- Saugumas: sanitizuoti HTML (XSS), `admins` lentelė be kliento write teisės, security-auditor peržiūra prieš merge.

---

## FAZĖ 4 — Virusinės ir retencijos funkcijos

### 4.0 Daily rezultatų kalendorius — **MUST (Donato reikalavimas, 2026-10-10)**
Pakeičia dabartinį „paskutinių 30 dienų nugalėtojų“ sąrašą (`PuzzleLeaderboardPopover` + `recent_daily_winners`).
- **Vaizdas:** mėnesio kalendorius (◀ ▶ mėnesių perjungimas). Kiekvienoje dienoje — tos dienos nugalėtojas ir jo taškai (+ lentos formos ikonėlė). Dienos be dalyvių — tuščios; ateities dienos — neaktyvios.
- **Paspaudus dieną:** atsidaro visų tos dienos dalyvių sąrašas nuo geriausio iki blogiausio: vieta, vardas, taškai, (bandymai). Lygios vietos — pagal `first_completed_at` (kaip dabar nugalėtojui). Paryškinti savo eilutę.
- **Šiandiena:** rodoma kaip „vyksta“ — sąrašas gyvas, nugalėtojas preliminarus.
- **Duomenys jau yra:** `daily_leaderboard (utc_date, uid, display_name, best, first_completed_at, attempts)` saugo kiekvieną dalyvį kiekvienai dienai, indeksas `(utc_date, best desc, first_completed_at)` jau tinka. `daily_puzzle_defs` saugo dienos lentą/AI lygį. Reikia tik 2 read-only RPC (SQL Editor, ne `db push`):
  - `daily_month_winners(p_month date)` → nugalėtojas + dalyvių skaičius kiekvienai mėnesio dienai;
  - `daily_results_for_date(p_date date)` → visi dalyviai surikiuoti (be `uid` atsakyme — tik `display_name`, vieta, taškai; savo eilutę klientas atpažįsta per atskirą flag'ą `is_me`).
- **UI apribojimai:** 320×568 — 7 stulpeliai ≈ 40 px, vardas netilps. Langelyje rodyti taškus + 👑/inicialą, pilną vardą — dienos detalėje; arba telefone savaitės/sąrašo režimas. Lietuviškų mėnesių/savaitės dienų pavadinimai per i18n (6 kalbos). Tekstai neturi persidengti (hard rule).
- **Privatumas:** dabar viešai matomi tik nugalėtojai; po pakeitimo — visi dalyviai su `display_name` (tas pats lygis kaip ranked leaderboard'e — priimta rizika). `privacy.html` papildyti: daily rezultatai ir jų saugojimo terminas (dabar `retention_sweep` jų nevalo — nuspręsti terminą, pvz. 24 mėn. kaip `matches`).
- **Statinis archyvas (Fazė 3 `/daily/<date>`):** tas pats duomenų šaltinis, bet indeksuojamame puslapyje — tik top 10 + dalyvių skaičius; pilnas sąrašas — app'e.
- Testai: SQL RPC su keliais dalyviais ir lygiomis; UI 320 px EN + LT.

### 4.1 Daily dalinimasis — P0
- **✎** Share tekstas pagal realią mechaniką, pvz.: `DotDuel Daily #128 ▲ Triangle vs Hard — 34:28 ✅ ⏱ 1:12  dotduel.com/daily` (be emoji „sprendimo tinklelio“ — nėra ką rodyti). Panaudoti esamą `src/share/resultShareText.ts` + victory card (`result_share_*` eventai jau yra).
- Streak: day-streak jau skaičiuojamas pasiekimams (`dailyStreak` `engine.ts`) — rodyti meniu, ne kurti naują.
- **✅ Svarbiausia:** daily šiuo metu **tik prisijungusiems** (`Menu.tsx` „dailySignInTitle“). Atidaryti visiems: rezultatas į localStorage, leaderboard ir pateikimas — tik prisijungus (prisijungus vėliau — pateikti tos dienos rezultatą, jei dar tą pačią dieną). Serverio RPC lieka autoritatyvus.

### 4.2 Bendrinami replay'ai — P1 (✎ buvo P0)
- **⚠ Kliūtys:** (1) GH Pages negali grąžinti dinaminio OG `/g/<id>` — crawler'iai JS nevykdo. Sprendimas jau pastatytas: `r` Edge Function + share-card bucket + Cloudflare DNS (`cloudflare/SETUP-STEPS.md`, reikia išsaugoti Namecheap email forwarding). (2) Ėjimų seka turi būti išsaugota — gyvi `games` trinami po 24 h; privacy policy retencijos teiginiai tada keičiasi (GDPR — atnaujinti `privacy.html`). (3) `@vercel/og` — ne (žr. A); jei reikia serverinio PNG, `satori` + `resvg` yra **MPL-2.0** (kaip jau priimtas `@capgo/...` — reikia aiškaus sutikimo).
- Nuorodoje — atsitiktinis kodas, **ne match id/uid** (taisyklė: jokių ID bendrinimo nuorodose).
- Pradėti nuo to, kas veikia dabar: victory card paveikslas jau dalinamas per native share.

### 4.3 Kvietimas su draugu be registracijos — P0
- `dotduel.com/?c=<code>` (query, ne path — GH Pages SPA neturi path route'ų be 404 triuko). Guest sesija per **Supabase Anonymous Sign-ins** (nemokama). Vėliau `linkIdentity` → Google, išsaugant Elo/istoriją.
- **⚠ Apimtis didesnė nei atrodo:** app'as identifikuoja žaidėjus legacy Firebase uid, lentelės — Supabase uuid; profiliai, username picker, RLS, `matchmake`/`submit-move` turi priimti anoniminį naudotoją; guest žaidimai — **unranked**. Anoniminiams vartotojams reikia retencijos valymo. Įvertinti atskirame design doc prieš kodą.

### 4.4 Ėjimų analizė po žaidimo — P2 (✎ buvo P1)
- **⚠** „Impossible“ (L5) = 2-ply minimax top-K — ne pakankamai stiprus variklis „best/inaccuracy/blunder“ žymoms; žymos bus triukšmingos. Įmanoma pigiai: kliente po žaidimo pervertinti kiekvieną ėjimą L5 eval ir rodyti tik „prarasti taškai vs geriausias L5 ėjimas“, be kategorinių etikečių.
- Nemokama (premium nėra).

### 4.5 Asinchroninis (correspondence) režimas — P2 (✎ buvo P1)
- **⚠** Push Android'e = FCM, kuriam reikia Firebase projekto (nemokama, bet planuota Firebase retirement — spręsti kartu). Web push — service worker. Taip pat reikalingas backlog'e esantis clock-timeout sweep. Didelis darbas mažam žaidėjų skaičiui; atidėti, kol metrikos parodys poreikį.

### 4.6 Embed'inamas daily — P3
- Atskiras `embed.html` be AdSense (reklama trečių šalių iframe'uose — politikos rizika) ir be consent banner'io (nėra analytics). Nepamiršti 10 audito punkto.

### 4.7 Savaitinis turnyras (Arena) — atmesti kol kas
- Su dabartiniu žaidėjų skaičiumi arena bus tuščia. Grįžti, kai ranked eilės laukimas < 20 s be bot'ų.

---

## FAZĖ 5 — Ką supaprastinti / pašalinti

1. **✎ Matchmaking.** Bot fallback'as ir BOT žymėjimas jau yra. Square-only ranked **nedaryti** — sulaužytų shape-unlock progresiją (50/100 ranked žaidimų) ir susijusius pasiekimus. Vietoj to: pirmiausia matuoti (`ranked_queue_timeout`, bot-match dalis pagal eilę); jei laukimas didelis — **suplakti laiko kontroles** (pvz. leisti 1↔3 min sutapimą) arba sumažinti fallback slenkstį. Lentos ašies neliesti.
2. `meta keywords` ir „chess/othello/connect four alternative“ pozicionavimas → „The Lithuanian paper game, now online“ kryptis (title/description/og/JSON-LD/noscript).
3. **✎** AI lygių skaičiaus nekeisti — 5 lygiai susieti su unlock progresija (`dotduel:progress:v3`), ~24 pasiekimais ir statistika (`stats:v4`). Užtenka aiškiai skirtingų aprašymų (L1 atsitiktinis, L2 „akivaizdūs“ ėjimai — skirtumas realus, tik nepaaiškintas).
4. Pirmas ėjimas ≤5 s: Google CMP (certified, reikalinga AdSense EEA) — išmatuoti, ar blokuoja lentą telefone; tutorial/onboarding taip pat. Tai argumentas palikti žaidimą `/`.

---

## FAZĖ 6 — Pasiekimų sistemos evoliucija (✎ ne perdarymas)

### Diagnozė (patikrinta prieš kodą)
Esama sistema: 97 pasiekimai — bots (per lentą × lygį), mastery, onboarding (First Steps, Winner, Claim Jumper…), hotseat, daily, streak, volume, ranked, onfire, elo, lines (Cornered, Big Score, Opportunist, Scavenger, Vulture), social, skill. Toast'as yra, featured badge prie vardo yra, cloud sync yra.

| Plano hipotezė | Verdiktas |
|---|---|
| Dauguma — skaitikliai | **Iš dalies ✅** — volume/streak/ranked/onfire/bots dominuoja; mechanikos (multi-line, pending) liečia tik `lines` ir keli `skill` |
| Nematomi, nėra progreso | **Iš dalies ✅** — matomi (greyed), `secret` tik keli; **progreso juostų nėra** |
| Nėra atlygio / socialinės vertės | **Iš dalies ✅** — featured badge matomas priešininkui; kitų atlygių nėra |
| Atrakinimas neturi momento | **⚠ Netiesa** — toast „🏆 Achievement unlocked“ yra; garsas jau yra kitur (audio 0.4.10+) — galima pridėti |

### Ką daryti (prioritetu)
1. **Progreso juostos** — `engine.ts` jau turi skaitiklius (`claims`, `impWins`, `rankedWon`, `dailyStreak`…); pridėti `progress(id) → {current, target}` ir rodyti popover'e + GameOver ekrane 1–3 artimiausius.
2. **5–8 mechanikos žygdarbiai** (pvz. „užbaik 3 linijas vienu ėjimu“, „atsiimk priešininko sukurtą pending liniją“, „laimėk atsilikęs ≥10 taškų“, „laimėk neleidęs priešininkui atsiimti nė vienos pending“). Reikia žaidimo eventų: **ne keisti `game.ts` grynumo** — eventus išvesti lyginant `prev`/`next` `GameState` po `applyAction` (atskiras `src/achievements/gameEvents.ts`), testai su sintetinėmis sekomis (`vitest`).
3. **Atlygiai be mokėjimų:** temos jau egzistuoja ir dalis užrakintos („Lock unpainted themes“) — atrakinti temas/titulus per pasiekimus. Premium kosmetika — tik kai bus mokėjimai.
4. **Retumo %** — SQL view virš `player_achievements` (select jau viešas). **⚠** Kol insert'as klientinis, % apgaunamas; kosmetinei statistikai priimtina, ranked pasiekimus (Elo, ranked streak) vėliau tikrinti serveryje (`finalize_game`).
5. **Savaitiniai iššūkiai (D sluoksnis)** — atidėti po metrikų; reikia serverinės rotacijos.

**Nekeisti:** esamų pasiekimų `id` (sinchronizuojami `player_achievements`, featured pin). Jei keičiasi localStorage forma — bump `dotduel:ach-stats:v1` → `v2` su migracija. Pavadinimai/aprašymai — per i18n (6 kalbos; vertimai per reviewer'į, ne rusų kalba). Changelog formuluotės — vartotojo patvirtinimui.

---

## FAZĖ 7 — Matavimas (daryti lygiagrečiai su 2 faze)

**✎ Esamus eventus palikti, pridėti tik trūkstamus:**

| Plano eventas | Esamas atitikmuo / veiksmas |
|---|---|
| `landing_view` | GA4 automatinis `page_view` / `first_visit` — nekurti |
| `first_move` | ➕ naujas (`game_first_score` ≠ pirmas ėjimas) |
| `game_complete{mode,board,ai_level}` | `game_finished` — patikrinti parametrus |
| `second_game_start` | ➕ arba skaičiuoti iš `game_started` count per sesiją GA4 Explorations |
| `puzzle_solved` / `puzzle_shared` | `daily_puzzle_solved` / `result_share_completed` (+ `source` param) |
| `invite_link_created/opened` | `tellafriend_*`, `ref_param_landed`, `friend_invite_*` — esamas |
| `signup` | ➕ naujas (Supabase auth naujas vartotojas) |
| `achievement_unlocked{id}` | ➕ naujas |
| `ranked_queue_timeout` | ➕ naujas (+ `bot_match` dalis) |

`docs/metrics.md` piltuvas: landing → first_move → game_finished → second game → D1/D7. **Pastaba:** GA4 krauna tik po consent, todėl visi % — iš sutikusių vartotojų imties; tai deklaruoti metrikose. Tikslai po 8 sav. — palikti, bet pirmą savaitę nustatyti baseline.

---

## Ne kodo užduotys (Donatui, ne Claude Code)

1. **Žaidimų portalai** — CrazyGames/Poki/GameDistribution reikalauja jų SDK ir jų reklamų; **AdSense ir Google CMP turi būti išjungti** portalo build'e (build flag), login'as nebūtinas (4.3 padeda). Rev-share be mokesčių — atitinka zero-cost.
2. **Lietuviška istorija** — `/skarele` + pitch'as LT žiniasklaidai.
3. **BoardGameGeek** — tradicinio žaidimo įrašas.
4. **Search Console** — **pirmiausia** patikrinti dabartinę indeksavimo būklę (audito p. 2), po Fazės 2 pateikti naują sitemap.
5. Reddit: r/abstractgames, r/WebGames, r/lithuania.
6. ➕ Play Store closed testing (aktyvus darbas) — `sameAs` ir „Get it on Google Play“ nuorodos tik kai listing'as viešas.

---

## Hostingo sprendimas (užfiksuota 2026-10-10)

**Sprendimas:** kai prasidės blogo (3.1) darbai — kraustomės iš GitHub Pages į **Cloudflare Pages** (nemokamas, leidžia komercinį naudojimą, PR preview, Pages Functions). Iki tol lieka GH Pages. Vercel atmestas (Hobby nekomercinis, Pro mokamas), Netlify — rizika, kad svetainė bus sustabdyta pasibaigus kreditams.

**Migracijos kontrolinis sąrašas (žaidimui svarbu):**
- Build lieka GH Actions; deploy per `wrangler pages deploy dist` (Cloudflare API token kaip GH secret) — ne Cloudflare build'ai (500/mėn. limitas, kitas env).
- DNS į Cloudflare išsaugant Namecheap email forwarding (`cloudflare/SETUP-STEPS.md`); `CNAME` failas nebereikalingas.
- **Išjungti** Rocket Loader, Auto Minify / email obfuscation, Bot Fight Mode — perrašo/įterpia skriptus ir laužo CSP `script-src 'self'` bei Google CMP.
- `public/_headers`: tikras CSP header'is (su veikiančiu `frame-ancestors`), `Cache-Control: no-cache` `index.html` ir `sw.js` (PWA service worker turi gauti atnaujinimus).
- Preview domenai (`*.pages.dev`): `consent-default.js` šiandien krauna AdSense bet kuriame ne-localhost domene → apriboti AdSense/GA tik `www.dotduel.com`; previews — `noindex`.
- Google sign-in previews: pridėti `*.pages.dev` (arba fiksuotą preview subdomeną) į Supabase redirect allow-list ir Google OAuth origins — kitaip prisijungimas preview'uose neveiks (prod nepaliestas).
- Prod domenas nesikeičia → Supabase auth, AdSense site, `ads.txt`, GA4, Capacitor app (assets APK viduje) — nepaveikti.
- Perjungimas: pirmiausia `*.pages.dev` pilnas sanity checklist, tada DNS; GH Pages palikti veikiantį kaip atsarginį kelias dienas.

## Įgyvendinimo tvarka (✎ atnaujinta)

1. **Fazė 2.2** — FAQ/privacy/JSON-LD/keywords pataisymai (pigu, mažina politikos riziką) + Search Console baseline.
2. Fazės 1 likę klausimai (daily retencija, ingame ad ranked'e, ėjimų saugojimas).
3. **Fazė 4.0 — daily rezultatų kalendorius (MUST)**; nepriklauso nuo SEO darbų, galima daryti lygiagrečiai.
4. Fazė 7 (trūkstami eventai) + Fazė 2.1/2.3/2.4 (build-pages skriptas, sitemap, LHCI).
5. Fazė 3: `/skarele`, `/how-to-play`, `/ai` → **3.1 blogas su admin login** (naudoja tą patį build-pages) → `/daily` archyvas (cron rebuild).
6. Fazė 4.1 (daily be prisijungimo + share).
7. Fazė 6 (progreso juostos → mechanikos žygdarbiai → temų atrakinimas).
8. Fazė 4.3 (guest kvietimai — po design doc).
9. Fazė 5 (tik pagal metrikas) → 4.2 (kartu su Cloudflare/unfurl sprendimu) → 4.4 → 4.5/4.6.

Kiekvienai fazei: atskiras branch, PR (merge'ina tik Donatas), `npm run build` žalias, 320×568 patikra, Lighthouse rezultatai PR aprašyme. Naujos priklausomybės — su licencija ir kaina tame pačiame PR aprašyme.
