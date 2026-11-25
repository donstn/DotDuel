// The text under the game on the home page (website only). The game fills
// the first screen; this section sits below it so search engines (and anyone
// who scrolls) can read what DotDuel is. Injected into dist/index.html by
// scripts/web-layout.mjs. English, with links to the guides in every language.
import { LANGS, LANG_NAMES, SITE } from './langs';
import { faqs } from './faq';

const PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.dotduel.app';
const SOCIAL: [string, string][] = [
  ['Discord', 'https://discord.gg/mnfVHPdpU'],
  ['Facebook', 'https://www.facebook.com/profile.php?id=61590580491938'],
  ['TikTok', 'https://www.tiktok.com/@dotduel.com'],
];

// Theme art lives in public/art/<dir>/; Christmas and Desert only repaint
// some of it, the rest comes from Forest & Pearl (same as the game).
const ART_DIR: Record<string, string> = { 'forest-pearl': 'forest-pearl', christmas: 'christmas', 'sunset-catan': 'desert-sunset' };
const OWN_ART: Record<string, string[]> = {
  christmas: ['background-landscape.webp', 'background-portrait.webp', 'dot-p1.webp', 'dot-p2.webp'],
  'sunset-catan': ['background-landscape.webp', 'background-portrait.webp', 'dot-p1.webp', 'dot-p2.webp', 'avatar-human.webp', 'avatar-l1.webp', 'menu-icon-shape-triangle.webp', 'menu-icon-shape-square.webp', 'menu-icon-shape-rectangle.webp', 'primary-button.webp'],
};

/** An image of the current theme's art; the script swaps it when the theme changes. */
function art(file: string, w: number, h: number, cls = ''): string {
  return `<img${cls ? ` class="${cls}"` : ''} data-art="${file}" src="/art/forest-pearl/${file}" width="${w}" height="${h}" loading="lazy" decoding="async" alt="">`;
}

