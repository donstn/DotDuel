// DotDuel website text — Lithuanian.
// Same shape in every language (site/langs/types.ts); diagrams from site/diagrams.ts.
import { diagrams } from '../diagrams';
import type { SiteText } from './types';

export const lt: SiteText = {
  paths: { howToPlay: '/lt/kaip-zaisti/', strategy: '/lt/strategija/', faq: '/lt/duk/', about: '/lt/apie/', changelog: '/lt/naujienos/' },
  nav: { howToPlay: 'Vadovas', strategy: 'Strategija', faq: 'DUK', about: 'Apie', changelog: 'Naujienos', play: 'Žaisti', privacy: 'Privatumas' },
  howToPlay: {
    title: 'DotDuel vadovas – kaip žaisti, taisyklės, taškai ir lentų formos',
    description:
      'Išmokite DotDuel per dvi minutes: dėkite taškus, užbaikite linijas, gaukite taškus už ilgiausią ir paimkite nepaimtas linijas. Taisyklės, pavyzdžiai ir visos lentų formos.',
    h1: 'DotDuel vadovas: kaip žaisti',
    lead: 'Du žaidėjai pakaitomis spalvina taškus. Užbaigus liniją gaunama tiek taškų, kiek ji ilga. Taisykles išmoksite per dvi minutes, o taktiką – kur kas ilgiau.',
    body: `
    <h2>Tikslas</h2>
    <p>Surinkti daugiau taškų nei varžovas. Taškai gaunami už <strong>linijas</strong> – lentos eiles ir įstrižaines. Kai visi linijos taškai nuspalvinti, linija užbaigta ir verta tiek taškų, kiek joje yra taškų.</p>

    <h2>Jūsų ėjimas</h2>
    <p>Per ėjimą atliekate lygiai vieną veiksmą:</p>
    <ul>
      <li><strong>padedate tašką</strong> bet kurioje tuščioje vietoje arba</li>
      <li><strong>paimate nepaimtą liniją</strong> (apie tai – žemiau).</li>
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
    <p>Vienas taškas gali užbaigti dvi ar tris linijas iš karto. Tada gaunate taškus <strong>tik už ilgiausią</strong>. Kitos linijos nedingsta – jos tampa <strong>nepaimtomis linijomis</strong> (dar vadinamomis nepaimtomis).</p>
    <p>Nepaimtos linijos dar niekam nepriklauso. Bet kuriuo vėlesniu ėjimu <strong>bet kuris žaidėjas</strong> gali panaudoti savo ėjimą ir paimti vieną iš jų, gaudamas visus jos taškus. Norėdami paimti liniją, bakstelėkite bet kurį spalvotą jos tašką. Jei taškas yra keliose nepaimtose linijose, paimama ilgiausia.</p>
    <div class="diagrams">
      ${diagrams.twoAtOnce('Žalias vienu tašku užbaigia 3 taškų eilę ir 2 taškų įstrižainę. Už eilę +3, o įstrižainė (punktyrinė) lieka laukti.')}
      ${diagrams.claim('Kitu ėjimu Kreminis bakstelėja nepaimtos įstrižainės tašką ir ją paima: +2 Kreminiam.')}
    </div>
    <p class="note">Būtent ši taisyklė DotDuel paverčia daugiau nei lenktynėmis. Ėjimas, užbaigiantis dvi linijas, kartu leidžia varžovui pasiimti antrąją, todėl kartais stipresnis ėjimas yra ramesnis.</p>

    <h2>Žaidimo pabaiga</h2>
    <p>Žaidimas baigiasi, kai <strong>visi taškai nuspalvinti ir visos linijos paimtos</strong>. Jei taškai baigiasi, o dar yra nepaimtų linijų, likę ėjimai – tik linijų ėmimas: žaidėjai pakaitomis ima linijas, kol neliks nė vienos. Laimi surinkęs daugiau taškų; vienodas rezultatas – lygiosios.</p>

    <h2>Lentų formos</h2>
    <div class="table-wrap"><table>
      <tr><th>Forma</th><th>Taškai</th><th>Linijų kryptys</th><th>Iš viso taškų</th></tr>
      <tr><td>Trikampis</td><td>36 (eilės nuo 8 iki 1)</td><td>Eilės ir dvi įstrižainės</td><td>108</td></tr>
      <tr><td>Kvadratas</td><td>49 (7 × 7)</td><td>Eilės, stulpeliai ir abi įstrižainės</td><td>196</td></tr>
      <tr><td>Stačiakampis</td><td>63 (7 × 9)</td><td>Eilės, stulpeliai ir abi įstrižainės</td><td>252</td></tr>
    </table></div>
    <p>Kvadratas ir stačiakampis turi keturias linijų kryptis vietoj trijų, todėl vienas ėjimas daug dažniau užbaigia kelias linijas, o nepaimtų linijų būna kur kas daugiau.</p>

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
  strategy: {
    title: 'DotDuel strategija – patarimai nuo pradedančiųjų iki pažengusių',
    description:
      'Laimėkite dažniau: neatiduokite linijų, naudokite nepaimtas linijas kaip atsarginius ėjimus, pasirinkite tinkamą metą jas paimti ir planuokite pabaigą. Patarimai visoms formoms.',
    h1: 'DotDuel strategija',
    lead: 'DotDuel nėra sėkmės: abu žaidėjai mato visą lentą, todėl kiekvienas taškas laimimas ar atiduodamas sprendimu. Štai idėjos, kurios skiria Naujoko botą nuo Neįmanomo.',
    body: `
    <h2>1. Niekada nepalikite linijos be vieno taško</h2>
    <p>Dažniausia pradedančiųjų klaida – padėti tašką taip, kad linijoje liktų viena tuščia vieta. Varžovas tiesiog ją užpildo ir gauna visus linijos taškus. Prieš kiekvieną ėjimą pažiūrėkite į <strong>visas</strong> linijas, einančias per vietą, kurią ketinate užimti, o ne tik į tą, apie kurią galvojate. Trikampyje tai trys linijos per tašką, kvadrate ir stačiakampyje – keturios.</p>

    <h2>2. Skaičiuokite, ką atiduodate</h2>
    <p>Naudingas įprotis: kiekvienam galimam ėjimui užduokite du klausimus. <em>Kiek gaunu dabar?</em> ir <em>Kiek daugiausia varžovas gali gauti atsakydamas?</em> Ėjimas už 3, paruošiantis varžovui 7, jums kainuoja 4 taškus. Būtent taip žaidžia Sunkus botas, todėl jis atrodo daug stipresnis už Vidutinį.</p>

    <h2>3. Dviguba linija gali būti dovana</h2>
    <p>Kai vienas taškas užbaigia dvi linijas, gaunate taškus tik už ilgesnę, o trumpesnė patenka į bendrą nepaimtų linijų būrį, iš kurio varžovas gali ją pasiimti jau kitu ėjimu. Užbaigę 6 ir 4 kartu gausite 6, bet greičiausiai atiduosite varžovui 4. Užbaigę jas skirtingais ėjimais, jei pavyks, galite gauti abi.</p>

    <h2>4. Nepaimtos linijos – atsarginiai ėjimai</h2>
    <p>Paimdami nepaimtą liniją panaudojate ėjimą <strong>nepadėdami taško</strong>. Todėl tai puikus laukimo ėjimas. Žaidimo viduryje dažnai pasitaiko padėtis, kai bet kuri tuščia vieta paruoštų liniją varžovui. Jei lentoje yra nepaimtų linijų, geriau paimkite vieną: gaunate taškų, lenta nesikeičia, o rizikingą ėjimą dabar turi daryti varžovas.</p>
    <p>Todėl ne visada geriausia iš karto griebti kiekvieną nepaimtą liniją. Maža linija, palikta būryje, vėliau gali būti vertingesnė – kaip ėjimas, leidžiantis neatverti didelės.</p>

    <h2>5. Stebėkite ilgas linijas</h2>
    <p>Linija verta tiek, kiek ji ilga, todėl žaidimus lemia ilgosios. Trikampyje viršutinė eilė verta 8, ilgosios įstrižainės – 7 ar 8, o kampai – 1. Sekite, kiek tuščių vietų liko ilgiausiose linijose, ir stenkitės būti tas, kuris užima paskutinę, o ne priešpaskutinę.</p>

    <h2>6. Planuokite pabaigą</h2>
    <p>Kai visi taškai nuspalvinti, lieka tik linijų ėmimas: žaidėjai pakaitomis ima nepaimtas linijas, kol neliks nė vienos, ir kiekvienas, žinoma, ima ilgiausią. Prieš padėdami paskutinius taškus suskaičiuokite nepaimtas linijas ir jų ilgius. Ar jų lyginis, ar nelyginis skaičius, lemia, kam atiteks didžiosios, o vienas laukimo ėjimas anksčiau gali tai apversti.</p>

    <h2>7. Kiekviena forma žaidžiama kitaip</h2>
    <ul>
      <li><strong>Trikampis</strong>: trys linijų kryptys ir trumpos linijos apačioje. Padėtys lieka aiškios, todėl tai geriausia forma išmokti skaičiuoti. Aukščiausiu lygiu nesvarbu, kas eina pirmas: per 1 000 žaidimų tarp dviejų Neįmanomų botų kiekviena pusė laimėjo maždaug 45 %, likę – lygiosios.</li>
      <li><strong>Kvadratas</strong>: keturios kryptys, įskaitant abi įstrižaines. Vienas ėjimas daug dažniau užbaigia kelias linijas, todėl nepaimtų linijų greitai daugėja, o 4-asis patarimas tampa pagrindiniu ginklu.</li>
      <li><strong>Stačiakampis</strong>: didžiausia lenta, ilgiausi žaidimai ir daugiausia nepaimtų linijų pabaigoje. Čia labiausiai atsiperka kantrybė ir skaičiavimas.</li>
    </ul>

    <h2>8. Treniruokitės su botais</h2>
    <div class="table-wrap"><table>
      <tr><th>Botas</th><th>Kaip žaidžia</th><th>Ko išmoko</th></tr>
      <tr><td>Naujokas</td><td>Atsitiktiniai ėjimai</td><td>Taisyklių ir kaip užbaigiamos linijos</td></tr>
      <tr><td>Lengvas</td><td>Ima kampus ir dideles akivaizdžias linijas</td><td>Pastebėti nemokamus taškus</td></tr>
      <tr><td>Vidutinis</td><td>Visada ima daugiausia taškų dabar</td><td>Nepalikti linijų be vieno taško (1 patarimas)</td></tr>
      <tr><td>Sunkus</td><td>Pasveria savo naudą prieš geriausią jūsų atsakymą</td><td>Skaičiuoti, ką ėjimas atiduoda (2 patarimas)</td></tr>
      <tr><td>Neįmanomas</td><td>Žiūri tris ėjimus į priekį ir vertina nepaimtas linijas</td><td>Laukimo ėjimų, nepaimtų linijų ir pabaigos (4–6 patarimai)</td></tr>
    </table></div>
    <p>Neaiški taisyklė? Grįžkite į <a href="/lt/kaip-zaisti/">vadovą</a>.</p>
`,
  },
  faq: {
    title: 'DotDuel DUK – nemokamas strateginis taškų žaidimas dviem: taisyklės ir režimai',
    description:
      'DUK apie DotDuel – nemokamą strateginį taškų žaidimą dviem: paskyra, skirtumai nuo „Taškų ir langelių“, su draugu ar vienam, reitingas, dienos galvosūkis.',
    h1: 'DotDuel: dažniausiai užduodami klausimai',
    lead: 'Trumpi atsakymai apie žaidimą, jo režimus ir žaidimą internetu. Pirmą kartą žaidžiate DotDuel? <a href="/lt/kaip-zaisti/">Vadovas</a> taisykles paaiškins per dvi minutes.',
    body: `
    <h2>Kas yra DotDuel?</h2>
    <p>Nemokamas strateginis žaidimas dviem. Žaidėjai pakaitomis spalvina taškus lentoje; užbaigę liniją, gaunate tiek taškų, kiek ji ilga. Vienas ėjimas gali užbaigti kelias linijas, bet taškai skiriami tik už ilgiausią, o kitos tampa nepaimtomis linijomis, kurias gali paimti bet kuris žaidėjas.</p>

    <h2>Ar DotDuel nemokamas?</h2>
    <p>Taip. Žaisti galima bet kurioje naršyklėje adresu <a href="/">www.dotduel.com</a> ir Android įrenginyje per Google Play. Kad žaistumėte visą žaidimą, nieko pirkti nereikia.</p>

    <h2>Ar reikia ką nors įdiegti ar susikurti paskyrą?</h2>
    <p>Ne. Su botais ar su draugu tame pačiame įrenginyje galite žaisti iš karto. Prisijungti su Google reikia tik reitingo žaidimams internetu, draugams ir dienos rezultatų lentelei.</p>

    <h2>Ar DotDuel panašus į „Taškus ir langelius“?</h2>
    <p>Taškai yra abiejuose, bet žaidžiama kitaip. DotDuel spalvinate pačius taškus, linijos eina eilėmis ir įstrižainėmis, o taškai skiriami tik už ilgiausią užbaigtą liniją, todėl taktika remiasi tinkamu laiku, o ne langelių grandinėmis.</p>

    <h2>Ar jis panašus į šachmatus?</h2>
    <p>Iš šachmatų perimta keletas idėjų: abu žaidėjai mato viską, sėkmės nėra, o reitingo žaidimuose naudojamas šachmatų laikrodis ir Elo reitingas. Tačiau taisykles išmoksite per dvi minutes, o žaidimą sužaisite greičiau nei per dešimt.</p>

    <h2>Ar galiu žaisti su draugu?</h2>
    <p>Taip: viename telefone ar kompiuteryje (vietinis žaidimas) arba internetu. Pridėkite jį prie draugų ir pakvieskite žaisti tiesiogiai.</p>

    <h2>Ar galima žaisti vienam?</h2>
    <p>Taip. Yra penki botų lygiai – nuo Naujoko iki Neįmanomo. Įveikę lygį atrakinsite kitą, o žaidžiant atsirakina ir naujos lentų formos.</p>

    <h2>Ar pirmas žaidėjas turi pranašumą?</h2>
    <p>Ne. Per 1 000 žaidimų tarp dviejų mūsų stipriausių botų kiekviena pusė laimėjo maždaug 45 % žaidimų, likę baigėsi lygiosiomis.</p>

    <h2>Kiek trunka žaidimas?</h2>
    <p>Žaidimas Trikampyje trunka kelias minutes. Reitingo žaidimuose internetu naudojamas šachmatų laikrodis: 1, 3 arba 5 minutės kiekvienam žaidėjui.</p>

    <h2>Kaip veikia reitingas internetu?</h2>
    <p>Jums parenkamas panašaus reitingo varžovas. Pergalės ir pralaimėjimai keičia jūsų Elo reitingą bendroje lentelėje.</p>

    <h2>Kas yra dienos galvosūkis?</h2>
    <p>Kasdien viena bendra, jau pradėta lenta visiems. Turite 3 minučių laikrodį ir tris bandymus, o geriausias rezultatas patenka į dienos lentelę.</p>

    <h2>Kas yra nepaimtos linijos?</h2>
    <p>Kai vienas taškas užbaigia kelias linijas, taškai skiriami tik už ilgiausią. Kitos lieka laukti kaip nepaimtos linijos, ir bet kuris žaidėjas gali panaudoti savo ėjimą, kad paimtų vieną iš jų ir gautų visus jos taškus. <a href="/lt/kaip-zaisti/">Vadove</a> tai parodyta paveikslėliais.</p>

    <h2>Kaip baigiasi žaidimas?</h2>
    <p>Kai visi taškai nuspalvinti ir visos linijos paimtos. Laimi surinkęs daugiau taškų; vienodas rezultatas – lygiosios.</p>

    <h2>Kokiomis kalbomis galima žaisti DotDuel?</h2>
    <p>Anglų, lietuvių, ispanų, portugalų, lenkų ir čekų.</p>

    <h2>Ar mano pažanga išsaugoma?</h2>
    <p>Pažanga žaidžiant su botais saugoma jūsų įrenginyje. Reitingas internetu, draugai ir statistika išsaugomi ir susieti su jūsų Google paskyra.</p>

    <h2>Kas nutinka mano duomenims?</h2>
    <p>Renkama tik tai, ko reikia žaidimui, o analitika ar suasmeninta reklama – tik jums sutikus. Visa informacija pateikta <a href="/privacy.html">privatumo politikoje</a>, taip pat ir tai, kaip atsisiųsti savo paskyros duomenis ar ją ištrinti.</p>

    <h2>Radau klaidą arba turiu idėją.</h2>
    <p>Rašykite adresu <a href="mailto:donstn@gmail.com">donstn@gmail.com</a>. Naujausi pakeitimai surašyti <a href="/lt/naujienos/">naujienose</a>.</p>

    <p>Norite laimėti dažniau? Skaitykite <a href="/lt/strategija/">strategijos patarimus</a>.</p>
`,
  },
  about: {
    title: 'Apie DotDuel – nemokamas strateginis žaidimas dviem',
    description:
      'DotDuel – nemokamas strateginis žaidimas dviem naršyklėje ir Android: žaiskite su botais, su draugu viename įrenginyje ar reitingo žaidimus internetu. Kas tai, kas jį kuria ir atsakymai į dažnus klausimus.',
    h1: 'Apie DotDuel',
    lead: 'DotDuel – nemokamas, greitas strateginis žaidimas dviem apie taškų spalvinimą ir linijų užbaigimą, sukurtas nepriklausomo kūrėjo.',
    body: `
    <h2>Kas tai</h2>
    <p>DotDuel perima popierinių žaidimų, tokių kaip „Taškai ir langeliai“ ar kryžiukai-nuliukai, pojūtį ir prideda vieną viską keičiančią taisyklę: kai ėjimas užbaigia kelias linijas iš karto, taškai skiriami tik už ilgiausią, o kitos tampa nepaimtomis linijomis, kurias vėliau gali paimti bet kuris žaidėjas. Žaidimas trunka kelias minutes, sėkmės jame nėra, o taisyklės telpa viename ekrane.</p>
    <p>Žaisti galite bet kurioje šiuolaikinėje naršyklėje adresu <a href="/">www.dotduel.com</a> nieko nesisiuntę. Taip pat jį rasite Google Play kaip Android programėlę.</p>

    <h2>Ką galite veikti</h2>
    <ul>
      <li>Mokytis su penkiais botais – nuo atsitiktinai žaidžiančio Naujoko iki Neįmanomo, kuris žiūri tris ėjimus į priekį.</li>
      <li>Žaisti su draugu tame pačiame telefone ar kompiuteryje.</li>
      <li>Prisijungus su Google žaisti reitingo žaidimus internetu su šachmatų laikrodžiu, kilti bendroje Elo lentelėje, turėti draugų ir juos kviesti.</li>
      <li>Spręsti dienos galvosūkį: ta pati pradėta lenta visiems ir dienos rezultatų lentelė.</li>
      <li>Pasirinkti kalbą: lietuvių, anglų, ispanų, portugalų, lenkų ar čekų.</li>
    </ul>

    <p>Turite klausimų? Žr. <a href="/lt/duk/">DUK</a>.</p>

`,
  },
  changelog: {
    title: 'DotDuel naujienos – kas pasikeitė',
    description: 'Visi DotDuel atnaujinimai: naujos funkcijos, pakeitimai ir pataisymai, naujausi viršuje.',
    h1: 'DotDuel naujienos',
    lead: 'Visi atnaujinimai, naujausi viršuje. Tas pats sąrašas yra ir žaidime: bakstelėkite versijos numerį ekrano apačioje.',
  },
};
