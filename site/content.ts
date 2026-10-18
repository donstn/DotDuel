// Text of the static guide pages. English is the source; Lithuanian mirrors it.
// Changelog pages are generated from src/changelog.ts (see build-pages.ts).
import { diagrams } from './diagrams';
import type { Lang, PageInput } from './template';

type Content = Omit<PageInput, 'lang' | 'key'>;

const howToPlay: Record<Lang, Content> = {
  en: {
    title: 'DotDuel guide — how to play, rules, scoring and board shapes',
    description:
      'Learn DotDuel in two minutes: place dots, complete lines, score the longest one, and claim the lines left waiting. Rules, scoring examples and all board shapes.',
    h1: 'DotDuel guide: how to play',
    lead: 'Two players take turns colouring dots. Complete a line and you score its length. The rules take two minutes to learn; the tactics take a lot longer.',
    body: `
    <h2>The goal</h2>
    <p>Score more points than your opponent. Points come from <strong>lines</strong>: rows and diagonals of dots on the board. When every dot on a line has been coloured, the line is complete and is worth one point per dot.</p>

    <h2>Your turn</h2>
    <p>On each turn you do exactly one thing:</p>
    <ul>
      <li><strong>Place a dot</strong> on any empty spot, or</li>
      <li><strong>Claim a waiting line</strong> (more on that below).</li>
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
    <p>One dot can finish two or three lines at the same time. When that happens, you score <strong>only the longest</strong> of them. The others don't disappear: they become <strong>waiting lines</strong> (also called unclaimed or pending lines).</p>
    <p>Waiting lines belong to nobody yet. On any later turn, <strong>either player</strong> can spend their turn to claim one and score its full length. To claim a line, tap any coloured dot on it. If a dot sits on more than one waiting line, the longest one is claimed.</p>
    <div class="diagrams">
      ${diagrams.twoAtOnce('Green finishes a 3-dot row and a 2-dot diagonal with one dot. The row scores +3; the diagonal (dashed) is left waiting.')}
      ${diagrams.claim('On the next turn Cream taps a dot on the waiting diagonal and claims it: +2 for Cream.')}
    </div>
    <p class="note">This rule is what makes DotDuel more than a race. A move that completes two lines also hands your opponent the chance to grab the second one, so sometimes the stronger move is the quieter one.</p>

    <h2>The end of the game</h2>
    <p>The game ends when <strong>every dot is coloured and every waiting line has been claimed</strong>. If the dots run out while lines are still waiting, the remaining turns are claims only: players take turns claiming lines until none are left. The player with more points wins; equal points is a draw.</p>

    <h2>Board shapes</h2>
    <div class="table-wrap"><table>
      <tr><th>Shape</th><th>Dots</th><th>Line directions</th><th>Total points</th></tr>
      <tr><td>Triangle</td><td>36 (rows of 8 down to 1)</td><td>Rows and two diagonals</td><td>108</td></tr>
      <tr><td>Square</td><td>49 (7 × 7)</td><td>Rows, columns and both diagonals</td><td>196</td></tr>
      <tr><td>Rectangle</td><td>63 (7 × 9)</td><td>Rows, columns and both diagonals</td><td>252</td></tr>
    </table></div>
    <p>Square and Rectangle have four line directions instead of three, so single moves complete several lines far more often, and the waiting-line pool gets much bigger.</p>

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
  lt: {
    title: 'DotDuel vadovas – kaip žaisti, taisyklės, taškai ir lentų formos',
    description:
      'Išmokite DotDuel per dvi minutes: dėkite taškus, užbaikite linijas, gaukite taškus už ilgiausią ir paimkite laukiančias linijas. Taisyklės, pavyzdžiai ir visos lentų formos.',
    h1: 'DotDuel vadovas: kaip žaisti',
    lead: 'Du žaidėjai pakaitomis spalvina taškus. Užbaigus liniją gaunama tiek taškų, kiek ji ilga. Taisykles išmoksite per dvi minutes, o taktiką – kur kas ilgiau.',
    body: `
    <h2>Tikslas</h2>
    <p>Surinkti daugiau taškų nei varžovas. Taškai gaunami už <strong>linijas</strong> – lentos eiles ir įstrižaines. Kai visi linijos taškai nuspalvinti, linija užbaigta ir verta tiek taškų, kiek joje yra taškų.</p>

    <h2>Jūsų ėjimas</h2>
    <p>Per ėjimą atliekate lygiai vieną veiksmą:</p>
    <ul>
      <li><strong>padedate tašką</strong> bet kurioje tuščioje vietoje arba</li>
      <li><strong>paimate laukiančią liniją</strong> (apie tai – žemiau).</li>
    </ul>
    <p>Tada eina varžovas. Ėjimai visada keičiasi, net jei ką tik gavote taškų.</p>

    <h2>Linijos užbaigimas</h2>
    <p>Nesvarbu, kas nuspalvino kitus linijos taškus. Kas padeda <em>paskutinį</em> tašką, tas liniją užbaigia ir gauna visus jos taškus. 3 taškų linija verta 3 taškų, 8 taškų – 8.</p>
    <p>Kampiniai taškai turi savo atskirą vieno taško liniją, todėl pirmas nuspalvinęs kampą iškart gauna 1 tašką.</p>
    <div class="diagrams">
      ${diagrams.lineComplete('Žalias padeda paskutinį 3 taškų eilės tašką: +3, nors vieną tašką nuspalvino Kreminis.')}
      ${diagrams.corner('Apatinis kampas – vieno taško linija: nuspalvinus iškart +1.')}
    </div>

    <h2>Gudrybė: taškai skiriami tik už ilgiausią liniją</h2>
    <p>Vienas taškas gali užbaigti dvi ar tris linijas iš karto. Tada gaunate taškus <strong>tik už ilgiausią</strong>. Kitos linijos nedingsta – jos tampa <strong>laukiančiomis linijomis</strong> (dar vadinamomis nepaimtomis).</p>
    <p>Laukiančios linijos dar niekam nepriklauso. Bet kuriuo vėlesniu ėjimu <strong>bet kuris žaidėjas</strong> gali panaudoti savo ėjimą ir paimti vieną iš jų, gaudamas visus jos taškus. Norėdami paimti liniją, bakstelėkite bet kurį spalvotą jos tašką. Jei taškas yra keliose laukiančiose linijose, paimama ilgiausia.</p>
    <div class="diagrams">
      ${diagrams.twoAtOnce('Žalias vienu tašku užbaigia 3 taškų eilę ir 2 taškų įstrižainę. Už eilę +3, o įstrižainė (punktyrinė) lieka laukti.')}
      ${diagrams.claim('Kitu ėjimu Kreminis bakstelėja laukiančios įstrižainės tašką ir ją paima: +2 Kreminiam.')}
    </div>
    <p class="note">Būtent ši taisyklė DotDuel paverčia daugiau nei lenktynėmis. Ėjimas, užbaigiantis dvi linijas, kartu leidžia varžovui pasiimti antrąją, todėl kartais stipresnis ėjimas yra ramesnis.</p>

    <h2>Žaidimo pabaiga</h2>
    <p>Žaidimas baigiasi, kai <strong>visi taškai nuspalvinti ir visos laukiančios linijos paimtos</strong>. Jei taškai baigiasi, o linijų dar laukia, likę ėjimai – tik linijų ėmimas: žaidėjai pakaitomis ima linijas, kol neliks nė vienos. Laimi surinkęs daugiau taškų; vienodas rezultatas – lygiosios.</p>

    <h2>Lentų formos</h2>
    <div class="table-wrap"><table>
      <tr><th>Forma</th><th>Taškai</th><th>Linijų kryptys</th><th>Iš viso taškų</th></tr>
      <tr><td>Trikampis</td><td>36 (eilės nuo 8 iki 1)</td><td>Eilės ir dvi įstrižainės</td><td>108</td></tr>
      <tr><td>Kvadratas</td><td>49 (7 × 7)</td><td>Eilės, stulpeliai ir abi įstrižainės</td><td>196</td></tr>
      <tr><td>Stačiakampis</td><td>63 (7 × 9)</td><td>Eilės, stulpeliai ir abi įstrižainės</td><td>252</td></tr>
    </table></div>
    <p>Kvadratas ir stačiakampis turi keturias linijų kryptis vietoj trijų, todėl vienas ėjimas daug dažniau užbaigia kelias linijas, o laukiančių linijų būna kur kas daugiau.</p>

    <h2>Kaip galima žaisti</h2>
    <ul>
      <li><strong>Su botais</strong>: penki lygiai nuo Naujoko iki Neįmanomo. Įveikite lygį, kad atrakintumėte kitą; įveikite Lengvą ar sunkesnį lygį vienoje formoje, kad atrakintumėte kitą formą (Trikampis, tada Kvadratas, tada Stačiakampis).</li>
      <li><strong>Vietinis žaidimas</strong>: du žaidėjai viename telefone ar kompiuteryje, visos formos prieinamos iš karto.</li>
      <li><strong>Reitingo žaidimai internetu</strong>: prisijunkite su Google, gaukite panašaus reitingo varžovą ir žaiskite su šachmatų laikrodžiu (Bullet 1 min., Blitz 3 min. arba Rapid 5 min. kiekvienam). Pergalės ir pralaimėjimai keičia jūsų Elo reitingą bendroje lentelėje. Pridėkite draugų ir kvieskite juos žaisti.</li>
      <li><strong>Dienos galvosūkis</strong>: kasdien viena bendra, jau pradėta lenta visiems. Turite 3 minučių laikrodį ir iki trijų bandymų, o geriausias rezultatas patenka į dienos lentelę.</li>
    </ul>
    <p>Pasiruošę daugiau? Skaitykite <a href="/lt/strategija/">strategijos patarimus</a>.</p>
`,
  },
};

const strategy: Record<Lang, Content> = {
  en: {
    title: 'DotDuel strategy guide — tips from beginner to advanced',
    description:
      'Win more DotDuel games: avoid handing over lines, use waiting lines as spare moves, time your claims and plan the endgame. Strategy tips for every board shape.',
    h1: 'DotDuel strategy guide',
    lead: 'DotDuel has no luck: both players see the whole board, so every point is won or given away by a decision. These are the ideas that separate a Beginner bot from an Impossible one.',
    body: `
    <h2>1. Never leave a line one dot short</h2>
    <p>The most common beginner mistake is placing a dot that leaves a line with a single empty spot. Your opponent simply fills it and scores the whole line. Before every move, look at <strong>every</strong> line through the spot you're about to take, not just the one you're thinking about. On Triangle that's three lines per dot; on Square and Rectangle it's four.</p>

    <h2>2. Count what your move gives away</h2>
    <p>A good habit: for each candidate move, ask two questions. <em>What do I score now?</em> and <em>What is the best my opponent can score in reply?</em> A move worth 3 that sets up a 7 for your opponent loses you 4 points. The Hard bot plays exactly this way, and it's why it feels so much tougher than Medium.</p>

    <h2>3. A double completion can be a gift</h2>
    <p>When one dot finishes two lines, you score only the longer one and the shorter one goes into the shared pool of waiting lines, where your opponent can take it on their very next turn. Finishing a 6 and a 4 together nets you 6 but probably gives your opponent 4. Finishing them on separate turns, when you can, may get you both.</p>

    <h2>4. Waiting lines are spare moves</h2>
    <p>Claiming a waiting line uses your turn <strong>without placing a dot</strong>. That makes it a perfect waiting move. In the middle game you'll often reach a position where every empty spot would set up a line for your opponent. If there's a waiting line on the board, claim it instead: you score, the board doesn't change, and now your opponent has to make the risky move.</p>
    <p>That's also why grabbing every waiting line immediately isn't always best. A small line left in the pool can be worth more later, as the move that lets you avoid opening a big one.</p>

    <h2>5. Watch the long lines</h2>
    <p>Lines are worth their length, so the long ones decide games. On Triangle the top row is worth 8 and the long diagonals 7 or 8, while corners are worth 1. Keep track of how many empty spots are left on the longest lines, and try to be the player who takes the last one, not the second-to-last.</p>

    <h2>6. Plan the endgame</h2>
    <p>Once every dot is coloured, the game becomes claims only: players alternate taking waiting lines until none are left, and each player will naturally take the longest one available. Before you place the last few dots, count the waiting lines and their lengths. Whether the pool has an odd or even number of lines decides who gets the big ones, and a single tempo move earlier can flip it.</p>

    <h2>7. Each shape plays differently</h2>
    <ul>
      <li><strong>Triangle</strong>: three line directions and short lines near the bottom. Positions stay readable, which makes it the best shape for learning to count. Moving first or second matters here, which is why ranked games against bots flip a coin for the first move.</li>
      <li><strong>Square</strong>: four directions, including both diagonals. Single moves complete several lines much more often, so the waiting-line pool grows quickly and tip 4 becomes your main weapon.</li>
      <li><strong>Rectangle</strong>: the biggest board, with the longest games and the most waiting lines in the endgame. Patience and counting pay off most here.</li>
    </ul>

    <h2>8. Practise against the bots</h2>
    <div class="table-wrap"><table>
      <tr><th>Bot</th><th>How it plays</th><th>What it teaches</th></tr>
      <tr><td>Beginner</td><td>Random moves</td><td>The rules and how lines complete</td></tr>
      <tr><td>Easy</td><td>Takes corners and big obvious lines</td><td>Spotting free points</td></tr>
      <tr><td>Medium</td><td>Always takes the most points right now</td><td>Not leaving lines one dot short (tip 1)</td></tr>
      <tr><td>Hard</td><td>Weighs its gain against your best reply</td><td>Counting what a move gives away (tip 2)</td></tr>
      <tr><td>Impossible</td><td>Looks two moves ahead and values the waiting lines</td><td>Tempo, waiting lines and endgame parity (tips 4–6)</td></tr>
    </table></div>
    <p>Not sure about a rule? Go back to the <a href="/how-to-play/">guide</a>.</p>
`,
  },
  lt: {
    title: 'DotDuel strategija – patarimai nuo pradedančiųjų iki pažengusių',
    description:
      'Laimėkite dažniau: neatiduokite linijų, naudokite laukiančias linijas kaip atsarginius ėjimus, pasirinkite tinkamą metą jas paimti ir planuokite pabaigą. Patarimai visoms formoms.',
    h1: 'DotDuel strategija',
    lead: 'DotDuel nėra sėkmės: abu žaidėjai mato visą lentą, todėl kiekvienas taškas laimimas ar atiduodamas sprendimu. Štai idėjos, kurios skiria Naujoko botą nuo Neįmanomo.',
    body: `
    <h2>1. Niekada nepalikite linijos be vieno taško</h2>
    <p>Dažniausia pradedančiųjų klaida – padėti tašką taip, kad linijoje liktų viena tuščia vieta. Varžovas tiesiog ją užpildo ir gauna visus linijos taškus. Prieš kiekvieną ėjimą pažiūrėkite į <strong>visas</strong> linijas, einančias per vietą, kurią ketinate užimti, o ne tik į tą, apie kurią galvojate. Trikampyje tai trys linijos per tašką, kvadrate ir stačiakampyje – keturios.</p>

    <h2>2. Skaičiuokite, ką atiduodate</h2>
    <p>Naudingas įprotis: kiekvienam galimam ėjimui užduokite du klausimus. <em>Kiek gaunu dabar?</em> ir <em>Kiek daugiausia varžovas gali gauti atsakydamas?</em> Ėjimas už 3, paruošiantis varžovui 7, jums kainuoja 4 taškus. Būtent taip žaidžia Sunkus botas, todėl jis atrodo daug stipresnis už Vidutinį.</p>

    <h2>3. Dviguba linija gali būti dovana</h2>
    <p>Kai vienas taškas užbaigia dvi linijas, gaunate taškus tik už ilgesnę, o trumpesnė patenka į bendrą laukiančių linijų būrį, iš kurio varžovas gali ją pasiimti jau kitu ėjimu. Užbaigę 6 ir 4 kartu gausite 6, bet greičiausiai atiduosite varžovui 4. Užbaigę jas skirtingais ėjimais, jei pavyks, galite gauti abi.</p>

    <h2>4. Laukiančios linijos – atsarginiai ėjimai</h2>
    <p>Paimdami laukiančią liniją panaudojate ėjimą <strong>nepadėdami taško</strong>. Todėl tai puikus laukimo ėjimas. Žaidimo viduryje dažnai pasitaiko padėtis, kai bet kuri tuščia vieta paruoštų liniją varžovui. Jei lentoje yra laukiančių linijų, geriau paimkite vieną: gaunate taškų, lenta nesikeičia, o rizikingą ėjimą dabar turi daryti varžovas.</p>
    <p>Todėl ne visada geriausia iš karto griebti kiekvieną laukiančią liniją. Maža linija, palikta būryje, vėliau gali būti vertingesnė – kaip ėjimas, leidžiantis neatverti didelės.</p>

    <h2>5. Stebėkite ilgas linijas</h2>
    <p>Linija verta tiek, kiek ji ilga, todėl žaidimus lemia ilgosios. Trikampyje viršutinė eilė verta 8, ilgosios įstrižainės – 7 ar 8, o kampai – 1. Sekite, kiek tuščių vietų liko ilgiausiose linijose, ir stenkitės būti tas, kuris užima paskutinę, o ne priešpaskutinę.</p>

    <h2>6. Planuokite pabaigą</h2>
    <p>Kai visi taškai nuspalvinti, lieka tik linijų ėmimas: žaidėjai pakaitomis ima laukiančias linijas, kol neliks nė vienos, ir kiekvienas, žinoma, ima ilgiausią. Prieš padėdami paskutinius taškus suskaičiuokite laukiančias linijas ir jų ilgius. Ar jų lyginis, ar nelyginis skaičius, lemia, kam atiteks didžiosios, o vienas laukimo ėjimas anksčiau gali tai apversti.</p>

    <h2>7. Kiekviena forma žaidžiama kitaip</h2>
    <ul>
      <li><strong>Trikampis</strong>: trys linijų kryptys ir trumpos linijos apačioje. Padėtys lieka aiškios, todėl tai geriausia forma išmokti skaičiuoti. Čia svarbu, kas eina pirmas, todėl reitingo žaidimuose su botais pirmą ėjimą lemia burtai.</li>
      <li><strong>Kvadratas</strong>: keturios kryptys, įskaitant abi įstrižaines. Vienas ėjimas daug dažniau užbaigia kelias linijas, todėl laukiančių linijų greitai daugėja, o 4-asis patarimas tampa pagrindiniu ginklu.</li>
      <li><strong>Stačiakampis</strong>: didžiausia lenta, ilgiausi žaidimai ir daugiausia laukiančių linijų pabaigoje. Čia labiausiai atsiperka kantrybė ir skaičiavimas.</li>
    </ul>

    <h2>8. Treniruokitės su botais</h2>
    <div class="table-wrap"><table>
      <tr><th>Botas</th><th>Kaip žaidžia</th><th>Ko išmoko</th></tr>
      <tr><td>Naujokas</td><td>Atsitiktiniai ėjimai</td><td>Taisyklių ir kaip užbaigiamos linijos</td></tr>
      <tr><td>Lengvas</td><td>Ima kampus ir dideles akivaizdžias linijas</td><td>Pastebėti nemokamus taškus</td></tr>
      <tr><td>Vidutinis</td><td>Visada ima daugiausia taškų dabar</td><td>Nepalikti linijų be vieno taško (1 patarimas)</td></tr>
      <tr><td>Sunkus</td><td>Pasveria savo naudą prieš geriausią jūsų atsakymą</td><td>Skaičiuoti, ką ėjimas atiduoda (2 patarimas)</td></tr>
      <tr><td>Neįmanomas</td><td>Žiūri du ėjimus į priekį ir vertina laukiančias linijas</td><td>Laukimo ėjimų, laukiančių linijų ir pabaigos (4–6 patarimai)</td></tr>
    </table></div>
    <p>Neaiški taisyklė? Grįžkite į <a href="/lt/kaip-zaisti/">vadovą</a>.</p>
`,
  },
};

const about: Record<Lang, Content> = {
  en: {
    title: 'About DotDuel — a free two-player dot strategy game',
    description:
      'DotDuel is a free two-player strategy game for the browser and Android: play bots, a friend on one device, or ranked online. What it is, who makes it, and answers to common questions.',
    h1: 'About DotDuel',
    lead: 'DotDuel is a free, quick, two-player strategy game about colouring dots and completing lines, made by an independent developer.',
    body: `
    <h2>What it is</h2>
    <p>DotDuel takes the pen-and-paper feel of games like Dots and Boxes and tic-tac-toe and adds one rule that changes everything: when a move completes several lines at once, only the longest scores and the rest wait for whoever claims them first. Games last a few minutes, there's no luck involved, and the rules fit on one screen.</p>
    <p>You can play in any modern browser at <a href="/">www.dotduel.com</a>, with no download, and an Android app is on its way to Google Play.</p>

    <h2>What you can do</h2>
    <ul>
      <li>Learn against five bots, from a random-moving Beginner to an Impossible bot that looks two moves ahead.</li>
      <li>Play a friend on the same phone or computer (hot-seat).</li>
      <li>Sign in with Google for ranked online games on a chess clock, a global Elo leaderboard, friends and challenges.</li>
      <li>Try the daily puzzle: the same part-played board for everyone, with a daily leaderboard.</li>
      <li>Choose your language: English, Lithuanian, Spanish, Portuguese, Polish or Czech.</li>
    </ul>

    <h2>Frequently asked questions</h2>
    <h3>Is DotDuel free?</h3>
    <p>Yes. Every mode is free, with no purchases inside the game. The website and app show ads on menus and single-player screens to keep it free; ranked online games are ad-free.</p>
    <h3>Do I need an account?</h3>
    <p>No. Bots and hot-seat work without signing in, and your progress is saved on your device. You only need to sign in (with Google) for ranked online play, friends and the daily puzzle leaderboard.</p>
    <h3>How long does a game take?</h3>
    <p>Usually three to eight minutes. Ranked games use a chess clock of 1, 3 or 5 minutes per player.</p>
    <h3>How is it different from Dots and Boxes?</h3>
    <p>Same dot-grid feel, different scoring. DotDuel scores the length of completed lines instead of enclosed boxes, and the "longest line only, the rest wait" rule keeps the endgame tense instead of turning into a forced chain.</p>
    <h3>Is it like chess?</h3>
    <p>It borrows chess ideas: both players see everything, there's no luck, ranked games use chess clocks and Elo ratings. But you can learn the rules in two minutes and finish a game in less than ten.</p>
    <h3>What happens to my data?</h3>
    <p>Only what the game needs, and analytics or personalised ads only with your consent. The full details are in the <a href="/privacy.html">privacy policy</a>, including how to download or delete your account.</p>
    <h3>I found a bug or have an idea.</h3>
    <p>Write to <a href="mailto:donstn@gmail.com">donstn@gmail.com</a>. Recent changes are listed in the <a href="/changelog/">changelog</a>.</p>
`,
  },
  lt: {
    title: 'Apie DotDuel – nemokamas strateginis žaidimas dviem',
    description:
      'DotDuel – nemokamas strateginis žaidimas dviem naršyklėje ir Android: žaiskite su botais, su draugu viename įrenginyje ar reitingo žaidimus internetu. Kas tai, kas jį kuria ir atsakymai į dažnus klausimus.',
    h1: 'Apie DotDuel',
    lead: 'DotDuel – nemokamas, greitas strateginis žaidimas dviem apie taškų spalvinimą ir linijų užbaigimą, sukurtas nepriklausomo kūrėjo.',
    body: `
    <h2>Kas tai</h2>
    <p>DotDuel perima popierinių žaidimų, tokių kaip „Taškai ir langeliai“ ar kryžiukai-nuliukai, pojūtį ir prideda vieną viską keičiančią taisyklę: kai ėjimas užbaigia kelias linijas iš karto, taškai skiriami tik už ilgiausią, o kitos laukia to, kas jas paims pirmas. Žaidimas trunka kelias minutes, sėkmės jame nėra, o taisyklės telpa viename ekrane.</p>
    <p>Žaisti galite bet kurioje šiuolaikinėje naršyklėje adresu <a href="/">www.dotduel.com</a> nieko nesisiuntę, o Android programėlė netrukus pasirodys Google Play.</p>

    <h2>Ką galite veikti</h2>
    <ul>
      <li>Mokytis su penkiais botais – nuo atsitiktinai žaidžiančio Naujoko iki Neįmanomo, kuris žiūri du ėjimus į priekį.</li>
      <li>Žaisti su draugu tame pačiame telefone ar kompiuteryje.</li>
      <li>Prisijungus su Google žaisti reitingo žaidimus internetu su šachmatų laikrodžiu, kilti bendroje Elo lentelėje, turėti draugų ir juos kviesti.</li>
      <li>Spręsti dienos galvosūkį: ta pati pradėta lenta visiems ir dienos rezultatų lentelė.</li>
      <li>Pasirinkti kalbą: lietuvių, anglų, ispanų, portugalų, lenkų ar čekų.</li>
    </ul>

    <h2>Dažni klausimai</h2>
    <h3>Ar DotDuel nemokamas?</h3>
    <p>Taip. Visi režimai nemokami, žaidime nėra jokių pirkinių. Svetainė ir programėlė rodo reklamas meniu ir vieno žaidėjo ekranuose, kad žaidimas liktų nemokamas; reitingo žaidimai internetu be reklamų.</p>
    <h3>Ar reikia paskyros?</h3>
    <p>Ne. Botai ir žaidimas dviese viename įrenginyje veikia neprisijungus, o pažanga išsaugoma jūsų įrenginyje. Prisijungti (su Google) reikia tik reitingo žaidimams internetu, draugams ir dienos galvosūkio lentelei.</p>
    <h3>Kiek trunka žaidimas?</h3>
    <p>Dažniausiai nuo trijų iki aštuonių minučių. Reitingo žaidimuose naudojamas šachmatų laikrodis – 1, 3 arba 5 minutės kiekvienam žaidėjui.</p>
    <h3>Kuo jis skiriasi nuo „Taškų ir langelių“?</h3>
    <p>Panašus taškų tinklelis, bet kitokie taškai. DotDuel skaičiuoja užbaigtų linijų ilgį, o ne uždarytus langelius, o taisyklė „taškai tik už ilgiausią, kitos laukia“ išlaiko pabaigą įtemptą.</p>
    <h3>Ar tai panašu į šachmatus?</h3>
    <p>Šachmatų idėjų yra: abu žaidėjai mato viską, sėkmės nėra, reitingo žaidimuose naudojami šachmatų laikrodžiai ir Elo reitingas. Tačiau taisykles išmoksite per dvi minutes, o žaidimą baigsite greičiau nei per dešimt.</p>
    <h3>Kas vyksta su mano duomenimis?</h3>
    <p>Renkama tik tai, ko reikia žaidimui, o analitika ar asmeninės reklamos – tik su jūsų sutikimu. Visa informacija, įskaitant kaip atsisiųsti ar ištrinti paskyrą, yra <a href="/privacy.html">privatumo politikoje</a>.</p>
    <h3>Radau klaidą arba turiu idėją.</h3>
    <p>Rašykite <a href="mailto:donstn@gmail.com">donstn@gmail.com</a>. Naujausi pakeitimai surašyti <a href="/lt/naujienos/">naujienose</a>.</p>
`,
  },
};

export const CONTENT = { howToPlay, strategy, about };

export const CHANGELOG_TEXT: Record<Lang, Omit<Content, 'body'>> = {
  en: {
    title: 'DotDuel changelog — what’s new',
    description: 'Every DotDuel update: new features, changes and fixes, newest first.',
    h1: 'What’s new in DotDuel',
    lead: 'Every update, newest first. The same list is in the game: tap the version number at the bottom of the screen.',
  },
  lt: {
    title: 'DotDuel naujienos – kas pasikeitė',
    description: 'Visi DotDuel atnaujinimai: naujos funkcijos, pakeitimai ir pataisymai, naujausi viršuje.',
    h1: 'DotDuel naujienos',
    lead: 'Visi atnaujinimai, naujausi viršuje. Tas pats sąrašas yra ir žaidime: bakstelėkite versijos numerį ekrano apačioje.',
  },
};
