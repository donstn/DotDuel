// DotDuel website text — Czech.
// Same shape in every language (site/langs/types.ts); diagrams from site/diagrams.ts.
import { diagrams } from '../diagrams';
import type { SiteText } from './types';

export const cs: SiteText = {
  paths: { howToPlay: '/cs/jak-hrat/', strategy: '/cs/strategie/', faq: '/cs/caste-dotazy/', about: '/cs/o-hre/', changelog: '/cs/novinky/' },
  nav: { howToPlay: 'Průvodce', strategy: 'Strategie', faq: 'Dotazy', about: 'O hře', changelog: 'Novinky', play: 'Hrát teď', privacy: 'Soukromí' },
  howToPlay: {
    title: 'Jak hrát DotDuel — pravidla, bodování a tvary desek',
    description:
      'Nauč se DotDuel za dvě minuty: vybarvuj tečky, dokončuj linie, boduj tu nejdelší a zabírej nezabrané linie. Pravidla, příklady bodování a všechny tvary desek.',
    h1: 'Průvodce DotDuel: jak hrát',
    lead: 'Dva hráči se střídají ve vybarvování teček. Dokončíš linii a získáš tolik bodů, kolik je její délka. Pravidla se naučíš za dvě minuty, taktiku mnohem déle.',
    body: `
    <h2>Cíl hry</h2>
    <p>Získej více bodů než soupeř. Body přinášejí <strong>linie</strong>: řady a úhlopříčky teček na desce. Když jsou vybarvené všechny tečky linie, je linie dokončená a má hodnotu jednoho bodu za každou tečku.</p>

    <h2>Tvůj tah</h2>
    <p>V každém tahu uděláš právě jednu věc:</p>
    <ul>
      <li><strong>Vybarvíš tečku</strong> na libovolném volném místě, nebo</li>
      <li><strong>zabereš nezabranou linii</strong> (více o tom níže).</li>
    </ul>
    <p>Pak je na tahu soupeř. Tahy se vždy střídají, i když získáš body.</p>

    <h2>Dokončení linie</h2>
    <p>Nezáleží na tom, kdo vybarvil ostatní tečky linie. Kdo vybarví <em>poslední</em> tečku, linii dokončí a získá body za celou její délku. Linie ze 3 teček má hodnotu 3 bodů, linie z 8 teček 8 bodů.</p>
    <p>Rohové tečky leží na vlastní linii dlouhé jen jednu tečku, takže kdo první vybarví roh, okamžitě získá 1 bod.</p>
    <div class="diagrams">
      ${diagrams.lineComplete('Zelený vybarví poslední tečku řady ze 3 teček: +3, i když jednu z teček vybarvil Krémový.')}
      ${diagrams.corner('Spodní roh je linie z 1 tečky: jeho vybarvení hned přinese +1.')}
    </div>

    <h2>Háček: boduje jen nejdelší linie</h2>
    <p>Jedna tečka může dokončit dvě nebo tři linie najednou. V takovém případě získáš body <strong>jen za nejdelší</strong> z nich. Ostatní nezmizí: stanou se z nich <strong>nezabrané linie</strong>.</p>
    <p>Nezabrané linie zatím nikomu nepatří. V kterémkoli dalším tahu může <strong>kterýkoli z hráčů</strong> použít svůj tah na to, aby jednu zabral a získal body za celou její délku. Linii zabereš klepnutím na kteroukoli její vybarvenou tečku. Pokud tečka leží na více nezabraných liniích, zabere se ta nejdelší.</p>
    <div class="diagrams">
      ${diagrams.twoAtOnce('Zelený jednou tečkou dokončí řadu ze 3 teček a úhlopříčku ze 2 teček. Řada přinese +3, úhlopříčka (přerušovaná) zůstane nezabraná.')}
      ${diagrams.claim('V dalším tahu Krémový klepne na tečku nezabrané úhlopříčky a zabere ji: +2 pro Krémového.')}
    </div>
    <p class="note">Právě díky tomuto pravidlu je DotDuel víc než jen závod. Tah, který dokončí dvě linie, zároveň dává soupeři šanci sebrat tu druhou, a tak je silnějším tahem někdy ten nenápadnější.</p>

    <h2>Konec hry</h2>
    <p>Hra končí, když je <strong>každá tečka vybarvená a každá linie zabraná</strong>. Pokud dojdou tečky a některé linie jsou ještě nezabrané, zbývající tahy jsou už jen zabírání: hráči se střídají v zabírání linií, dokud žádná nezbude. Vyhrává hráč s více body; při shodném počtu bodů je to remíza.</p>

    <h2>Tvary desek</h2>
    <div class="table-wrap"><table>
      <tr><th>Tvar</th><th>Tečky</th><th>Směry linií</th><th>Bodů celkem</th></tr>
      <tr><td>Trojúhelník</td><td>36 (řady od 8 do 1)</td><td>Řady a dvě úhlopříčky</td><td>108</td></tr>
      <tr><td>Čtverec</td><td>49 (7 × 7)</td><td>Řady, sloupce a obě úhlopříčky</td><td>196</td></tr>
      <tr><td>Obdélník</td><td>63 (7 × 9)</td><td>Řady, sloupce a obě úhlopříčky</td><td>252</td></tr>
    </table></div>
    <p>Čtverec a Obdélník mají místo tří směrů linií čtyři, takže jediný tah dokončí několik linií mnohem častěji a nezabraných linií je mnohem víc.</p>

    <h2>Jak můžeš hrát</h2>
    <ul>
      <li><strong>Proti botům</strong>: pět úrovní, od Začátečnické po Nemožnou. Poraz úroveň a odemkneš další; poraz na daném tvaru úroveň Snadná nebo vyšší a odemkneš další tvar (Trojúhelník, pak Čtverec, pak Obdélník).</li>
      <li><strong>Místní hra</strong>: dva hráči na jednom telefonu nebo počítači, všechny tvary dostupné hned od začátku.</li>
      <li><strong>Online hodnocená hra</strong>: přihlas se přes Google, hra ti najde soupeře s podobným hodnocením a hrajete na šachové hodiny (Kulka 1 minuta, Blesk 3 minuty nebo Rapid 5 minut na hráče). Výhry a prohry mění tvé hodnocení Elo ve světovém žebříčku. Přidej si přátele a vyzvi je přímo.</li>
      <li><strong>Denní hádanka</strong>: každý den jedna společná deska pro všechny, už částečně rozehraná. Máš časový limit 3 minuty a až tři pokusy a tvůj nejlepší výsledek se zapíše do denního žebříčku.</li>
    </ul>
    <p>Chceš se posunout dál? Přečti si <a href="/cs/strategie/">průvodce strategií</a>.</p>
`,
  },
  strategy: {
    title: 'Strategie DotDuel — tipy pro začátečníky i pokročilé',
    description:
      'Vyhrávej v DotDuel častěji: nedávej linie zadarmo, ber nezabrané linie jako tahy navíc, načasuj zabírání a naplánuj závěr. Tipy pro každý tvar desky.',
    h1: 'Průvodce strategií DotDuel',
    lead: 'V DotDuel nerozhoduje náhoda: oba hráči vidí celou desku, takže každý bod se získá nebo ztratí rozhodnutím. Tyhle myšlenky odlišují Začátečnického bota od Nemožného.',
    body: `
    <h2>1. Nikdy nenechávej linii, které chybí jediná tečka</h2>
    <p>Nejčastější chyba začátečníků je vybarvit tečku tak, že na nějaké linii zůstane jediné volné místo. Soupeř ho prostě vyplní a získá body za celou linii. Před každým tahem se podívej na <strong>všechny</strong> linie, které procházejí místem, kam chceš táhnout, ne jen na tu, na kterou právě myslíš. Na Trojúhelníku jsou to tři linie na tečku, na Čtverci a Obdélníku čtyři.</p>

    <h2>2. Počítej, co svým tahem daruješ</h2>
    <p>Dobrý zvyk: u každého zvažovaného tahu si polož dvě otázky. <em>Kolik teď získám?</em> a <em>Kolik nejvíc může soupeř získat v odpověď?</em> Tah za 3 body, který soupeři připraví linii za 7, tě stojí 4 body. Přesně takhle hraje bot na úrovni Těžká, a proto působí o tolik silněji než Střední.</p>

    <h2>3. Dvojité dokončení může být dárek</h2>
    <p>Když jedna tečka dokončí dvě linie, získáš body jen za delší z nich a kratší jde do společné zásoby nezabraných linií, odkud si ji soupeř může vzít hned v příštím tahu. Dokončíš-li najednou linii za 6 a za 4, získáš 6, ale soupeři nejspíš daruješ 4. Pokud se ti podaří dokončit je v různých tazích, můžeš získat obě.</p>

    <h2>4. Nezabrané linie jsou tahy navíc</h2>
    <p>Zabráním nezabrané linie využiješ tah <strong>bez vybarvení tečky</strong>. Je to proto ideální vyčkávací tah. Ve střední fázi hry se často dostaneš do pozice, kdy by každé volné místo připravilo linii soupeři. Pokud je na desce nezabraná linie, zaber raději ji: získáš body, deska se nezmění a riskantní tah teď musí udělat soupeř.</p>
    <p>Proto také není vždy nejlepší brát každou nezabranou linii hned. Malá linie ponechaná v zásobě může mít později větší cenu jako tah, díky kterému nemusíš otevřít velkou.</p>

    <h2>5. Hlídej dlouhé linie</h2>
    <p>Linie mají hodnotu podle své délky, takže hry rozhodují ty dlouhé. Na Trojúhelníku má horní řada hodnotu 8 a dlouhé úhlopříčky 7 nebo 8, zatímco rohy jen 1. Sleduj, kolik volných míst zbývá na nejdelších liniích, a snaž se být tím hráčem, který vybarví poslední tečku, ne předposlední.</p>

    <h2>6. Naplánuj závěr hry</h2>
    <p>Jakmile jsou všechny tečky vybarvené, hra se změní na pouhé zabírání: hráči se střídají v zabírání nezabraných linií, dokud žádná nezbude, a každý si přirozeně vezme tu nejdelší dostupnou. Než vybarvíš posledních pár teček, spočítej nezabrané linie a jejich délky. Zda je jich v zásobě lichý, nebo sudý počet, rozhoduje o tom, kdo dostane ty velké, a jediný vyčkávací tah o něco dříve to může otočit.</p>

    <h2>7. Každý tvar se hraje jinak</h2>
    <ul>
      <li><strong>Trojúhelník</strong>: tři směry linií a krátké linie u spodního okraje. Pozice zůstávají přehledné, a proto je to nejlepší tvar, na kterém se naučit počítat. Na nejvyšší úrovni nehraje roli, kdo táhne první: v 1 000 hrách mezi dvěma Nemožnými boty vyhrála každá strana zhruba 45 % a zbytek skončil remízou.</li>
      <li><strong>Čtverec</strong>: čtyři směry včetně obou úhlopříček. Jediný tah dokončí několik linií mnohem častěji, takže nezabraných linií rychle přibývá a tip 4 se stává tvou hlavní zbraní.</li>
      <li><strong>Obdélník</strong>: největší deska s nejdelšími hrami a nejvíce nezabranými liniemi v závěru. Trpělivost a počítání se tu vyplácejí nejvíc.</li>
    </ul>

    <h2>8. Trénuj proti botům</h2>
    <div class="table-wrap"><table>
      <tr><th>Bot</th><th>Jak hraje</th><th>Co tě naučí</th></tr>
      <tr><td>Začátečnická</td><td>Náhodné tahy</td><td>Pravidla a jak se linie dokončují</td></tr>
      <tr><td>Snadná</td><td>Bere rohy a velké zjevné linie</td><td>Všímat si bodů zdarma</td></tr>
      <tr><td>Střední</td><td>Vždy bere nejvíc bodů hned teď</td><td>Nenechávat linie, kterým chybí jediná tečka (tip 1)</td></tr>
      <tr><td>Těžká</td><td>Porovnává svůj zisk s tvou nejlepší odpovědí</td><td>Počítat, co tah daruje soupeři (tip 2)</td></tr>
      <tr><td>Nemožná</td><td>Dívá se o tři tahy dopředu a cení si nezabraných linií</td><td>Vyčkávací tahy, nezabrané linie a paritu v závěru (tipy 4–6)</td></tr>
    </table></div>
    <p>Něco v pravidlech ti není jasné? Vrať se do <a href="/cs/jak-hrat/">průvodce</a>.</p>
`,
  },
  faq: {
    title: 'Časté dotazy o DotDuel — hra s tečkami pro dva zdarma: pravidla, režimy, online',
    description:
      'Je DotDuel zdarma? Potřebuješ účet? Jak se liší od hry Tečky a čtverce? Hra s kamarádem i bez něj, online žebříček, denní hádanka a další.',
    h1: 'DotDuel: časté dotazy',
    lead: 'Rychlé odpovědi o hře, jejích režimech a hraní online. Začínáš s DotDuel? <a href="/cs/jak-hrat/">Průvodce</a> ti vysvětlí pravidla za dvě minuty.',
    body: `
    <h2>Co je DotDuel?</h2>
    <p>Bezplatná strategická hra pro dva hráče. Střídáte se ve vybarvování teček na desce; dokončíš linii a získáš tolik bodů, kolik je její délka. Jeden tah může dokončit několik linií, ale boduje jen ta nejdelší a ostatní se stanou nezabranými liniemi, které si může vzít kterýkoli hráč.</p>

    <h2>Je DotDuel zdarma?</h2>
    <p>Ano. Hraje se v jakémkoli prohlížeči na <a href="/">www.dotduel.com</a> a na Androidu přes Google Play. Pro hraní celé hry si nemusíš nic kupovat.</p>

    <h2>Musím něco instalovat nebo si zakládat účet?</h2>
    <p>Ne. Proti botům nebo s kamarádem na stejném zařízení můžeš hrát hned. Přihlášení přes Google potřebuješ jen pro online hodnocené hry, přátele a denní žebříček.</p>

    <h2>Je DotDuel podobný hře Tečky a čtverce (Dots and Boxes)?</h2>
    <p>Mají společné tečky, ale hrají se jinak. V DotDuel vybarvuješ samotné tečky, linie vedou po řadách a úhlopříčkách a boduje jen nejdelší dokončená linie, takže taktika stojí na načasování, ne na řetězcích čtverců.</p>

    <h2>Je to jako šachy?</h2>
    <p>Přebírá některé šachové myšlenky: oba hráči vidí všechno, nerozhoduje náhoda a hodnocené hry používají šachové hodiny a hodnocení Elo. Pravidla se ale naučíš za dvě minuty a hru dohraješ za méně než deset.</p>

    <h2>Můžu hrát s kamarádem?</h2>
    <p>Ano: na jednom telefonu nebo počítači (místní hra), nebo online. Přidej si ho mezi přátele a vyzvi ho přímo.</p>

    <h2>Dá se hrát i bez druhého hráče?</h2>
    <p>Ano, proti botovi. Ten má pět úrovní, od Začátečnické po Nemožnou. Když porazíš jednu úroveň, odemkneš další, a postupně se odemykají i nové tvary desek.</p>

    <h2>Má první hráč výhodu?</h2>
    <p>Ne. V 1 000 hrách mezi našimi dvěma nejsilnějšími boty vyhrála každá strana zhruba ve 45 % případů a zbytek skončil remízou.</p>

    <h2>Jak dlouho trvá jedna hra?</h2>
    <p>Hra na Trojúhelníku trvá pár minut. Online hodnocené hry se hrají na šachové hodiny: 1, 3 nebo 5 minut na hráče.</p>

    <h2>Jak funguje online hodnocení?</h2>
    <p>Hra ti najde soupeře s podobným hodnocením. Výhry a prohry mění tvé hodnocení Elo ve světovém žebříčku.</p>

    <h2>Co je denní hádanka?</h2>
    <p>Každý den jedna společná, napůl rozehraná deska pro všechny. Máš časový limit 3 minuty a tři pokusy; tvůj nejlepší výsledek se zapíše do denního žebříčku.</p>

    <h2>Co jsou nezabrané linie?</h2>
    <p>Když jedna tečka dokončí několik linií, boduje jen ta nejdelší. Ostatní čekají jako nezabrané linie a kterýkoli hráč může použít svůj tah na to, aby jednu zabral a získal body za celou její délku. <a href="/cs/jak-hrat/">Průvodce</a> to ukazuje na obrázcích.</p>

    <h2>Jak hra končí?</h2>
    <p>Když je každá tečka vybarvená a každá linie zabraná. Vyhrává hráč s více body; při shodném počtu bodů je to remíza.</p>

    <h2>Jaké jazyky DotDuel podporuje?</h2>
    <p>Angličtinu, litevštinu, španělštinu, portugalštinu, polštinu a češtinu.</p>

    <h2>Ukládá se můj postup?</h2>
    <p>Postup proti botům se ukládá ve tvém zařízení. Tvé online hodnocení, přátelé a statistiky se ukládají k tvému přihlášení přes Google.</p>

    <h2>Co se děje s mými daty?</h2>
    <p>Jen to, co hra potřebuje, a analytika nebo personalizované reklamy jen s tvým souhlasem. Všechny podrobnosti, včetně toho, jak si stáhnout nebo smazat účet, najdeš v <a href="/privacy.html">zásadách ochrany soukromí</a>.</p>

    <h2>Chci nahlásit chybu nebo poslat nápad.</h2>
    <p>Napiš na <a href="mailto:donstn@gmail.com">donstn@gmail.com</a>. Nedávné změny najdeš v <a href="/cs/novinky/">novinkách</a>.</p>

    <p>Chceš vyhrávat častěji? Přečti si <a href="/cs/strategie/">průvodce strategií</a>.</p>
`,
  },
  about: {
    title: 'O hře DotDuel — strategická hra s tečkami pro dva zdarma',
    description:
      'Bezplatná strategická hra pro dva v prohlížeči i na Androidu: boti, kamarád na jednom zařízení nebo hodnocené hry online. Co to je, kdo ji tvoří a časté dotazy.',
    h1: 'O hře DotDuel',
    lead: 'DotDuel je bezplatná a rychlá strategická hra pro dva hráče o vybarvování teček a dokončování linií od nezávislého vývojáře.',
    body: `
    <h2>Co to je</h2>
    <p>DotDuel přebírá atmosféru her s papírem a tužkou, jako jsou Tečky a čtverce (Dots and Boxes) nebo piškvorky, a přidává jedno pravidlo, které mění všechno: když tah dokončí několik linií najednou, boduje jen ta nejdelší a ostatní se stanou nezabranými liniemi, které může kterýkoli hráč zabrat v pozdějším tahu. Hry trvají pár minut, nerozhoduje náhoda a pravidla se vejdou na jednu obrazovku.</p>
    <p>Hrát můžeš v jakémkoli moderním prohlížeči na <a href="/">www.dotduel.com</a>, bez stahování. Na Google Play je DotDuel také jako aplikace pro Android.</p>

    <h2>Co můžeš dělat</h2>
    <ul>
      <li>Uč se proti pěti botům, od Začátečnické úrovně s náhodnými tahy po Nemožnou, která se dívá o tři tahy dopředu.</li>
      <li>Hraj s kamarádem na stejném telefonu nebo počítači (místní hra).</li>
      <li>Přihlas se přes Google a hraj online hodnocené hry na šachové hodiny, se světovým žebříčkem Elo, přáteli a výzvami.</li>
      <li>Zkus denní hádanku: stejnou částečně rozehranou desku pro všechny s denním žebříčkem.</li>
      <li>Vyber si jazyk: angličtinu, litevštinu, španělštinu, portugalštinu, polštinu nebo češtinu.</li>
    </ul>

    <p>Máš otázky? Podívej se na <a href="/cs/caste-dotazy/">časté dotazy</a>.</p>

`,
  },
  changelog: {
    title: 'Novinky v DotDuel — historie změn',
    description: 'Všechny aktualizace DotDuel: nové funkce, změny a opravy, od nejnovějších.',
    h1: 'Co je nového v DotDuel',
    lead: 'Všechny aktualizace, od nejnovějších. Stejný seznam najdeš i ve hře: klepni na číslo verze dole na obrazovce.',
  },
};
