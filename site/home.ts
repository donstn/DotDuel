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

const CSS = `
html, body { height: auto; }
html { overflow-x: hidden; overflow-y: auto; scrollbar-width: none; }
html::-webkit-scrollbar { display: none; }
body { overflow: visible; touch-action: auto; }
#canvas { touch-action: none; }
#dd-about { position: relative; margin-top: 100vh; margin-top: 100lvh; background: #0c1d14; color: #eaf3e3; font: 17px/1.6 Outfit, system-ui, sans-serif; padding: 56px 20px 96px; overflow-wrap: anywhere; }
html[data-theme="sunset-catan"] #dd-about { background: #2a160c; }
#dd-about .w { max-width: 720px; margin: 0 auto; }
#dd-about h1 { font-size: clamp(28px, 6vw, 40px); line-height: 1.2; margin: 0 0 12px; }
#dd-about h2 { font-size: 23px; margin: 36px 0 8px; color: #d3ecaa; }
#dd-about p, #dd-about li { color: rgba(234,243,227,.88); }
#dd-about .lead { font-size: 19px; }
#dd-about a { color: #7bdb95; }
#dd-about ul { padding-left: 22px; }
#dd-about li { margin: 6px 0; }
#dd-about .row { display: flex; flex-wrap: wrap; gap: 10px; margin: 12px 0; padding: 0; list-style: none; }
#dd-about .row a { display: inline-block; padding: 9px 16px; border-radius: 999px; border: 1px solid rgba(123,219,149,.4); text-decoration: none; }
#dd-about .gp { display: inline-block; margin-top: 6px; padding: 12px 22px; border-radius: 12px; background: #7bdb95; color: #0c1d14; font-weight: 700; text-decoration: none; }
#dd-about h3 { font-size: 18px; margin: 20px 0 4px; color: #eaf3e3; }
#dd-about h3 + p { margin-top: 0; }
#dd-about footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid rgba(234,243,227,.15); font-size: 15px; display: flex; flex-wrap: wrap; gap: 8px 18px; }
#dd-top { position: fixed; right: 16px; bottom: calc(16px + env(safe-area-inset-bottom)); z-index: 3; padding: 12px 20px; border: 0; border-radius: 999px; background: #7bdb95; color: #0c1d14; font: 700 16px Outfit, system-ui, sans-serif; box-shadow: 0 6px 20px rgba(0,0,0,.45); cursor: pointer; opacity: 0; pointer-events: none; transition: opacity .2s; }
#dd-top.on { opacity: 1; pointer-events: auto; }
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
    .map((f) => `<h3>${f.q}</h3><p>${f.a}</p>`)
    .join('\n  ');
  const social = SOCIAL.map(([n, u]) => `<li><a href="${u}" rel="noopener" target="_blank">${n}</a></li>`).join('');
  return `<style>${CSS}</style>
<section id="dd-about" aria-labelledby="dd-about-h">
<div class="w">
  <h1 id="dd-about-h">DotDuel: a free two-player dot strategy game</h1>
  <p class="lead">Two players take turns colouring dots. Complete a line and you score its length. One move can finish several lines, but only the longest scores, and the rest are left for either player to claim. That one rule turns a pen-and-paper idea into a real duel of timing and nerve.</p>
  <p>DotDuel plays right here in your browser, on a phone, tablet or computer, with nothing to install and nothing to buy. It is also on <a href="${PLAY_STORE}" rel="noopener">Google Play</a> for Android.</p>

  <h2>How a game works</h2>
  <ul>
    <li>On your turn, colour any empty dot, or claim an unclaimed line.</li>
    <li>Whoever colours the last dot of a line scores it: one point per dot, no matter who coloured the others.</li>
    <li>Finish two or three lines with one dot and only the longest scores. The others become unclaimed lines, and either player can spend a later turn to take one.</li>
    <li>The game ends when every dot is coloured and every line is claimed. More points wins.</li>
  </ul>
  <p>The rules take two minutes. Pictures and examples are in the <a href="${SITE.en.paths.howToPlay}">full guide</a>.</p>

  <h2>Why it's different</h2>
  <p>DotDuel has the quick start of tic-tac-toe, the dot grid of Dots and Boxes and the no-luck tension of chess. Both players see the whole board, nothing is random, and a game takes only a few minutes. Grabbing every line you can is rarely the best plan: a move that completes two lines also leaves the second one for your opponent, and sometimes the strongest move is the quiet one that sets nothing up.</p>

  <h2>Ways to play</h2>
  <ul>
    <li><strong>Against bots:</strong> five levels, from a Beginner that moves at random to an Impossible bot that looks three moves ahead. Beat a level to unlock the next one and new board shapes.</li>
    <li><strong>With a friend on one device:</strong> pass the phone or share the screen, every shape open from the start.</li>
    <li><strong>Online ranked:</strong> sign in with Google, get matched with a player of similar rating and play on a chess clock (1, 3 or 5 minutes). Your Elo rating climbs the global leaderboard. Add friends and challenge them directly.</li>
    <li><strong>Daily puzzle:</strong> the same half-played board for everyone, a 3-minute clock, three attempts, and a daily leaderboard.</li>
  </ul>

  <h2>Three boards</h2>
  <p><strong>Triangle</strong> (36 dots, three line directions) is where everyone starts: clear and readable, ideal for learning to count lines. <strong>Square</strong> (49 dots) and <strong>Rectangle</strong> (63 dots) add columns, so every dot sits on four lines and single moves complete several at once far more often. The pool of unclaimed lines grows, and so does the tactics.</p>

  <h2>Painted worlds</h2>
  <p>Play in the calm Forest &amp; Pearl glade, around a winter campfire in the Christmas theme, or on a sandstone pyramid in Desert Sunset, each with its own art and sounds.</p>

  <h2>Get better</h2>
  <p>The <a href="${SITE.en.paths.strategy}">strategy guide</a> covers the ideas that separate a Beginner from an Impossible bot: counting every line through a dot, not leaving one-gap lines, and when to claim instead of placing. Quick answers are in the <a href="${SITE.en.paths.faq}">FAQ</a>, and every update is in the <a href="${SITE.en.paths.changelog}">changelog</a>.</p>

  <h2>Questions</h2>
  ${qa}
  <p>More answers in the <a href="${SITE.en.paths.faq}">full FAQ</a>.</p>

  <h2>Guide in your language</h2>
  <ul class="row">${guides}</ul>
  <p>The game itself speaks English, Lithuanian, Spanish, Portuguese, Polish and Czech.</p>

  <h2>Android app</h2>
  <p>Same game, same rating, on your home screen.</p>
  <a class="gp" href="${PLAY_STORE}" rel="noopener">Get it on Google Play</a>

  <h2>Community</h2>
  <p>Share a great game, find opponents or suggest an idea.</p>
  <ul class="row">${social}</ul>

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
  // Called by the game's "About DotDuel" link (menu footer).
  window.ddAbout = function () { document.getElementById('dd-about').scrollIntoView({ behavior: 'smooth' }); };
}());
</script>
`;
}