const CSS = `
@font-face { font-family: "Chakra Petch"; src: url(/fonts/chakra-petch-600.woff2) format("woff2"); font-weight: 600; font-display: swap; }
@font-face { font-family: "Chakra Petch"; src: url(/fonts/chakra-petch-700.woff2) format("woff2"); font-weight: 700; font-display: swap; }
html, body { height: auto; }
html { overflow-x: hidden; overflow-y: auto; scrollbar-width: none; }
html::-webkit-scrollbar { display: none; }
body { overflow: visible; touch-action: auto; }
#canvas { touch-action: none; }

#dd-about {
  --ground: #0f2216; --raised: #173322; --ink: #e7efe0; --soft: rgba(231,239,224,.8);
  --head: #d3ecaa; --link: #8fe0a6; --rule: rgba(211,236,170,.18); --cta-ink: #0d2a17;
  --dot: url(/art/forest-pearl/dot-p1.webp); --cta: url(/art/forest-pearl/primary-button.webp); --cta-ratio: 916 / 201;
  position: relative; margin-top: 100vh; margin-top: 100lvh; background: var(--ground); color: var(--ink);
  font: 1.125rem/1.65 Outfit, system-ui, sans-serif; padding: 0 1.25rem 6rem; overflow-wrap: anywhere;
}
html[data-theme="christmas"] #dd-about {
  --ground: #0b191c; --raised: #122629; --ink: #eef3f1; --soft: rgba(238,243,241,.8);
  --head: #f3d27a; --link: #a3dcc4; --rule: rgba(243,210,122,.2);
  --dot: url(/art/christmas/dot-p1.webp);
}
html[data-theme="sunset-catan"] #dd-about {
  --ground: #25130a; --raised: #351d10; --ink: #f6e9d7; --soft: rgba(246,233,215,.8);
  --head: #f0c27f; --link: #f7ab6e; --rule: rgba(240,194,127,.2); --cta-ink: #3a1a08;
  --dot: url(/art/desert-sunset/dot-p1.webp); --cta: url(/art/desert-sunset/primary-button.webp); --cta-ratio: 1117 / 187;
}

/* The painted scene carries on below the game and settles into the ground. */
#dd-about .band { display: block; width: calc(100% + 2.5rem); max-width: none; height: 15rem; margin: 0 -1.25rem; object-fit: cover; object-position: 50% 100%;
  -webkit-mask-image: linear-gradient(#000 15%, transparent); mask-image: linear-gradient(#000 15%, transparent); }
/* One left edge for everything; reading text stays under ~75 characters. */
#dd-about .w, #dd-about .wide { max-width: 64rem; margin: 0 auto; }
#dd-about .w > * { max-width: 42rem; }
#dd-about .intro { margin-top: -6rem; position: relative; }

#dd-about h1, #dd-about h2, #dd-about h3 { font-family: "Chakra Petch", Outfit, sans-serif; color: var(--head); letter-spacing: .01em; }
#dd-about h1 { font-size: clamp(2rem, 6vw, 3rem); line-height: 1.12; font-weight: 700; margin: 0 0 1rem; color: var(--ink); text-shadow: 0 2px 18px var(--ground), 0 0 4px var(--ground); }
#dd-about h2 { font-size: 1.75rem; line-height: 1.2; font-weight: 700; margin: 4.5rem 0 .75rem; }
#dd-about h3 { font-size: 1.1875rem; line-height: 1.3; font-weight: 600; margin: 0 0 .35rem; color: var(--ink); }
#dd-about p { margin: 0 0 1rem; color: var(--soft); }
#dd-about .lead { font-size: 1.3125rem; line-height: 1.55; color: var(--ink); }
#dd-about a { color: var(--link); text-underline-offset: .18em; }
#dd-about a:focus-visible, #dd-top:focus-visible { outline: 3px solid var(--head); outline-offset: 3px; border-radius: 6px; }
#dd-about strong { color: var(--ink); font-weight: 600; }

/* Bullets are the theme's own painted dots. */
#dd-about .dots { list-style: none; padding: 0; margin: 0 0 1rem; }
#dd-about .dots li { position: relative; padding-left: 2rem; margin: .6rem 0; color: var(--soft); }
#dd-about .dots li::before { content: ""; position: absolute; left: 0; top: .3em; width: 1.1em; height: 1.1em; border-radius: 50%; background: var(--raised); }
#dd-about.lit .dots li::before { background: var(--dot) center / contain no-repeat; }

#dd-about .modes { display: grid; gap: 2rem 3rem; margin: 1.5rem 0 0; padding: 0; list-style: none; }
#dd-about .modes li { display: grid; grid-template-columns: 4.5rem 1fr; gap: 1.25rem; align-items: start; }
#dd-about .modes img { width: 4.5rem; height: 4.5rem; object-fit: contain; }
#dd-about .modes p { margin: 0; }

#dd-about .shapes { display: flex; flex-wrap: wrap; gap: 1.5rem 2.5rem; margin: 1.5rem 0 1.25rem; padding: 0; list-style: none; }
#dd-about .shapes li { text-align: center; color: var(--soft); font-size: 1rem; }
#dd-about .shapes img { display: block; width: 5.5rem; height: 5rem; object-fit: contain; margin: 0 auto .4rem; }
#dd-about .shapes b { display: block; color: var(--ink); font-family: "Chakra Petch", Outfit, sans-serif; font-weight: 600; font-size: 1.0625rem; }

#dd-about .worlds { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; margin: 1.5rem 0 1rem; padding: 0; list-style: none; }
#dd-about .worlds figure { margin: 0; }
#dd-about .worlds img { display: block; width: 100%; height: auto; aspect-ratio: 3 / 4; object-fit: cover; border-radius: 1rem; border: 2px solid var(--rule); }
#dd-about .worlds figcaption { margin-top: .5rem; font-size: 1rem; color: var(--soft); }
#dd-about .worlds .now { display: none; color: var(--head); font-weight: 600; }
html:not([data-theme="christmas"]):not([data-theme="sunset-catan"]) #dd-about [data-world="forest-pearl"] img,
html[data-theme="christmas"] #dd-about [data-world="christmas"] img,
html[data-theme="sunset-catan"] #dd-about [data-world="sunset-catan"] img { border-color: var(--head); }
html:not([data-theme="christmas"]):not([data-theme="sunset-catan"]) #dd-about [data-world="forest-pearl"] .now,
html[data-theme="christmas"] #dd-about [data-world="christmas"] .now,
html[data-theme="sunset-catan"] #dd-about [data-world="sunset-catan"] .now { display: block; }

#dd-about .faq { display: grid; gap: 1.75rem 3rem; margin-top: 1.5rem; }
#dd-about .faq p { margin: 0; }
#dd-about .more { margin-top: 1.5rem; }
@media (min-width: 52rem) {
  #dd-about .modes, #dd-about .faq { grid-template-columns: 1fr 1fr; }
}

#dd-about .pills { display: flex; flex-wrap: wrap; gap: .6rem; margin: 1rem 0; padding: 0; list-style: none; }
#dd-about .pills a { display: inline-block; padding: .5rem 1rem; border-radius: 999px; border: 1px solid var(--rule); background: var(--raised); text-decoration: none; }
#dd-about .pills a:hover { border-color: var(--link); }

/* The game's own painted primary button. */
#dd-about .gp { box-sizing: border-box; max-width: 100%; display: inline-flex; align-items: center; justify-content: center; height: 3.75em; aspect-ratio: var(--cta-ratio); padding: 0 2.6em;
  background: var(--raised); border-radius: 1em; color: var(--cta-ink); font: 700 1.0625rem "Chakra Petch", Outfit, sans-serif; text-decoration: none; white-space: nowrap; }
#dd-about.lit .gp { background: var(--cta) center / 100% 100% no-repeat; border-radius: 0; }
#dd-about .gp:hover { filter: brightness(1.08); }

#dd-about footer { margin-top: 5rem; padding-top: 1.25rem; border-top: 1px solid var(--rule); font-size: 1rem; display: flex; flex-wrap: wrap; gap: .5rem 1.25rem; color: var(--soft); }
#dd-top { position: fixed; right: 1rem; bottom: calc(1rem + env(safe-area-inset-bottom)); z-index: 3; padding: .75rem 1.25rem; border: 0; border-radius: 999px;
  background: #8fe0a6; color: #0d2a17; font: 700 1rem "Chakra Petch", Outfit, system-ui, sans-serif; box-shadow: 0 6px 20px rgba(0,0,0,.45); cursor: pointer; opacity: 0; pointer-events: none; transition: opacity .2s; }
html[data-theme="christmas"] #dd-top { background: #f3d27a; color: #2a1d05; }
html[data-theme="sunset-catan"] #dd-top { background: #f7ab6e; color: #2e1406; }
#dd-top.on { opacity: 1; pointer-events: auto; }
@media (prefers-reduced-motion: reduce) { #dd-top { transition: none; } }
`;

