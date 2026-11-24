// DotDuel website text — English (source of truth).
// Same shape in every language (site/langs/types.ts); diagrams from site/diagrams.ts.
import { diagrams } from '../diagrams';
import type { SiteText } from './types';

export const en: SiteText = {
  paths: { howToPlay: '/how-to-play/', strategy: '/strategy/', faq: '/faq/', about: '/about/', changelog: '/changelog/' },
  nav: { howToPlay: 'Guide', strategy: 'Strategy', faq: 'FAQ', about: 'About', changelog: 'Changelog', play: 'Play now', privacy: 'Privacy' },
  howToPlay: {
    title: 'DotDuel guide — how to play, rules, scoring and board shapes',
    description:
      'Learn DotDuel in two minutes: place dots, complete lines, score the longest one, and claim the unclaimed lines. Rules, scoring examples and all board shapes.',
    h1: 'DotDuel guide: how to play',
    lead: 'Two players take turns colouring dots. Complete a line and you score its length. The rules take two minutes to learn; the tactics take a lot longer.',
    body: `
    <h2>The goal</h2>
    <p>Score more points than your opponent. Points come from <strong>lines</strong>: rows and diagonals of dots on the board. When every dot on a line has been coloured, the line is complete and is worth one point per dot.</p>

    <h2>Your turn</h2>
    <p>On each turn you do exactly one thing:</p>
    <ul>
      <li><strong>Place a dot</strong> on any empty spot, or</li>
      <li><strong>Claim an unclaimed line</strong> (more on that below).</li>
    </ul>
    <p>Then it's your opponent's turn. Turns always alternate, even after you score.</p>

    <h2>Completing a line</h2>
    <p>It doesn't matter who coloured the other dots on a line. Whoever places the <em>last</em> dot completes it and scores its full length. A line of 3 dots is worth 3 points, a line of 8 dots is worth 8.</p>
    <p>Corner dots sit on a line of their own that is just one dot long, so the first player to colour a corner scores 1 point straight away.</p>
    <div class="diagrams">
      ${diagrams.lineComplete('Green places the last dot of a 3-dot row: +3, even though Cream coloured one of the dots.')}
      ${diagrams.corner('The bottom corner is a 1-dot line: colouring it scores +1 at once.')}
    </div>

    <h2>The twist: only the longest line scores</h2>
    <p>One dot can finish two or three lines at the same time. When that happens, you score <strong>only the longest</strong> of them. The others don't disappear: they become <strong>unclaimed lines</strong>.</p>
    <p>Unclaimed lines belong to nobody yet. On any later turn, <strong>either player</strong> can spend their turn to claim one and score its full length. To claim a line, tap any coloured dot on it. If a dot sits on more than one unclaimed line, the longest one is claimed.</p>
    <div class="diagrams">
      ${diagrams.twoAtOnce('Green finishes a 3-dot row and a 2-dot diagonal with one dot. The row scores +3; the diagonal (dashed) is left unclaimed.')}
      ${diagrams.claim('On the next turn Cream taps a dot on the unclaimed diagonal and claims it: +2 for Cream.')}
    </div>
    <p class="note">This rule is what makes DotDuel more than a race. A move that completes two lines also hands your opponent the chance to grab the second one, so sometimes the stronger move is the quieter one.</p>

    <h2>The end of the game</h2>
    <p>The game ends when <strong>every dot is coloured and every line has been claimed</strong>. If the dots run out while lines are still unclaimed, the remaining turns are claims only: players take turns claiming lines until none are left. The player with more points wins; equal points is a draw.</p>

    <h2>Board shapes</h2>
    <div class="table-wrap"><table>
      <tr><th>Shape</th><th>Dots</th><th>Line directions</th><th>Total points</th></tr>
      <tr><td>Triangle</td><td>36 (rows of 8 down to 1)</td><td>Rows and two diagonals</td><td>108</td></tr>
      <tr><td>Square</td><td>49 (7 × 7)</td><td>Rows, columns and both diagonals</td><td>196</td></tr>
      <tr><td>Rectangle</td><td>63 (7 × 9)</td><td>Rows, columns and both diagonals</td><td>252</td></tr>
    </table></div>
    <p>Square and Rectangle have four line directions instead of three, so single moves complete several lines far more often, and the pool of unclaimed lines gets much bigger.</p>

    <h2>Ways to play</h2>
    <ul>
      <li><strong>Against bots</strong>: five levels, from Beginner to Impossible. Beat a level to unlock the next one; beat Easy or harder on a shape to unlock the next shape (Triangle, then Square, then Rectangle).</li>
      <li><strong>Hot-seat</strong>: two players on one phone or computer, every shape available from the start.</li>
      <li><strong>Online ranked</strong>: sign in with Google, get matched with a player of similar rating and play on a chess clock (Bullet 1 minute, Blitz 3 minutes or Rapid 5 minutes per player). Wins and losses move your Elo rating on the global leaderboard. Add friends and challenge them directly.</li>
      <li><strong>Daily puzzle</strong>: one shared board for everyone each day, already part-played. You get a 3-minute clock and up to three attempts, and your best score goes on the daily leaderboard.</li>
    </ul>
    <p>Ready for the next step? Read the <a href="/strategy/">strategy guide</a>.</p>
`,
  },
  strategy: {
    title: 'DotDuel strategy guide — tips from beginner to advanced',
    description:
      'Win more DotDuel games: avoid handing over lines, use unclaimed lines as spare moves, time your claims and plan the endgame. Strategy tips for every board shape.',
    h1: 'DotDuel strategy guide',
    lead: 'DotDuel has no luck: both players see the whole board, so every point is won or given away by a decision. These are the ideas that separate a Beginner bot from an Impossible one.',
    body: `
    <h2>1. Never leave a line one dot short</h2>
    <p>The most common beginner mistake is placing a dot that leaves a line with a single empty spot. Your opponent simply fills it and scores the whole line. Before every move, look at <strong>every</strong> line through the spot you're about to take, not just the one you're thinking about. On Triangle that's three lines per dot; on Square and Rectangle it's four.</p>

    <h2>2. Count what your move gives away</h2>
    <p>A good habit: for each candidate move, ask two questions. <em>What do I score now?</em> and <em>What is the best my opponent can score in reply?</em> A move worth 3 that sets up a 7 for your opponent loses you 4 points. The Hard bot plays exactly this way, and it's why it feels so much tougher than Medium.</p>

    <h2>3. A double completion can be a gift</h2>
    <p>When one dot finishes two lines, you score only the longer one and the shorter one goes into the shared pool of unclaimed lines, where your opponent can take it on their very next turn. Finishing a 6 and a 4 together nets you 6 but probably gives your opponent 4. Finishing them on separate turns, when you can, may get you both.</p>

    <h2>4. Unclaimed lines are spare moves</h2>
    <p>Taking an unclaimed line uses your turn <strong>without placing a dot</strong>. That makes it a perfect waiting move. In the middle game you'll often reach a position where every empty spot would set up a line for your opponent. If there's an unclaimed line on the board, claim it instead: you score, the board doesn't change, and now your opponent has to make the risky move.</p>
    <p>That's also why grabbing every unclaimed line immediately isn't always best. A small line left in the pool can be worth more later, as the move that lets you avoid opening a big one.</p>

    <h2>5. Watch the long lines</h2>
    <p>Lines are worth their length, so the long ones decide games. On Triangle the top row is worth 8 and the long diagonals 7 or 8, while corners are worth 1. Keep track of how many empty spots are left on the longest lines, and try to be the player who takes the last one, not the second-to-last.</p>

    <h2>6. Plan the endgame</h2>
    <p>Once every dot is coloured, the game becomes claims only: players alternate taking unclaimed lines until none are left, and each player will naturally take the longest one available. Before you place the last few dots, count the unclaimed lines and their lengths. Whether the pool has an odd or even number of lines decides who gets the big ones, and a single tempo move earlier can flip it.</p>

    <h2>7. Each shape plays differently</h2>
    <ul>
      <li><strong>Triangle</strong>: three line directions and short lines near the bottom. Positions stay readable, which makes it the best shape for learning to count. Moving first or second makes no real difference at the top level: in 1,000 games between two Impossible bots, each side won about 45% and the rest were draws.</li>
      <li><strong>Square</strong>: four directions, including both diagonals. Single moves complete several lines much more often, so the pool of unclaimed lines grows quickly and tip 4 becomes your main weapon.</li>
      <li><strong>Rectangle</strong>: the biggest board, with the longest games and the most unclaimed lines in the endgame. Patience and counting pay off most here.</li>
    </ul>

    <h2>8. Practise against the bots</h2>
    <div class="table-wrap"><table>
      <tr><th>Bot</th><th>How it plays</th><th>What it teaches</th></tr>
      <tr><td>Beginner</td><td>Random moves</td><td>The rules and how lines complete</td></tr>
      <tr><td>Easy</td><td>Takes corners and big obvious lines</td><td>Spotting free points</td></tr>
      <tr><td>Medium</td><td>Always takes the most points right now</td><td>Not leaving lines one dot short (tip 1)</td></tr>
      <tr><td>Hard</td><td>Weighs its gain against your best reply</td><td>Counting what a move gives away (tip 2)</td></tr>
      <tr><td>Impossible</td><td>Looks three moves ahead and values unclaimed lines</td><td>Tempo, unclaimed lines and endgame parity (tips 4–6)</td></tr>
    </table></div>
    <p>Not sure about a rule? Go back to the <a href="/how-to-play/">guide</a>.</p>
`,
  },
  faq: {
    title: 'DotDuel FAQ — free two-player dot game: rules, modes and online play',
    description:
      'Answers about DotDuel: is it free, do you need an account, how it differs from Dots and Boxes, playing with a friend or alone, online ranking, the daily puzzle and more.',
    h1: 'DotDuel: frequently asked questions',
    lead: 'Quick answers about the game, its modes and online play. New to DotDuel? The <a href="/how-to-play/">guide</a> explains the rules in two minutes.',
    body: `
    <h2>What is DotDuel?</h2>
    <p>A free strategy game for two players. You take turns colouring dots on a board; complete a line and you score its length. One move can finish several lines, but only the longest scores, and the rest become unclaimed lines either player can take.</p>

    <h2>Is DotDuel free?</h2>
    <p>Yes. It plays in any browser at <a href="/">www.dotduel.com</a> and on Android via Google Play. There is nothing to buy to play the full game.</p>

    <h2>Do I need to install anything or create an account?</h2>
    <p>No. Play against bots or a friend on the same device straight away. A Google sign-in is only needed for online ranked games, friends and the daily leaderboard.</p>

    <h2>Is DotDuel like Dots and Boxes?</h2>
    <p>They share the dots, but play differently. In DotDuel you colour the dots themselves, lines run along rows and diagonals, and only the longest completed line scores, so the tactics are about timing, not chains of boxes.</p>

    <h2>Is it like chess?</h2>
    <p>It borrows chess ideas: both players see everything, there is no luck, and ranked games use chess clocks and Elo ratings. But you can learn the rules in two minutes and finish a game in less than ten.</p>

    <h2>Can I play with a friend?</h2>
    <p>Yes: on one phone or computer (hot-seat), or online. Add them as a friend and challenge them directly.</p>

    <h2>Can I play alone?</h2>
    <p>Yes. There are five bot levels, from Beginner to Impossible. Beating a level unlocks the next, and new board shapes unlock as you go.</p>

    <h2>Does the first player have an advantage?</h2>
    <p>No. In 1,000 games between our two strongest bots, each side won about 45% of the time and the rest were draws.</p>

    <h2>How long does a game take?</h2>
    <p>A Triangle game takes a few minutes. Online ranked games use a chess clock: 1, 3 or 5 minutes per player.</p>

    <h2>How does online ranking work?</h2>
    <p>You are matched with a player of similar rating. Wins and losses change your Elo rating on the global leaderboard.</p>

    <h2>What is the daily puzzle?</h2>
    <p>One shared, half-played board for everyone each day. You get a 3-minute clock and three attempts; your best score goes on the daily leaderboard.</p>

    <h2>What are unclaimed lines?</h2>
    <p>When one dot completes several lines, only the longest scores. The others wait as unclaimed lines, and either player can spend a turn to claim one for its full length. The <a href="/how-to-play/">guide</a> shows it with pictures.</p>

    <h2>How does a game end?</h2>
    <p>When every dot is coloured and every line has been claimed. More points wins; equal points is a draw.</p>

    <h2>Which languages does DotDuel support?</h2>
    <p>English, Lithuanian, Spanish, Portuguese, Polish and Czech.</p>

    <h2>Is my progress saved?</h2>
    <p>Progress against bots is saved on your device. Your online rating, friends and stats are saved to your Google sign-in.</p>

    <h2>What happens to my data?</h2>
    <p>Only what the game needs, and analytics or personalised ads only with your consent. The full details are in the <a href="/privacy.html">privacy policy</a>, including how to download or delete your account.</p>

    <h2>I found a bug or have an idea.</h2>
    <p>Write to <a href="mailto:donstn@gmail.com">donstn@gmail.com</a>. Recent changes are listed in the <a href="/changelog/">changelog</a>.</p>

    <p>Want to win more? Read the <a href="/strategy/">strategy guide</a>.</p>
`,
  },
  about: {
    title: 'About DotDuel — a free two-player dot strategy game',
    description:
      'DotDuel is a free two-player strategy game for the browser and Android: play bots, a friend on one device, or ranked online. What it is, who makes it, and answers to common questions.',
    h1: 'About DotDuel',
    lead: 'DotDuel is a free, quick, two-player strategy game about colouring dots and completing lines, made by an independent developer.',
    body: `
    <h2>What it is</h2>
    <p>DotDuel takes the pen-and-paper feel of games like Dots and Boxes and tic-tac-toe and adds one rule that changes everything: when a move completes several lines at once, only the longest scores, and the rest become unclaimed lines that either player can claim on a later turn. Games last a few minutes, there's no luck involved, and the rules fit on one screen.</p>
    <p>You can play in any modern browser at <a href="/">www.dotduel.com</a>, with no download. It is also on Google Play as an Android app.</p>

    <h2>What you can do</h2>
    <ul>
      <li>Learn against five bots, from a random-moving Beginner to an Impossible bot that looks three moves ahead.</li>
      <li>Play a friend on the same phone or computer (hot-seat).</li>
      <li>Sign in with Google for ranked online games on a chess clock, a global Elo leaderboard, friends and challenges.</li>
      <li>Try the daily puzzle: the same part-played board for everyone, with a daily leaderboard.</li>
      <li>Choose your language: English, Lithuanian, Spanish, Portuguese, Polish or Czech.</li>
    </ul>

    <p>Questions? See the <a href="/faq/">FAQ</a>.</p>

`,
  },
  changelog: {
    title: 'DotDuel changelog — what’s new',
    description: 'Every DotDuel update: new features, changes and fixes, newest first.',
    h1: 'What’s new in DotDuel',
    lead: 'Every update, newest first. The same list is in the game: tap the version number at the bottom of the screen.',
  },
};