export function homeSection(): string {
  const guides = LANGS.map(
    (l) => `<li><a href="${SITE[l].paths.howToPlay}" hreflang="${l}" lang="${l}">${LANG_NAMES[l]}</a></li>`,
  ).join('');
  // Short FAQ: a few of the /faq/ answers (same reviewed text), by question.
  const all = faqs('en');
  const pick = ['free', 'install', 'Dots and Boxes', 'chess', 'friend', 'first player', 'How long'];
  const qa = pick
    .map((w) => all.find((f) => f.q.includes(w)))
    .filter((f): f is (typeof all)[number] => !!f)
    .map((f) => `<div><h3>${f.q}</h3><p>${f.a}</p></div>`)
    .join('\n    ');
  const social = SOCIAL.map(([n, u]) => `<li><a href="${u}" rel="noopener" target="_blank">${n}</a></li>`).join('');
  const world = (id: string, name: string, line: string) =>
    `<li data-world="${id}"><figure><img src="/art/${ART_DIR[id]}/background-portrait.webp" width="768" height="1376" loading="lazy" decoding="async" alt="${name}: ${line}"><figcaption><strong>${name}</strong><span class="now">You're playing here</span></figcaption></figure></li>`;
  return `<style>${CSS}</style>
<section id="dd-about" aria-labelledby="dd-about-h">
${art('background-landscape.webp', 1376, 768, 'band')}
<div class="w intro">
  <h1 id="dd-about-h">DotDuel: a free two-player dot strategy game</h1>
  <p class="lead">Two players take turns colouring dots. Complete a line and you score its length. One move can finish several lines, but only the longest scores, and the rest are left for either player to claim. That one rule turns a pen-and-paper idea into a real duel of timing and nerve.</p>
  <p>DotDuel plays right here in your browser, on a phone, tablet or computer, with nothing to install and nothing to buy. It is also on <a href="${PLAY_STORE}" rel="noopener">Google Play</a> for Android.</p>

  <h2>How a game works</h2>
  <ul class="dots">
    <li>On your turn, colour any empty dot, or claim an unclaimed line.</li>
    <li>Whoever colours the last dot of a line scores it: one point per dot, no matter who coloured the others.</li>
    <li>Finish two or three lines with one dot and only the longest scores. The others become unclaimed lines, and either player can spend a later turn to take one.</li>
    <li>The game ends when every dot is coloured and every line is claimed. More points wins.</li>
  </ul>
  <p>The rules take two minutes. Pictures and examples are in the <a href="${SITE.en.paths.howToPlay}">full guide</a>.</p>

  <h2>Why it's different</h2>
  <p>DotDuel has the quick start of tic-tac-toe, the dot grid of Dots and Boxes and the no-luck tension of chess. Both players see the whole board, nothing is random, and a game takes only a few minutes. Grabbing every line you can is rarely the best plan: a move that completes two lines also leaves the second one for your opponent, and sometimes the strongest move is the quiet one that sets nothing up.</p>
</div>

<div class="wide">
  <h2>Ways to play</h2>
  <ul class="modes">
    <li>${art('avatar-l1.webp', 163, 231)}<div><h3>Against bots</h3><p>Five levels, from a Beginner that moves at random to an Impossible bot that looks three moves ahead. Beat a level to unlock the next one and new board shapes.</p></div></li>
    <li>${art('avatar-human.webp', 128, 233)}<div><h3>With a friend on one device</h3><p>Pass the phone or share the screen, every shape open from the start.</p></div></li>
    <li>${art('ach-trophy.webp', 150, 155)}<div><h3>Online ranked</h3><p>Sign in with Google, get matched with a player of similar rating and play on a chess clock (1, 3 or 5 minutes). Your Elo rating climbs the global leaderboard. Add friends and challenge them directly.</p></div></li>
    <li>${art('ach-calendar.webp', 144, 160)}<div><h3>Daily puzzle</h3><p>The same half-played board for everyone, a 3-minute clock, three attempts, and a daily leaderboard.</p></div></li>
  </ul>
</div>

<div class="w">
  <h2>Three boards</h2>
  <ul class="shapes">
    <li>${art('menu-icon-shape-triangle.webp', 228, 209)}<b>Triangle</b>36 dots</li>
    <li>${art('menu-icon-shape-square.webp', 228, 209)}<b>Square</b>49 dots</li>
    <li>${art('menu-icon-shape-rectangle.webp', 228, 209)}<b>Rectangle</b>63 dots</li>
  </ul>
  <p><strong>Triangle</strong> (36 dots, three line directions) is where everyone starts: clear and readable, ideal for learning to count lines. <strong>Square</strong> (49 dots) and <strong>Rectangle</strong> (63 dots) add columns, so every dot sits on four lines and single moves complete several at once far more often. The pool of unclaimed lines grows, and so does the tactics.</p>

  <h2>Painted worlds</h2>
  <p>Play in the calm Forest &amp; Pearl glade, around a winter campfire in the Christmas theme, or on a sandstone pyramid in Desert Sunset, each with its own art and sounds.</p>
  <ul class="worlds">
    ${world('forest-pearl', 'Forest &amp; Pearl', 'a misty glade with pearls and fireflies')}
    ${world('christmas', 'Christmas', 'a snowy pine forest around a campfire')}
    ${world('sunset-catan', 'Desert Sunset', 'a sandstone pyramid at dusk')}
  </ul>

  <h2>Get better</h2>
  <p>The <a href="${SITE.en.paths.strategy}">strategy guide</a> covers the ideas that separate a Beginner from an Impossible bot: counting every line through a dot, not leaving one-gap lines, and when to claim instead of placing. Quick answers are in the <a href="${SITE.en.paths.faq}">FAQ</a>, and every update is in the <a href="${SITE.en.paths.changelog}">changelog</a>.</p>
</div>

<div class="wide">
  <h2>Questions</h2>
  <div class="faq">
    ${qa}
  </div>
  <p class="more">More answers in the <a href="${SITE.en.paths.faq}">full FAQ</a>.</p>
</div>

<div class="w">
  <h2>Guide in your language</h2>
  <ul class="pills">${guides}</ul>
  <p>The game itself speaks English, Lithuanian, Spanish, Portuguese, Polish and Czech.</p>

  <h2>Android app</h2>
  <p>Same game, same rating, on your home screen.</p>
  <a class="gp" href="${PLAY_STORE}" rel="noopener">Get it on Google Play</a>

  <h2>Community</h2>
  <p>Share a great game, find opponents or suggest an idea.</p>
  <ul class="pills">${social}</ul>

  <footer>
    <span>© 2026 DotDuel, made by an independent developer</span>
    <a href="${SITE.en.paths.about}">About</a>
    <a href="/privacy.html">Privacy</a>
    <a href="mailto:donstn@gmail.com">donstn@gmail.com</a>
  </footer>
</div>
</section>
<button id="dd-top" type="button" aria-label="Back to the game">↑ Play</button>
<script>
(function () {
  var top = document.getElementById('dd-top');
  function upd() { top.classList.toggle('on', window.scrollY > window.innerHeight * 0.5); }
  window.addEventListener('scroll', upd, { passive: true });
  top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); var c = document.getElementById('canvas'); if (c) c.focus({ preventScroll: true }); });
  // Theme art: images and painted bullets follow the game's theme (the game
  // sets html[data-theme]); nothing loads until the reader comes near.
  var sec = document.getElementById('dd-about');
  var DIRS = ${JSON.stringify(ART_DIR)}, OWN = ${JSON.stringify(OWN_ART)};
  function paint() {
    var t = document.documentElement.dataset.theme || 'forest-pearl';
    var own = OWN[t] || [];
    sec.querySelectorAll('img[data-art]').forEach(function (im) {
      var f = im.getAttribute('data-art');
      var src = '/art/' + (own.indexOf(f) >= 0 ? DIRS[t] : 'forest-pearl') + '/' + f;
      if (im.getAttribute('src') !== src) im.setAttribute('src', src);
    });
  }
  paint();
  new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { sec.classList.add('lit'); io.disconnect(); }
    }, { rootMargin: '400px' });
    io.observe(sec);
  } else sec.classList.add('lit');

  // Called by the game's "About DotDuel" link (menu footer).
  window.ddAbout = function () { document.getElementById('dd-about').scrollIntoView({ behavior: 'smooth' }); };

  // The game swallows touch and wheel events, so the page can't scroll from
  // over it. On the home menu (window.ddHome, set by the game) we scroll the
  // page ourselves: a swipe moves it with the finger, then settles on the text
  // or back on the game; the wheel scrolls normally.
  // Once a finger has moved 10px the page takes it over: the game is told the
  // touch was cancelled (window.ddCancelTouch, so the button it started on
  // doesn't fire) and gets no more of its events.
  var canvas = document.getElementById('canvas');
  var about = document.getElementById('dd-about');
  var y0 = null, y = 0, dragging = false, anim = 0;
  function onCanvas(e) { return canvas && e.target === canvas; }
  function glide(to) {
    cancelAnimationFrame(anim);
    var from = window.scrollY, t0 = performance.now();
    (function step(t) {
      var k = Math.min(1, (t - t0) / 300);
      window.scrollTo(0, from + (to - from) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) anim = requestAnimationFrame(step);
    })(t0);
  }
  window.addEventListener('touchstart', function (e) {
    cancelAnimationFrame(anim);
    y0 = null;
    dragging = false;
    if (!window.ddHome || e.touches.length !== 1 || !onCanvas(e)) return;
    y0 = y = e.touches[0].clientY;
  }, { capture: true, passive: true });
  window.addEventListener('touchmove', function (e) {
    if (y0 === null || e.touches.length !== 1) return;
    var ny = e.touches[0].clientY;
    if (!dragging) {
      if (Math.abs(ny - y0) < 10) return;
      dragging = true;
      if (window.ddCancelTouch) window.ddCancelTouch();
    }
    e.stopPropagation();
    window.scrollBy(0, y - ny);
    y = ny;
  }, { capture: true, passive: true });
  function end(e) {
    if (y0 === null) return;
    var d = y0 - y, was = dragging;
    y0 = null;
    dragging = false;
    if (!was) return;
    e.stopPropagation();
    var aboutTop = about.getBoundingClientRect().top + window.scrollY;
    if (window.scrollY < aboutTop) glide(d > 40 ? aboutTop : 0);
  }
  window.addEventListener('touchend', end, { capture: true, passive: true });
  window.addEventListener('touchcancel', end, { capture: true, passive: true });
  window.addEventListener('wheel', function (e) {
    if (!window.ddHome || !onCanvas(e)) return;
    cancelAnimationFrame(anim);
    window.scrollBy(0, e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY);
  }, { capture: true, passive: true });
}());
</script>
`;
}
