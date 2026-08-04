/**
 * Lithuanian (Lietuvių). Must satisfy `Messages` (the shape derived from en.ts),
 * so it can never drift out of sync — a missing/renamed key is a build error.
 *
 * DRAFT pending review: translated for meaning and grammar, not word-for-word.
 * Counts use `plural()` because Lithuanian noun forms depend on the last digit
 * (1 → singular, 2–9 → plural nominative, 0 & 11–19 → plural genitive).
 */
import type { Messages } from './en';

/** Pick the Lithuanian form for a count: one (1,21…), few (2–9,22–29…), many (0,10–20…). */
function plural(n: number, one: string, few: string, many: string): string {
  const d = n % 10;
  const dd = n % 100;
  if (d === 1 && dd !== 11) return one;
  if (d >= 2 && d <= 9 && (dd < 11 || dd > 19)) return few;
  return many;
}

const pts = (n: number) => `${n} ${plural(n, 'taškas', 'taškai', 'taškų')}`;
const bandymai = (n: number) => plural(n, 'bandymas', 'bandymai', 'bandymų');

export const lt: Messages = {
  common: {
    back: 'Atgal',
    cancel: 'Atšaukti',
    close: 'Uždaryti',
    locked: 'Užrakinta',
    signInToView: 'Prisijunkite, kad pamatytumėte.',
    signInToPlay: 'Prisijunkite, kad žaistumėte.',
    w: 'P',
    d: 'L',
    l: 'Pr',
    you: 'Jūs',
  },

  lang: {
    label: 'Kalba',
    english: 'English',
    lithuanian: 'Lietuvių',
  },

  shapes: {
    triangle: 'Trikampis',
    square: 'Kvadratas',
    rectangle: 'Stačiakampis',
    rhombus: 'Rombas',
  },

  difficulty: {
    1: 'Naujokas',
    2: 'Lengvas',
    3: 'Vidutinis',
    4: 'Sunkus',
    5: 'Neįmanomas',
  },

  menu: {
    tagline:
      'Paeiliui dėliokite taškus; užbaigę liniją gausite taškų pagal jos ilgį. Nuspalvinę visą lentą, laimi tas, kuris surinko daugiausia taškų.',
    welcomeLead: 'Sveiki,',

    changeTheme: 'Keisti spalvų temą',

    profile: 'Profilis',
    signOut: 'Atsijungti',
    signIn: 'Prisijungti',
    shareDotDuel: 'Dalintis „DotDuel“',

    singlePlayer: 'Vienas žaidėjas',
    singlePlayerSub: 'Botai ir dienos galvosūkis.',
    multiplayer: 'Keli žaidėjai',
    multiplayerSub: 'Vietinis ir reitingų žaidimas internete.',
    rankings: 'Reitingai',
    rankingsSub: 'Galvosūkių, vietiniai ir reitingų sąrašai.',

    bots: 'Botai',
    botsSub: 'Penki lygiai – nuo švelnaus iki negailestingo.',

    hotseat: 'Vietinis žaidimas',
    hotseatSub: '1 įrenginys · 2 žaidėjai.',

    puzzleRankings: 'Galvosūkių reitingai',
    puzzleRankingsSub: 'Šiandienos geriausi galvosūkio rezultatai.',
    localRankings: 'Vietiniai reitingai',
    localRankingsSub: 'Jūsų rezultatai šiame įrenginyje.',
    ratedRankings: 'Reitingų lentelė',
    ratedRankingsSub: 'Pasaulinis internetinis Elo lyderių sąrašas.',
    achievements: 'Pasiekimai',
    achievementsSub: 'Ženkleliai, kuriuos pelnėte žaisdami.',

    dailyPuzzle: 'Dienos galvosūkis',
    dailyDoneSub: (best: number) => `✓ Atlikta · rekordas ${best} · atsinaujina vidurnaktį (UTC)`,
    dailyDoneTitle: 'Išnaudoti visi 3 bandymai. Užsukite rytoj.',
    dailyAttemptSub: (attempt: number, max: number, best: number) =>
      `Bandymas ${attempt}/${max} · rekordas ${best}`,
    dailyFreshSub: (max: number) => `${max} ${bandymai(max)} · 3 min · laimi geriausias rezultatas.`,
    dailySignInTitle: 'Prisijunkite, kad žaistumėte šiandienos galvosūkį',

    onlineRanked: 'Reitingų žaidimas internetu',
    onlineFindMatch: 'Rasti reitinguojamą varžovą.',
    onlineSignInTitle: 'Prisijunkite, kad žaistumėte internetu',
    onlineUnreachable: 'Serveris nepasiekiamas – jūsų tinklas gali jį blokuoti.',
    onlineUnreachableTitle:
      'Jūsų tinklas blokuoja žaidimo serverį (greičiausiai reklamų/sekiklių blokatorius arba DNS filtras)',
    onlineLocked: 'Aktyvu kitame skirtuke/įrenginyje – užbaikite arba uždarykite ten.',
    onlineLockedTitle: 'Turite atvirą kelių žaidėjų sesiją kitame skirtuke ar įrenginyje',

    chooseShape: 'Pasirinkite figūrą',
    chooseDifficulty: 'Pasirinkite sudėtingumą',
    dots: (n: number) => pts(n),
    level: (d: number) => `Lygis ${d}`,
    shapeLockedTitle: 'Įveikite ankstesnę figūrą Sunkiu lygiu, kad atrakintumėte',

    whosPlaying: 'Kas žaidžia?',
    vsBot: (shape: string, difficulty: string) => `${shape} · prieš botą · ${difficulty}`,
    hotseatHint: (shape: string) => `${shape} · prieš pradedant patvirtinkite arba pakeiskite vardus`,
    yourNameFirst: 'Jūsų vardas — žaidžia pirmas',
    player1First: 'Žaidėjas 1 — žaidžia pirmas',
    player2: 'Žaidėjas 2',
    signedInAs: (name: string) => `Prisijungta kaip ${name}. Keiskite profilyje.`,
    swapColours: 'Sukeisti spalvas (1 žaidėjas ↔ 2 žaidėjas)',
    startGame: 'Pradėti žaidimą',
    player1Placeholder: 'Žaidėjas 1',
    player2Placeholder: 'Žaidėjas 2',
  },

  footer: {
    howToPlay: 'Kaip žaisti',
    rules: 'Taisyklės',
    settings: 'Nustatymai',
    privacy: 'Privatumas',
    theme: 'Tema',
    brand: 'DotDuel © 2026',
    brandTitle:
      '© 2026 DotDuel. Visos teisės saugomos. „DotDuel“ ir „DotDuel“ logotipas yra autoriaus prekių ženklai.',
    versionTitle: 'Kas naujo',
  },

  game: {
    ptsLeft: 'TAŠKŲ LIKO',
    boardAriaLabel: (shape: string) => `${shape} žaidimo lenta`,
    liveDraw: (s1: number, s2: number) => `Žaidimas baigtas. Lygiosios, ${s1} prieš ${s2}.`,
    liveWin: (winner: number, s1: number, s2: number) =>
      `Žaidimas baigtas. Laimėjo ${winner} žaidėjas, ${s1} prieš ${s2}.`,
    liveTurn: (current: number, s1: number, s2: number) =>
      `Eina ${current} žaidėjas. Rezultatas: 1 žaidėjas – ${s1}; 2 žaidėjas – ${s2}.`,
    linesToClaim: (n: number) => plural(n, 'paimtina linija', 'paimtinos linijos', 'paimtinų linijų'),
    pendingTitle: 'Linijos laukia paėmimo – bakstelėkite spalvotą vienos iš jų tašką, kad ją paimtumėte.',
    leaveMatch: 'Palikti žaidimą',
    backToMenu: 'Grįžti į meniu',
    dailyTime: 'Šio bandymo laikas',
    seeUnclaimed: 'Rodyti nepaimtas linijas',
    seeUnclaimedTitle: (on: boolean) => `Rodyti nepaimtas linijas: ${on ? 'įjungta' : 'išjungta'}`,
    rules: 'Kaip žaisti',
    showRules: 'Rodyti taisykles',
    resign: 'Pasiduoti',
    resignTitle: 'Pasiduoti ir baigti žaidimą',
    resignConfirmTitle: 'Pasiduoti?',
    resignConfirmBody: 'Pralaimėsite šį žaidimą.',
    resignRankedTitle: 'Pasiduoti šį reitinguojamą žaidimą?',
    resignRankedBody: 'Tai bus įskaityta kaip pralaimėjimas jūsų reitinge.',
    dailyForfeitTitle: 'Palikti šį bandymą?',
    dailyForfeitBody: (remaining: number, max: number) =>
      `Tai atims 1 iš ${max} dienos bandymų — po to liks ${remaining}.`,
    dailyForfeitConfirm: 'Palikti',
    thinking: 'Galvoja',
    bot: 'BOTAS',
    aiOpponent: 'DI varžovas',
    moveFailed: 'Ėjimas neišsiuntė — bandykite dar kartą',
  },

  rules: {
    aria: 'Kaip žaisti DotDuel',
    close: 'Uždaryti taisykles',
    title: 'Kaip žaisti DotDuel',
    tagline: 'Žaiskite paeiliui. Užbaikite linijas. Surinkite daugiausia taškų.',
    goalH: 'Tikslas',
    goalP: 'Surinkite daugiau taškų nei varžovas.',
    turnH: 'Kiekvieną ėjimą',
    turnP: 'Atlikite vieną iš šių veiksmų, tada ėjimas pereina varžovui:',
    turnTapEmpty: 'Bakstelėkite tuščią tašką, kad jį nuspalvintumėte.',
    turnTapClaim:
      'Bakstelėkite tašką užbaigtoje, dar nepaimtoje linijoje, kad pasiimtumėte jos taškus (naujas taškas nededamas).',
    scoringH: 'Taškų skaičiavimas',
    scoringP:
      'Linija – tai bet kokia tiesi taškų eilė: horizontali, vertikali ar įstriža. Kai visi linijos taškai nuspalvinti, ji duoda tiek taškų, koks jos ilgis.',
    score3: '3 taškų linija → 3 tšk.',
    score5: '5 taškų linija → 5 tšk.',
    score8: '8 taškų linija → 8 tšk.',
    scoreCorner: 'Vienas kampinis taškas laikomas 1 tšk. „linija“',
    catchH: 'Gudrybė – vienas ėjimas, vieni taškai',
    catchP:
      'Jei jūsų taškas iškart užbaigia kelias linijas, gausite taškų tik už ilgiausią. Kitos užbaigtos linijos tampa nepaimtos – bet kuris žaidėjas gali jas pasiimti vėlesniu ėjimu.',
    watchH: 'Stebėkite lentą',
    watchP:
      'Žaidimas nepažymės nepaimtų linijų. Pastebėkite visiškai nuspalvintą, dar neperbrauktą liniją ir bakstelėkite bet kurį jos tašką, kad ją pasiimtumėte. Nemokami taškai už dėmesingumą.',
    endH: 'Žaidimo pabaiga',
    endP:
      'Kai visi taškai nuspalvinti ir visos užbaigtos linijos paimtos. Laimi daugiausiai taškų surinkęs žaidėjas; lygus rezultatas – lygiosios.',
    tipsH: 'Patarimai',
    tip1: 'Venkite ėjimų, užbaigiančių dvi linijas – kitas atiduodate varžovui.',
    tip2: 'Visada pasiimkite nemokamą kampą ar didelį užbaigimą.',
    tip3: 'Kartais protingiau blokuoti (0 taškų) nei surinkti mažai.',
    tip4: 'Žaidimo pabaigoje, prieš dėdami tašką, ieškokite nepaimtų linijų.',
    modesH: 'Režimai',
    modeBotsLead: 'Prieš botus',
    modeBots: '– penki sudėtingumo lygiai. Įveikite Lengvą su viena figūra, kad atrakintumėte kitą.',
    modeHotseatLead: 'Vietinis žaidimas',
    modeHotseat: '– du žaidėjai, vienas įrenginys.',
    modeMpLead: 'Internetinis',
    modeMp: '– tiesioginiai žaidimai su pasauliniu Elo reitingu, šachmatinio tipo laikrodžiais ir revanšais.',
    gotIt: 'Supratau',
  },

  settings: {
    aria: 'Nustatymai',
    close: 'Uždaryti nustatymus',
    title: 'Nustatymai',
    tagline: 'Išsaugoma vietoje, šiame įrenginyje.',
    yourName: 'Jūsų vardas',
    yourNameHintSignedIn: (name: string) => `Prisijungta kaip ${name}. Pervadinkite profilyje.`,
    yourNameHint: 'Naudojamas žaidžiant su botu IR kaip 1 žaidėjo vardas vietiniame žaidime.',
    hotseatOpponent: 'Vietinio žaidimo varžovas',
    player2Name: '2 žaidėjo vardas',
    swapColours: 'Sukeisti spalvas (1 žaidėjas ↔ 2 žaidėjas)',
    privacyH: 'Privatumas',
    whoCanChallenge: 'Kas gali mane iškviesti žaidimui?',
    everyone: 'Visi',
    friendsOnly: 'Tik draugai',
    nobody: 'Niekas',
    showStatus: 'Rodyti mano būseną draugams',
    showStatusHint:
      'Kai išjungta, draugai jus mato kaip neprisijungusį. Draugystės prašymai vis tiek veikia; paslepiamas tik tiesioginės būsenos indikatorius.',
    resetProgress: 'Atstatyti pažangą',
    resetProgressConfirm: 'Atstatyti pažangą? Atrakintos figūros ir lygiai bus prarasti.',
    resetStats: 'Atstatyti statistiką',
    resetStatsConfirm:
      'Atstatyti statistiką? Bus ištrinta visų žaidėjų pergalių/lygiųjų/pralaimėjimų istorija šiame įrenginyje.',
    renameNote:
      'Pastaba: pasivadinę kitaip, pradėsite naują statistikos eilutę. Senojo vardo istorija išsaugoma po tuo vardu.',
    appearanceH: 'Išvaizda',
    colourTheme: 'Spalvų tema',
    changeTheme: 'Keisti',
    done: 'Atlikta',
  },

  theme: {
    aria: 'Pasirinkite temą',
    close: 'Uždaryti temas',
    title: 'Tema',
    tagline: 'Pasirinkite paletę. Išsaugoma šiame įrenginyje.',
    sunFriendly: 'Tinka saulėje',
    done: 'Atlikta',
    taglines: {
      'forest-pearl': 'Originalioji. Smaragdas ant žalsvo fono.',
      'royal-court': 'Violetinis aksomas prieš senovinį auksą.',
      'tempo-rivals': 'Vyno raudonis prieš dangaus mėlyną. Klasika.',
      'sunset-catan': 'Terakotos dykumos, pergamento figūros.',
      'coral-reef': 'Gilus žalsvai mėlynas vanduo, koralų bičiuliai.',
      'twilight-cosmos': 'Indigo tuštuma prieš elektrinę žydrą.',
      'monochrome-pro': 'Juodos ir baltos figūros ant medžio. Maksimalus kontrastas.',
      'vintage-press': 'Bordo ir tamsiai mėlynas rašalas ant pergamento. Tinka saulėje.',
    },
  },

  changelog: {
    aria: 'Kas naujo',
    close: 'Uždaryti',
    title: 'Kas naujo',
    tagline: 'Naujausi DotDuel atnaujinimai, nuo naujausio.',
    empty: 'Kol kas leidimo pastabų nėra.',
    entryEmpty: 'Leidimo pastabos netrukus.',
    added: 'Pridėta',
    changed: 'Pakeista',
    fixed: 'Pataisyta',
    done: 'Atlikta',
    months: ['saus.', 'vas.', 'kov.', 'bal.', 'geg.', 'birž.', 'liep.', 'rugp.', 'rugs.', 'spal.', 'lapkr.', 'gruod.'],
    entries: {
      'Alpha 0.4.12.3': {
        highlight: 'Žaidėjų kortelės dabar tikrai sutampa',
        changes: [
          'Telefonuose dvi žaidėjų kortelės kartais atrodydavo visiškai skirtingai — vienoje avataras ir rezultatas būdavo kitoje vietoje nei kitoje. Dabar avataras, vardas ir rezultatas visada yra toje pačioje vietoje abiejose kortelėse.',
        ],
      },
      'Alpha 0.4.12.2': {
        highlight: 'Programėlė dabar dar geriau kalba jūsų kalba',
        changes: [
          'DI varžovo vardas, bendrinamas pergalės paveikslėlis / tekstas ir keli ryšio būsenos ekranai likdavo anglų kalba nepriklausomai nuo jūsų kalbos nustatymo — dabar išversta.',
          'Visos ankstesnės naujienos šiame sąraše (iki pat pradžios) dabar prieinamos lietuvių, ispanų, portugalų, lenkų ir čekų kalbomis, ne tik anglų.',
        ],
      },
      'Alpha 0.4.12.1': {
        highlight: 'Pataisymas',
        changes: [
          'Pataisyta: telefonuose lenta nebešokinėja/nebesitraukia, kai rezultatas peršoka iš 2 į 3 skaitmenis.',
        ],
      },
      'Alpha 0.4.12.0': {
        highlight: 'Tobulinimai',
        changes: [
          'Kalbos pasirinkimas perkeltas į viršutinį kairįjį kampą, kad nebedengtų logotipo (temos mygtukas liko viršutiniame dešiniajame).',
          'Dvi žaidėjų kortelės telefonuose dabar tinkamai veidrodinės, o ne atrodo asimetriškos.',
          'Vietinio žaidimo spalvų pavyzdžiai ir nuostata „sukeisti spalvas“ dabar atitinka pasirinktą temą, o ne visada rodo kreminę/žalią.',
          'Atgal mygtukas / gestas dabar žingsnis po žingsnio grąžina per meniu ir ekranus, o ne uždaro programėlę — reitinguojami žaidimai ir dienos galvosūkio bandymai vis tiek paprašys patvirtinimo.',
        ],
      },
      'Alpha 0.4.11.0': {
        highlight: 'Kaip žaisti',
        changes: [
          'Naujas vadovas „Kaip žaisti“ su animuotais pavyzdžiais tikroje lentoje — pamatykite, kaip kampas duoda 1 tašką, kaip užbaigiama linija, kaip kelios linijos laukia paėmimo, ir kaip linijos eina visomis kryptimis Trikampyje (3 kryptys) bei Kvadrate (4 kryptys). Atidarykite jį poraštėje, šalia Taisyklių; bakstelėkite lentą, kad sustabdytumėte, braukite arba naudokite rodykles naršymui.',
          'Spalvų tema dabar renkama Nustatymuose (perkelta iš poraštės, kad atsirastų vietos „Kaip žaisti“).',
        ],
      },
      'Alpha 0.4.10.1': {
        highlight: 'Pataisymai',
        changes: [
          'Pasiekimo atrakinimo iššokantis pranešimas ir kalbos meniu dabar nepermatomi ir lengviau įskaitomi (anksčiau per juos prasišviesdavo fonas). Pasiekimo pranešimas taip pat padidintas.',
          'Prisijungus naujame įrenginyje, nebebus rodomi jau anksčiau pelnyti pasiekimai.',
          'Pasiekimas „Kampuotas“ (surinkti 1 tašką už kampinę liniją) dabar atrakinamas — anksčiau tai nebuvo sekama.',
        ],
      },
      'Alpha 0.4.10.0': {
        highlight: 'Pilnai išversta',
        changes: [
          'Visa programėlė dabar išversta, ne tik meniu. Jūsų profilis, draugai ir kvietimai, kelių žaidėjų laukiamasis ir rungtynių ekranai, žaidimo pabaigos ekranas, reitingai bei dienos galvosūkio lyderių lentelė, dalijimasis ir visi 97 pasiekimai (pavadinimai ir aprašymai) dabar rodomi anglų, lietuvių, ispanų, portugalų, lenkų ir čekų kalbomis.',
        ],
      },
      'Alpha 0.4.9.0': {
        highlight: 'Kalbos',
        changes: [
          '„DotDuel“ dabar kalba šešiomis kalbomis: anglų, lietuvių, ispanų, portugalų, lenkų ir čekų. Pasirinkite savąją kalbos mygtuku viršutiniame dešiniajame meniu kampe.',
          'Žaidimas dabar automatiškai paleidžiamas jūsų kalba — internete pagal naršyklės nustatymus, o programėlėje pagal įrenginio kalbą.',
        ],
      },
      'Alpha 0.4.8.0': {
        highlight: 'Pasiekimai',
        changes: [
          'Pasiekimai! Žaisdami pelnykite iki 100 ženklelių — už botų įveikimą kiekvienoje figūroje ir lygyje, pergalių serijas, dienos galvosūkio bandymus, dienų serijas ir svarbius etapus. Raskite juos po Reitingai → Pasiekimai; kiekvienas ženklelis įsižiebia jūsų temos spalvomis, kai atrakinamas, o jį pelnius iškart pasirodo pranešimas „🏆 Pasiekimas atrakintas“.',
          'Prisekite mėgstamą ženklelį, kad jis būtų rodomas šalia jūsų vardo žaidžiant.',
        ],
      },
      'Alpha 0.4.7.0': {
        highlight: 'Naujas meniu + Botai',
        changes: [
          'Pagrindinis meniu pertvarkytas į tris aiškias dalis — Vienas žaidėjas, Keli žaidėjai ir Reitingai — kiekviena atidaro tvarkingą sąrašą su savomis piktogramomis.',
          'Kompiuterio varžovai visur dabar vadinami „Botais“, o ne „DI“.',
          'Renkantis lentos figūrą ar boto lygį dabar rodoma atitinkama piktograma — lentos figūra ir kiekvieno boto savitas veidas pagal sudėtingumą.',
          'Android programėlė dabar išlieka vertikalioje padėtyje, net pakreipus telefoną.',
        ],
      },
      'Alpha 0.4.6.2': {
        changes: [
          'Perdaryta dalijimosi rezultato kortelė: didesnė lenta, rezultatas rodomas paprastai kaip Pergalė / Pralaimėjimas / Lygiosios, o QR kodas dabar žaidimo spalvų ir lentos viduryje su užrašu „Nuskaitykite ir žaiskite dabar!“.',
        ],
      },
      'Alpha 0.4.6.0': {
        changes: [
          'Dalijimosi rezultato kortelėse dabar yra nuskaitomas QR kodas — draugai gali nukreipti kamerą (arba ilgai paspausti paveikslėlį), kad iškart patektų į žaidimą. Kvietimo nuorodose naudojamas privatus kvietimo kodas, o ne jūsų paskyros ID.',
        ],
      },
      'Alpha 0.4.5.3': {
        changes: [
          'Dalijimosi kortelė perdaryta: lenta dabar sėdi ant tikro 3D veltinio stalo kaip žaidime, tekstas centruotas, o adresas DotDuel.com daug lengviau perskaitomas.',
        ],
      },
      'Alpha 0.4.5.2': {
        changes: [
          'Dalijimosi kortelė dabar generuojama dvigubos raiškos — nebematyti pikselių atidarius paveikslėlį per visą ekraną „Messenger“ ar „WhatsApp“ programėlėje.',
        ],
      },
      'Alpha 0.4.5.1': {
        changes: [
          'Dalijimosi kortelė: lenta dabar atrodo kaip tikrame žaidime (suvienodintas linijų storis; taškai nebepasimeta tankiose lentose), o rezultatas nebesidengia su žyme „tšk.“.',
        ],
      },
      'Alpha 0.4.5.0': {
        highlight: 'Greičiau telefonuose',
        changes: [
          'Lengvesni grafikos efektai žaidžiant — žaidimas veikia pastebimai sklandžiau pigesniuose telefonuose, o išvaizda nesikeičia.',
          'Lyderių lentelė dabar rodo vietos rezervavimo eilutes kraunantis ir bandymo pakartoti mygtuką, jei nutrūksta ryšys.',
          'Atnaujinta privatumo politika: pataisytas serverio teikėjas į Supabase, pridėti Android programėlės ir AdMob atskleidimai.',
          'Android programėlė: atgal mygtukas dabar uždaro atvirus iššokančius langus, o ne uždaro žaidimą.',
        ],
      },
      'Alpha 0.4.4.0': {
        highlight: 'Dalinkitės rezultatu',
        changes: [
          'Naujas mygtukas „Dalintis rezultatu“ žaidimo pabaigos ekrane — jis sukuria jūsų baigtos lentos paveikslėlį su rezultatu ir leidžia juo dalintis bet kur, kartu su nuoroda, kuria draugai gali su jumis susižaisti.',
        ],
      },
      'Alpha 0.4.3.0': {
        highlight: 'Švaresnė lenta, didesnis tekstas',
        changes: [
          'Pašalinti žaidimo metu iššokantys patarimų debesėliai — jie mirgėdavo per greitai, kad būtų perskaitomi, ir tik trukdė. Taisyklių ekranas ir vaizdas „Rodyti nepaimtas linijas“ vis tiek moko taškų skaičiavimo.',
          'Visas smulkus tekstas visoje programėlėje padidintas iki minimalaus įskaitomo dydžio geresniam matomumui ir prieinamumui.',
        ],
      },
      'Alpha 0.4.2.0': {
        highlight: 'Dienos galvosūkis atgimė — viena bendra lenta, lenktynės su laikrodžiu',
        changes: [
          'Dienos galvosūkis dabar visiems tas pats kiekvieną dieną: atsitiktinė figūra su iš anksto suformuota pradžia, tada 3 minutės laikrodžio sukaupti kuo didesniam rezultatui. Geriausias iš 3 bandymų.',
          'Dienos reitingas dabar pagal jūsų rezultatą (o ne persvarą prieš DI), o lyderių lentelė rodo kiekvienos iš paskutinių 30 dienų nugalėtoją.',
        ],
      },
      'Alpha 0.4.1.0': {
        highlight: 'Spalvų temos perdažo visą lentą',
        changes: [
          'Spalvų temos dabar perdažo visą lentą — žaidimo paviršių, figūras, pergalės šventę ir mygtukus, atitinkančius jūsų pasirinktą paletę, o ne žalią lentą po bet kuria tema.',
          'Internetiniuose žaidimuose, kas eina pirmas, dabar sprendžiama sąžiningu monetos metimu, o revanšuose pirmumas keičiasi paeiliui — tad per seriją kiekvienas gaunate pirmą ėjimą maždaug pusę laiko.',
          'Kompiuterio varžovas eina greičiau, tad žaidimai prieš DI jaučiasi žvalesni.',
          'Meniu, iššokantys langai ir žaidimo pabaigos ekranas atsidaro sklandžiau, su mažesniu vėlavimu.',
          'Užrakintos figūros ir sudėtingumo lygiai dabar rodo aiškią spynelę, o ne atrodo pilki ar sugedę.',
          'El. pašto ir slaptažodžio prisijungimo laukai dabar aiškiai matomi, o figūros geriau išsiskiria lentoje kiekvienoje temoje.',
        ],
      },
      'Alpha 0.4.0.0': {
        highlight: 'Serverio atnaujinimas + sklandesnis kelių žaidėjų režimas',
        changes: [
          'Kelių žaidėjų režimas perkeltas į naują, greitesnį serverį patikimesnėms rungtynėms.',
          'Kelių žaidėjų laikrodžiai dabar sklandūs ir sąžiningi — jūsų laikrodis nebešokinėja ir nebeteka toliau po ėjimo.',
          'Žaidimo kvietimai lieka ekrane, kol draugas atsako, ir juos galite priimti tiesiai iš rezultatų ekrano.',
          'Dabar jus automatiškai galima rasti pagal vartotojo vardą, tad draugai gali jus pridėti be papildomų žingsnių.',
        ],
      },
      'Alpha 0.3.7.0': {
        highlight: 'Automatiškai atsinaujinanti programėlė + meniu slinkties pataisymas',
        changes: [
          'Programėlė dabar atsinaujina automatiškai — jei pridėjote „DotDuel“ prie pradžios ekrano, ji pati atsisiunčia naujas versijas, o ne užstringa ant senos podėlio versijos.',
          'Telefonuose meniu dabar tinkamai slenka, tad apačioje esanti Reitingų kortelė visiškai matoma.',
        ],
      },
      'Alpha 0.3.6.1': {
        highlight: 'Lentos padėtis mobiliajame',
        changes: [
          'Mobiliojoje versijoje lenta dabar iš tiesų pasislenka arčiau žaidėjų kortelių (ankstesnis bandymas neveikė).',
        ],
      },
      'Alpha 0.3.6.0': {
        highlight: 'Prisijunkite, kad žaistumėte',
        changes: [
          'Pirmą kartą paleidus dabar rodomas ekranas „Prisijunkite, kad žaistumėte“ — prisijunkite dėl kelių žaidėjų režimo ir pažangos sinchronizavimo debesyje, arba pasirinkite „žaisti anonimiškai“, kad iškart pradėtumėte.',
          'Telefonuose lenta dabar pakyla arčiau žaidėjų kortelių, o ne palieka didelį tarpą virš savęs.',
        ],
      },
      'Alpha 0.3.5.0': {
        highlight: 'Ankstesni galvosūkio nugalėtojai + tvarkingesni reitingai',
        changes: [
          'Galvosūkio lyderių lentelėje dabar yra skirtukas „Naujausi nugalėtojai“ — kas laimėjo kiekvieną iš paskutinių 30 dienų, su data šalia kiekvieno vardo.',
          'Pasauliniame Elo reitinge dabar pirmiausia rodomas reitingas: vieta, Elo, tada žaidėjo vardas.',
        ],
      },
      'Alpha 0.3.4.0': {
        highlight: 'Pergalės šventė auga su sudėtingumu',
        changes: [
          'Jūsų pergalės šventė dabar auga su iššūkiu — nedidelis pliūpsnis už pergalę prieš Naujoką, vis didėjantis iki pilno auksinio šou už Neįmanomo įveikimą.',
        ],
      },
      'Alpha 0.3.3.0': {
        highlight: 'Švaresnė, tvarkingesnė lenta — pasiruošusi beta versijai',
        changes: [
          'Perdarytas lentos rėmas: veltinis dabar tolygiai apgaubtas lygiu, apvaliais kampais rėmeliu su subtiliu įdubusiu 3D efektu — ir jis tinkamai apgaubia kiekvieną figūrą, įskaitant trikampio smailų kampą (anksčiau kontūras atrodė netolygus).',
          'Žaidimo žaidėjų kortelės dabar visiškai telpa ekrane kaip apvalūs stačiakampiai, o ne išsikiša už kraštų.',
          'Pataisytas žaidimo patarimo iššokantis langas, kurio tekstas galėjo išsikišti už lentos ribų.',
        ],
      },
      'Alpha 0.3.2.0': {
        highlight: 'Prašmatnesnė išvaizda · pergalės šventės',
        changes: [
          'Vizualinis patobulinimas — mygtukai bei prieš DI / figūros / sudėtingumo kortelės dabar turi tikrą apčiuopiamą 3D gylį (jos pakyla užvedus pelę ir įsispaudžia paspaudus), o pagrindiniai mygtukai atitinka kiekvienos temos spalvą, o ne visada būna žali.',
          'Pergalės šventės! Baigus žaidimą pergale, paleidžiami fejerverkai ir konfeti — su itin įspūdingu auksiniu šou už Neįmanomo DI įveikimą.',
        ],
      },
      'Alpha 0.3.1.0': {
        highlight: 'Tiesiai į žaidimą · aiškesnis pradžios ekrano paaiškinimas',
        changes: [
          'Pašalintas įžanginis mokomasis iššokantis langas — žaidimas dabar iškart atsidaro meniu. Kaip žaisti paaiškinta viena aiškia eilute pradžios ekrane, o pilnos taisyklės visada per vieną bakstelėjimą mygtuku „?“.',
        ],
      },
      'Alpha 0.3.0.0': {
        highlight: 'Reklama palaiko nemokamą žaidimą · apsauga nuo neatvykusio žaidėjo',
        changes: [
          'Nedidelė reklama dabar rodoma meniu ir nemokamuose vieno žaidėjo ekranuose (Prieš botą, Vietinis žaidimas, Dienos galvosūkis), kad „DotDuel“ išliktų nemokamas. Reitinguojamuose kelių žaidėjų žaidimuose reklamos nėra. Sutikimą tvarko Google privatumo langas.',
          'Apsauga nuo neatvykusio žaidėjo kelių žaidėjų režime: jei žaidėjas nepadaro pirmo ėjimo per 10 sekundžių, žaidimas nutraukiamas be reitingo pokyčio abiem pusėms — tad atsijungimas ar išsiblaškymas pradžioje niekada nekainuoja.',
        ],
      },
      'Alpha 0.2.9.0': {
        highlight: 'Vizualinis atnaujinimas + įskaitoma kiekvienoje temoje',
        changes: [
          'Nauja išvaizda: nauja tipografija, rėminta lenta, atitinkanti kiekvieną figūrą (trikampis, rombas, kvadratas), ryškesnės figūros ir aiškesni rezultatai.',
          'Žaidėjų skydeliai sklandžiai mažėja mažėjant ekranui — telefonuose jie susitraukia į kompaktišką kortelę su avataru šalia vardo, taip suteikiant lentai daugiau vietos.',
          'Nustatymai, Taisyklės ir Privatumas sutvarkyti į švarias, lengviau peržvelgiamas korteles.',
          'Tušti taškai dabar aiškiai matomi kiekvienoje temoje, o ne išnyksta lentos fone — ypač šviesiose temose.',
          'Mygtukai, žaidimo pabaigos ekranas ir iššokantys langai nebesunkiai įskaitomi šviesiose temose („Monochrome Pro“, „Vintage Press“) — tekstas ir fonas dabar visur išlaiko tinkamą kontrastą.',
        ],
      },
      'Alpha 0.2.8.0': {
        highlight: 'Pilnas žaidimas klaviatūra',
        changes: [
          'Pilnas žaidimas klaviatūra: „Tab“ pereikite prie lentos, rodyklių klavišais judėkite tarp taškų, „Enter“ ar tarpo klavišu padėkite tašką arba pasiimkite liniją.',
          'Reitinguojamos rungtynės dabar suranda boto varžovą per apie 15 sekundžių, kai nėra žmogaus, o ne per iki minutės.',
        ],
      },
      'Alpha 0.2.7.2': {
        highlight: 'Pataisymas: mirgėjimas / juodas ekranas žaidimo pabaigoje',
        changes: [
          'Dingo žaidimo vidurio–pabaigos mirgėjimas (ir retkarčiais juodas ekranas) tankesnėse lentose. Kiekviena užbaigta linija anksčiau buvo piešiama su papildomo maišymo efektu ryškesniam paryškinimui; Kvadrate ir Stačiakampyje tai sukrauna dešimtis GPU sluoksnių, galiausiai perpildydama mobiliojo įrenginio grafikos atmintį. Linijos dabar piešiamos paprastomis, ryškaus kontrasto spalvomis — ryškus „juostelės“ vaizdas išlieka, o strigimas – ne.',
        ],
      },
      'Alpha 0.2.7.1': {
        highlight: 'Pataisymas: nebemirga Kvadratas/Stačiakampis',
        changes: [
          'Paryškinimas „Rodyti nepaimtas linijas“ dabar rodomas tik Trikampio lentoje. Kvadrate ir Stačiakampyje jis kartais sukeldavo ekrano mirgėjimą ir patamsėjimą, kai buvo daug nepaimtų linijų. Šis jungiklis šiose figūrose paslėptas, kol bus pataisyta pagrindinė vizualinė klaida.',
        ],
      },
      'Alpha 0.2.7.0': {
        highlight: 'Dienos galvosūkis: 3 bandymai + lyderių lentelė',
        changes: [
          'Dabar turite 3 bandymus šiandienos galvosūkiui, o ne 1. Skaičiuojama geriausia jūsų persvara — serija vis tiek pridedama po pirmo dienos užbaigimo.',
          'Nauja kortelė „Galvosūkio lyderių lentelė“ meniu. Šiandienos geriausios persvaros gyvai, rikiuojamos nuo didžiausios iki mažiausios. Lygiąsias lemia, kas baigė pirmas. Istorinės lyderių lentelės (pagal dieną, mėnesį, vardo paiešką) netrukus.',
        ],
      },
      'Alpha 0.2.6.0': {
        highlight: 'Šiandienos galvosūkis',
        changes: [
          'Nauja kortelė „Šiandienos galvosūkis“ meniu. Vienas bandymas per dieną prieš Sunkų DI kintančioje figūroje. Rezultatas – jūsų persvara (jūs minus DI), o kiekviena pergalė prideda dieną prie jūsų profilio serijos. Rytojaus galvosūkis atsirakina vidurnaktį (UTC).',
          'Norint žaisti dienos galvosūkį ir kaupti seriją, reikia prisijungti — serija saugoma jūsų paskyroje, tad veikia visuose įrenginiuose.',
        ],
      },
      'Alpha 0.2.5.0': {
        highlight: 'Dienos serijos pagrindas',
        changes: [
          'Nauja skiltis „Dienos serija“ jūsų profilyje, paruošta dienos galvosūkiui (netrukus). Kai galvosūkis pasirodys, jo užbaigimas kiekvieną dieną kaups jūsų seriją visuose įrenginiuose — saugoma jūsų paskyroje, o ne naršyklėje, tad išlieka net išvalius podėlį ar pakeitus įrenginį.',
        ],
      },
      'Alpha 0.2.4.0': {
        highlight: 'Dalinimasis ir kvietimas iš meniu',
        changes: [
          'Dabar galite dalintis „DotDuel“ tiesiai iš pagrindinio meniu. Prisijungę žaidėjai gauna „Pakviesti draugą“ — nuorodose yra jūsų rekomendacijos kodas, tad užsiregistravus jis automatiškai tampa jūsų draugu. Neprisijungę žaidėjai po prisijungimo mato nuorodą „Dalintis „DotDuel““ greitam ir švariam pasidalinimui žaidimu.',
        ],
      },
      'Alpha 0.2.3.0': {
        highlight: 'Mokomosios užuominos + nepaimtų linijų jungiklis',
        changes: [
          'Kontekstinės užuominos, pasirodančios vieną kartą mokantis: pirmą kartą surinkus taškų, pirmą kartą vienam ėjimui uždarius dvi linijas (didžiausios-vienos taisyklė), pirmą kartą jūsų ėjimo pradžioje laukiant nepaimtai linijai ir arti žaidimo pabaigos.',
          'Naujas akies piktogramos jungiklis „Rodyti paimtinas linijas“ šalia taisyklių mygtuko žaidžiant prieš DI lygiuose Naujokas/Lengvas/Vidutinis/Sunkus. Numatytai įjungtas Naujoko–Vidutinio lygiuose, išjungtas Sunkiame. Paslėptas Neįmanomame, vietiniame ir kelių žaidėjų režimuose — lentos skaitymas yra dalis iššūkio.',
          'Atnaujinta vidinė nustatymų saugykla; jūsų bus paprašyta iš naujo įvesti vardą, o pirmą kartą paleidus vėl pasirodys mokomasis iššokantis langas. Statistika, atrakinimai ir paskyros duomenys nepakis.',
        ],
      },
      'Alpha 0.2.2.0': {
        highlight: 'Matomas taškų skaičiavimas',
        changes: [
          'Taškų skaičiavimas dabar matomas: nuo liniją užbaigiančio taško iššoka plūduriuojantis +N jūsų spalva, jūsų rezultato ženkliukas pulsuoja pasikeitus, o ženkliukas „paimtinos linijos“ sublyksi atsiradus naujai laukiančiai linijai.',
        ],
      },
      'Alpha 0.2.1.0': {
        highlight: 'Užkulisinė telemetrija',
        changes: [
          'Vidinis pakeitimas: pridėta anoniminė žaidėjų kelio analitika tiems, kurie sutiko su slapukų juosta — padeda pamatyti, kur naujiems žaidėjams kyla sunkumų, kad galėtume juos ištaisyti. Jokie asmeniniai duomenys neišeina iš įrenginio.',
        ],
      },
      'Alpha 0.2.0.0': {
        highlight: 'Draugai ir kvietimai',
        changes: [
          'Draugų sąrašas. Pridėkite draugą pagal vartotojo vardą, matykite, kurie draugai prisijungę ir ką veikia (žaidžia prieš DI, vietinį žaidimą, reitinguojamas rungtynes), pakvieskite draugą į konkretų žaidimą (jūsų pasirinkta figūra, laiko kontrolė, reitinguojamas ar įprastas). Kvietimai, gauti žaidžiant, lieka eilėje ir pasirodo, kai tik grįžtate į meniu. Reitinguojamas kvietimas skaičiuojamas Elo tik jei abi pusės pasirinko reitinguojamą; kitu atveju tai įprastas žaidimas. Po kelių žaidėjų rungtynių varžovą galite pridėti kaip draugą vienu bakstelėjimu.',
          'Pakviesk draugą: kvieskite žmones išbandyti „DotDuel“ — jiems dar nereikia paskyros. Naudoja telefono dalijimosi langą arba el. pašto programą; mes niekada nematome jų adreso. Kai jie užsiregistruoja, automatiškai gaunate draugystės prašymą iš jų.',
          'Nustatymai → Privatumas: pasirinkite, kas gali jus iškviesti žaidimui (Visi / Tik draugai / Niekas) ir ar jūsų tiesioginė būsena matoma draugams.',
        ],
      },
      'Alpha 0.1.5.0': {
        highlight: 'Serverio dalies sutvarkymas',
        changes: [
          'Vidinis pakeitimas: kelių žaidėjų žaidimo būsena visiškai perkelta į naują transportą. Senasis „Realtime Database“ kelias žaidimo duomenims nebenaudojamas. Matomo skirtumo nėra — nebent žaidimas šiek tiek žvalesnis.',
        ],
      },
      'Alpha 0.1.4.4': {
        highlight: 'Atnaujinimas grąžina į namus',
        changes: [
          'Visiškai atnaujinus puslapį po baigto žaidimo, dabar grįžtama į pagrindinį meniu, o ne kaskart iš naujo rodomas tas pats žaidimo pabaigos ekranas.',
        ],
      },
      'Alpha 0.1.4.3': {
        highlight: 'Mygtukas „Pasiruošęs“ + pasenusių skirtukų tvarkymas',
        changes: [
          'Mygtukas „Pasiruošęs“ dabar reaguoja iškart bakstelėjus, o ne laukia ryšio su serveriu, o žaidžiant prieš DI žaidimas prasideda tą akimirką, kai jį paspaudžiate (nelaukiant atgalinės atskaitos).',
          'Jei perėmėte kelių žaidėjų sesiją antrame įrenginyje, pirmasis įrenginys nebeberodo iliuzinio žaidimo pabaigos ekrano žaidimui, kurį baigėte kitur.',
        ],
      },
      'Alpha 0.1.4.2': {
        highlight: 'Sesijos užrakto atstatymas',
        changes: [
          'Jei ankstesnė sesija užstrigo laikydama kelių žaidėjų užraktą, dabar galite bakstelėti mygtuką „Keli žaidėjai“, kad perimtumėte čia, o ne laukti, kol jis atsilaisvins.',
          'Užstrigę sesijos užraktai dabar išsivalo du kartus greičiau (per 45 s vietoj 90 s), kai laikantis skirtukas dingsta.',
        ],
      },
      'Alpha 0.1.4.1': {
        highlight: 'Kelių žaidėjų patobulinimai',
        changes: [
          'Mygtukas „Pasiruošęs“ dabar iš tiesų pradeda žaidimą, kai tik jį paspaudžia abi pusės (prieš DI – kai tik jį paspaudžiate jūs).',
          'Pirmas rungtynių ėjimas nebeužtrunka 8–9 sekundes, kol varžovas sureaguoja.',
          'Prisijungimas antrame įrenginyje nebeįmeta jo atsitiktinai į jūsų aktyvų žaidimą pirmajame.',
          'Meniu mygtukai sulyginti to paties dydžio švaresnei išvaizdai.',
        ],
      },
      'Alpha 0.1.4.0': {
        highlight: 'Keli žaidėjai dabar veikia daugiau tinklų',
        changes: [
          'Kelių žaidėjų režimas dabar prisijungia tinkluose, kurie anksčiau blokuodavo žaidimo serverį (Whalebone, AdGuard, NextDNS, Brave Shields ir panašūs DNS lygio filtrai). Žaidimas naudoja naują transporto kelią, kuris keliauja standartiniu HTTPS ir nėra blokuojamas sekiklių blokavimo sąrašų. Jei anksčiau kelių žaidėjų režimas jums užstrigdavo kraunamame ekrane, pabandykite dar kartą.',
        ],
      },
      'Alpha 0.1.3.6': {
        highlight: 'Laikrodžio rodymo pataisymas',
        changes: [
          'Kelių žaidėjų laikrodžio rodmuo nebemirga po kiekvieno ėjimo.',
        ],
      },
      'Alpha 0.1.3.5': {
        highlight: 'Draugiškas pranešimas be ryšio',
        changes: [
          'Jei jūsų tinklas blokuoja žaidimo serverį (dažna su mobiliaisiais reklamų/sekiklių blokatoriais, tokiais kaip AdGuard, NextDNS ar Whalebone), Kelių žaidėjų režimas dabar rodo aiškų paaiškinimą su trikčių šalinimo patarimais, o ne užstringa kraunamame ekrane. Vieno žaidėjo režimas prieš DI kaip įprasta veikia neprisijungus.',
        ],
      },
      'Alpha 0.1.3.1': {
        highlight: 'Mobiliojo mygtuko pataisymas',
        changes: [
          'Mygtukai „Keli žaidėjai“ ir „Atsijungti“ kartais nieko nedarydavo griežtų privatumo nustatymų mobiliosiose naršyklėse (Brave, Firefox Focus). Dabar sąsaja iškart pereina toliau, o tvarkymas vyksta fone.',
        ],
      },
      'Alpha 0.1.3.0': {
        highlight: 'Botų armija — niekada nelaukite vieni',
        changes: [
          'Jei per ~15 s nerandama žmogaus, būsite suporuotas su reitinguojamu DI varžovu (Pip, Cricket, Ranger, Knight arba Voidstar). Jie skaičiuojami į Elo ir rodomi lyderių lentelėje.',
          'Paieškos ekranas dabar praneša, kada gali įsijungti botas.',
          'Revanšo mygtukas dabar paslepiamas, kai varžovas buvo botas (botai revanšų nepriima).',
        ],
      },
      'Alpha 0.1.2.5': {
        highlight: 'Registracijos pataisymo tąsa',
        changes: [
          'Vartotojo vardo pasirinkimas dabar veikia, net jei ankstesnis registracijos bandymas paliko iki galo neužbaigtą profilį',
          'Vardo pasirinkimo ekrane atsirado atsijungimo mygtukas, kad niekada neužstrigtumėte',
        ],
      },
      'Alpha 0.1.2.4': {
        highlight: 'Registracijos pataisymas',
        changes: [
          'Registruojantis nauja paskyra, vartotojo vardo pasirinkimas nebebeklaidina pranešimu apie trūkstamus leidimus',
        ],
      },
      'Alpha 0.1.2.3': {
        highlight: 'Nuorodos dalijimuisi + saugumo sustiprinimas',
        changes: [
          'Naršyklės skirtuko ir pradžios ekrano piktograma — du „DotDuel“ taškai pasirodo, kad ir kur pridėtumėte žymę ar įdiegtumėte žaidimą',
          'Dalijimosi peržiūros — įklijavus „DotDuel“ nuorodą į Discord, Telegram, Slack ar Twitter dabar pasirodo kortelė su logotipu ir šūkiu, o ne tuščias langelis',
          'Vartotojo vardo keitimas dabar vyksta atomiškai — senas vardas atlaisvinamas, o naujas užimamas tuo pačiu veiksmu',
          'Užkulisinis saugumo sustiprinimas — griežtesnė turinio saugumo politika, serverio pusės greičio ribojimai trinant paskyrą ir tikrinant vardus, suplanuotas baigtų žaidimų valymas (per ~24 val. pagal privatumo politiką) ir maišos funkcija apdoroti UID serverio žurnaluose',
        ],
      },
      'Alpha 0.1.2.2': {
        highlight: 'Kelių žaidėjų tempas + įskaitomumas',
        changes: [
          'Kelių žaidėjų lentos figūros atrakinamos po 50 ir 100 reitinguojamų žaidimų (Kvadratas, tada Stačiakampis)',
          'Žaibas (1 min) ir Greitasis (5 min) laikinai užrakinti — kol auga žaidėjų ratas, prieinamas tik Blicas (3 min)',
          'Taisyklių languje dabar rašoma, kad keli žaidėjai jau veikia',
          'Antraštės „DotDuel čempionas“ ir „Neįmanomas – įveiktas“ buvo nematomos šviesiose temose',
        ],
      },
      'Alpha 0.1.2.1': {
        highlight: 'Temų patobulinimas',
        changes: [
          'Kiekviena spalvų tema dabar turi savo teksto ir logotipo spalvas, o ne perima numatytąją žalią',
          'Preliminarus ženkliukas buvo nematomas „Vintage Press“ pergamento temoje',
        ],
      },
      'Alpha 0.1.2': {
        highlight: 'Naudojimo patobulinimai',
        changes: [
          'Temos pasirinkimas dabar pasiekiamas iš kiekvieno ekrano per poraštę',
          'Laikrodis matomas mobiliajame kelių žaidėjų režime',
          'Paskutinio ėjimo paryškinimas dabar rodo varžovo, o ne jūsų tašką',
          'Pergalės ekranas dabar praneša, KAIP laimėjote (pagal laiką / pagal taškus / varžovas pasidavė)',
          'Mobiliuosius iššokančius langus buvo neįmanoma uždaryti — uždarymo mygtukas dabar patikimai pasiekiamas',
          'Poraštės kapsulė siaurame telefone dabar persikelia į antrą eilutę, o ne nukertama',
          'Temos pasirinkimas ir kiti iššokantys langai dabar tinkamai slenka, kai turinys aukštesnis už ekraną',
          'Iššokantys langai buvo neįskaitomi kompiuteryje, kai buvo matoma slapukų juosta — dabar lango dydis tinkamai rezervuoja vietą',
        ],
      },
      'Alpha 0.1': {
        highlight: '„DotDuel“ pradeda veikti!',
        changes: [
          'Vieša alfa versijos pradžia — keli žaidėjai, reitingai, temos, saulėje patogus režimas',
        ],
      },
    } as Record<string, { highlight?: string; changes: string[] }>,
  },

  privacy: {
    aria: 'Privatumo politika',
    close: 'Uždaryti',
    title: 'Privatumo politika',
    tagline: 'Ką renkame, kodėl renkame ir kaip tai ištrinti.',
    whoH: 'Kas mes esame',
    whoP: 'DotDuel yra nepriklausomas dviejų žaidėjų taškų spalvinimo žaidimas. Pagal BDAR jūsų asmens duomenų valdytojas yra kūrėjas. Kontaktas:',
    collectH: 'Ką renkame',
    collectP: 'Tik tai, ko reikia, kad žaidimas veiktų ir liktų sąžiningas.',
    collectAccountLead: 'Paskyra:',
    collectAccount:
      'el. paštas, rodomas vardas, prisijungimo būdas (Google ar slaptažodis), paskyros sukūrimo data. Šaltinis: jūs, registruodamiesi per Supabase Auth.',
    collectRatingLead: 'Kelių žaidėjų reitingas:',
    collectRating:
      'jūsų dabartinis Elo, vertinamųjų žaidimų skaitiklis ir paskutinio žaidimo laikas. Šaltinis: apskaičiuojama serveryje kiekvieno reitinguojamo žaidimo pabaigoje.',
    collectHistoryLead: 'Žaidimų istorija:',
    collectHistory:
      'kiekvienas reitinguojamas žaidimas saugo abiejų žaidėjų ID, rodomus vardus, galutinius rezultatus, reitingo pokyčius, figūrą, laiko kontrolę, trukmę ir kaip žaidimas baigėsi (įprastai / pasibaigus laikui / pasidavus).',
    collectLiveLead: 'Tiesioginė žaidimo būsena:',
    collectLive:
      'kol vyksta kelių žaidėjų žaidimas, mūsų tikralaikėje duomenų bazėje saugome lentą, laikrodį ir tai, kieno eilė eiti. Tai ištrinama netrukus po žaidimo pabaigos.',
    collectFriendsLead: 'Draugai ir kvietimai:',
    collectFriends:
      'jūsų draugų sąrašas, laukiantys prašymai, prisijungimo būsena ir žaidimo kvietimai. Jei prisijungėte per kito žaidėjo kvietimo nuorodą ar QR kodą, įrašome, kuris žaidėjas jus pakvietė (jo atsitiktinį kvietimo kodą – kad ateityje būtų galima atsidėkoti už rekomendacijas).',
    collectDeviceLead: 'Tik įrenginyje saugomi duomenys:',
    collectDevice:
      'jūsų vieno žaidėjo pažanga, žaidimų su botu / vietinių žaidimų statistika, temos pasirinkimas ir „mokymas peržiūrėtas“ žyma. Saugoma jūsų naršyklės „localStorage“ ir niekada mums neperduodama.',
    collectAnalyticsLead: 'Analitika (tik jei sutinkate):',
    collectAnalytics:
      'Google Analytics automatiškai renkami įvykiai – puslapių peržiūros, įrenginio modelis, kalba, ekrano dydis, anoniminis seanso ID. Mūsų sistemoje nesusieta su jūsų paskyra.',
    whyH: 'Kodėl tai renkame (teisiniai pagrindai)',
    whyContractLead: 'Sutartis (6 str. 1 d. b p.):',
    whyContract:
      'paskyra, reitingas, žaidimų istorija, tiesioginė žaidimo būsena – visa tai būtina teikti kelių žaidėjų paslaugą, kuriai užsiregistravote.',
    whyLegitLead: 'Teisėtas interesas (6 str. 1 d. f p.):',
    whyLegit:
      'lyderių lentelė ir reitinguojami žaidimai – kad visiems žaidėjams būtų užtikrinta sąžininga, konkurencinga aplinka.',
    whyConsentLead: 'Sutikimas (6 str. 1 d. a p.):',
    whyConsentAds:
      'Google Analytics IR Google AdSense – abu įsijungia tik paspaudus „Sutinku“ sutikimo juostoje. Atsisakius ar neapsisprendus, neįsijungia nė vienas.',
    whyConsentNoAds:
      'Google Analytics – įsijungia tik paspaudus „Sutinku“ sutikimo juostoje. Atsisakius ar neapsisprendus, niekada neįsijungia.',
    sharedH: 'Su kuo dalijamasi',
    sharedAds:
      'Kaip vidinę infrastruktūrą naudojame Supabase (duomenų bazė, autentifikacija, tikralaikė infrastruktūra ir serverinės funkcijos, talpinama ES), taip pat Google – prisijungimui ir sutikimu grįstai analitikai, bei Google AdSense, kad keliuose meniu ekranuose rodytų nedideles reklamjuostes. Tiek Analytics, tiek AdSense įsijungia tik jums priėmus sutikimo juostą. Supabase ir Google tvarko duomenis pagal savo standartines sąlygas / duomenų tvarkymo susitarimus. Mes neparduodame ir nedaliname jūsų duomenų jokiai kitai trečiajai šaliai.',
    sharedNoAds:
      'Kaip vidinę infrastruktūrą naudojame Supabase (duomenų bazė, autentifikacija, tikralaikė infrastruktūra ir serverinės funkcijos, talpinama ES), taip pat Google – prisijungimui ir sutikimu grįstai analitikai. Analytics įsijungia tik jums priėmus sutikimo juostą. Supabase ir Google tvarko duomenis pagal savo standartines sąlygas / duomenų tvarkymo susitarimus. Mes neparduodame ir nedaliname jūsų duomenų jokiai kitai trečiajai šaliai. Šiuo metu nenaudojame trečiųjų šalių reklamos tinklų.',
    keepH: 'Kiek laiko saugome',
    keepAccountLead: 'Paskyra + lyderių lentelė:',
    keepAccount: 'kol ištrinsite savo paskyrą.',
    keepHistoryLead: 'Žaidimų istorija:',
    keepHistory: 'iki 24 mėnesių po žaidimo pabaigos, tada visam laikui ištrinama.',
    keepLiveLead: 'Tiesioginė žaidimo būsena:',
    keepLive: 'ištrinama per ~24 valandas po žaidimo pabaigos.',
    keepAnalyticsLead: 'Analitika:',
    keepAnalytics: 'pagal Google numatytąsias nuostatas (šiuo metu 14 mėnesių įvykių duomenims).',
    keepDeviceLead: 'Tik įrenginyje saugomi duomenys:',
    keepDevice: 'lieka tol, kol išvalysite naršyklės duomenis.',
    rightsH: 'Jūsų teisės',
    rightsP: 'Pagal BDAR turite teisę:',
    rightAccessLead: 'Susipažinti',
    rightAccess: 'su mūsų turimais jūsų asmens duomenimis – naudokite „Atsisiųsti mano duomenis“ savo profilyje.',
    rightRectifyLead: 'Ištaisyti',
    rightRectify: 'netikslius duomenis – naudokite mygtuką „Pervadinti“ savo profilyje.',
    rightEraseLead: 'Ištrinti',
    rightErase:
      'savo paskyrą („teisė būti pamirštam“) – naudokite „Ištrinti paskyrą“ savo profilyje. Įsigalioja iškart.',
    rightPortLead: 'Perkelti',
    rightPort: 'savo duomenis – aukščiau esantis atsisiuntimas yra mašininiu būdu nuskaitomas JSON failas, kurį galite pasiimti kitur.',
    rightObjectLead: 'Nesutikti',
    rightObject: 'su analitika – naudokite žemiau esantį jungiklį arba paspauskite „Atsisakyti“ juostoje pirmojo paleidimo metu.',
    rightComplainLead: 'Pateikti skundą',
    rightComplain:
      'savo nacionalinei duomenų apsaugos institucijai, jei manote, kad netinkamai tvarkėme jūsų duomenis.',
    rankingsNoteLead: 'Svarbi pastaba apie reitingus.',
    rankingsNote:
      'Jei ištrinsite paskyrą (ar būsite pašalinti dėl bet kokios priežasties), jūsų rodomas vardas ir paskyros identifikatorius pašalinami iš visų viešų įrašų. Tačiau reitingo pokyčiai, kuriuos sukėlėte kitų žaidėjų Elo, NĖRA atšaukiami – praėję žaidimai yra nekintami. Varžovai, su kuriais žaidėte, išlaiko savo reitingo pokyčius; jų žaidimų istorijoje vietoje jūsų vardo rodoma „Ištrintas žaidėjas“.',
    cookiesH: 'Slapukai ir analitika',
    cookiesP:
      'Mes nenaudojame stebėjimo slapukų. Mūsų prisijungimas (Supabase Auth) naudoja pirmosios šalies seanso saugyklą, kad išliktumėte prisijungę. Google Analytics naudoja slapukus, bet tik jei sutiksite žemiau.',
    currentChoice: 'Dabartinis analitikos pasirinkimas:',
    choiceAccepted: 'Sutikta',
    choiceDeclined: 'Atsisakyta',
    choiceUndecided: 'Dar neapsispręsta',
    acceptAnalytics: 'Sutikti su analitika',
    declineAnalytics: 'Atsisakyti analitikos',
    consentReloadHint:
      'Perjungus iš „Sutikta“ į „Atsisakyta“, puslapis bus perkrautas, kad „Analytics“ SDK visiškai sustotų.',
    contactH: 'Kaip su mumis susisiekti',
    contactP: 'Bet kokiu privatumo klausimu, dėl prieigos prie duomenų ar skundo:',
    effectiveH: 'Įsigaliojimo data',
    effectiveLead: (date: string) =>
      `Ši politika galioja nuo ${date}. Atnaujinsime ją čia, jei kas nors iš esmės pasikeis. Kanoninė versija skelbiama adresu`,
    done: 'Atlikta',
  },

  profile: {
    aria: 'Profilis',
    close: 'Uždaryti',
    title: 'Jūsų profilis',
    tagline: 'Paskyros informacija ir žaidimų istorija.',
    accountH: 'Paskyra',
    gameName: 'Žaidimo vardas',
    rename: 'Pervadinti',
    email: 'El. paštas',
    signInMethod: 'Prisijungimo būdas',
    providerGoogle: 'Google',
    providerEmail: 'El. paštas ir slaptažodis',
    providerUnknown: 'Nežinomas',
    emailUnverified:
      'El. paštas dar nepatvirtintas. Patikrinkite pašto dėžutę (ir šlamšto aplanką) – išsiuntėme nuorodą.',
    fallbackName: 'Žaidėjas 1',
    accountFallback: 'Paskyra',
    multiplayerH: 'Kelių žaidėjų',
    rating: 'Reitingas',
    provisional: (n: number, total: number) => `Preliminarus ${n}/${total}`,
    provisionalTitle: 'Reitingas stabilizuojasi po 10 reitinguojamų žaidimų',
    lastMatches: (n: number) => `Paskutiniai ${n} ${plural(n, 'žaidimas', 'žaidimai', 'žaidimų')}`,
    noMatches: 'Reitinguojamų žaidimų dar nėra. Pradėkite iš meniu.',
    streakH: 'Dienų serija',
    streakEmpty: 'Žaiskite šiandienos galvosūkį, kad pradėtumėte seriją. (Netrukus.)',
    currentStreak: 'Dabartinė serija',
    longest: 'Ilgiausia',
    dayN: (n: number) => `${n} d.`,
    streakHint: 'Serija skaičiuoja dienos galvosūkio užbaigimus. Praleidus dieną, ji atsistato.',
    offlineHistoryH: (name: string) => `Žaidimų istorija — „${name}“`,
    offlineEmpty:
      'Šiame įrenginyje žaidimų dar nėra. Pradėkite žaidimą su botu ar vietinį žaidimą, kad jį užpildytumėte.',
    totalGames: 'Iš viso žaidimų',
    vsBotsWDL: 'Su botais · P/L/Pr',
    hotseatWDL: 'Vietinis · P/L/Pr',
    pointsScored: 'Surinkta taškų',
    pointsGiven: 'Atiduota taškų',
    avg: (v: string) => `vid. ${v}`,
    offlineHint: 'Saugoma šiame įrenginyje pagal vardą iš nustatymų. Sinchronizavimas su debesimi – netrukus.',
    dataH: 'Jūsų duomenys',
    dataHint:
      'Pagal BDAR galite atsisiųsti visus mūsų turimus jūsų duomenis arba visiškai ištrinti paskyrą. Ištrynimas įsigalioja iškart ir yra negrįžtamas.',
    preparing: 'Ruošiama…',
    downloadData: 'Atsisiųsti mano duomenis',
    deleteAccount: 'Ištrinti mano paskyrą',
    signOut: 'Atsijungti',
    done: 'Atlikta',
    deleteFailed: 'Ištrinti nepavyko. Bandykite dar kartą.',
    deleteConfirmTitle: 'Ištrinti jūsų paskyrą?',
    deleteConfirmBody:
      'Tai visam laikui pašalina jūsų paskyrą, prisijungimą, lyderių lentelės įrašą ir ištrina jūsų vardą iš praėjusių žaidimų. Varžovai išlaiko savo reitingo istoriją. Jei žaidžiate tiesioginį žaidimą, jis bus pralaimėtas. Šio veiksmo atšaukti negalima.',
    cancel: 'Atšaukti',
    deleting: 'Trinama…',
    deleteForever: 'Ištrinti visam laikui',
  },

  signIn: {
    aria: 'Prisijungimas',
    close: 'Uždaryti',
    titleGate: 'Prisijunkite, kad žaistumėte',
    titleSignIn: 'Prisijungti',
    titleSignUp: 'Sukurti paskyrą',
    google: 'Tęsti su Google',
    orEmail: 'arba su el. paštu',
    emailPlaceholder: 'jus@pavyzdys.lt',
    passwordPlaceholder: 'Slaptažodis (min. 6 simboliai)',
    confirmPlaceholder: 'Pakartokite slaptažodį',
    submitSignIn: 'Prisijungti',
    submitSignUp: 'Sukurti paskyrą',
    newHere: 'Pirmą kartą čia?',
    createAccount: 'Sukurti paskyrą',
    haveOne: 'Jau turite paskyrą?',
    signInLink: 'Prisijungti',
    tryAnon: 'Norite išbandyti anonimiškai neprisijungę?',
    accountCreated: (email: string) =>
      `Paskyra sukurta. Jei įjungtas el. pašto patvirtinimas, patikrinkite ${email} (ir šlamšto aplanką).`,
    errPasswordsMatch: 'Slaptažodžiai nesutampa.',
    errInvalidCreds: 'Neteisingas el. paštas arba slaptažodis.',
    errAlreadyRegistered: 'Šis el. paštas jau užregistruotas. Geriau prisijunkite.',
    errWeakPassword: 'Slaptažodį turi sudaryti bent 6 simboliai.',
    errInvalidEmail: 'Šis el. paštas atrodo neteisingas.',
    errNotConfirmed: 'Pirmiausia patvirtinkite el. paštą (patikrinkite pašto dėžutę).',
    errRateLimit: 'Per daug bandymų. Pabandykite po minutės.',
    errNetwork: 'Tinklo klaida. Patikrinkite ryšį ir bandykite dar kartą.',
    errGeneric: 'Kažkas nepavyko.',
  },

  username: {
    ariaClaim: 'Pasirinkite žaidimo vardą',
    ariaRename: 'Pervadinti',
    cancel: 'Atšaukti',
    titleClaim: 'Pasirinkite žaidimo vardą',
    titleRename: 'Pervadinti',
    taglineClaim:
      'Tokį vardą matys kiti žaidėjai. Jis tik jūsų. Vėliau galėsite pervadinti.',
    taglineRename: 'Statistika seka jūsų paskyrą, o ne vardą – ji perkeliama.',
    placeholder: 'pvz. Donatas',
    claim: 'Pasirinkti vardą',
    save: 'Išsaugoti',
    signOut: 'Atsijungti',
    checking: 'Tikrinama…',
    available: 'Laisvas',
    taken: 'Užimtas – bandykite kitą',
    hint: '3–16 simbolių · raidės, skaitmenys, _ ar -',
    checkFailed: 'Patikrinti nepavyko.',
    genericError: 'Kažkas nepavyko.',
    invalidShort: 'Bent 3 simboliai.',
    invalidLong: 'Daugiausia 16 simbolių.',
    invalidChars: 'Tik raidės, skaitmenys, _ ar -.',
  },

  friendStatus: {
    menu: 'Meniu',
    'in-ai': 'Prieš botus',
    'in-hotseat': 'Vietinis žaidimas',
    'in-ranked': 'Reitinguojamas žaidimas',
    'searching-ranked': 'Ieško…',
    'in-daily': 'Dienos galvosūkis',
    offline: 'Neprisijungęs',
  },

  timeControls: {
    '1min': { label: 'Žaibas', per: '1 minutė žaidėjui', sub: 'Greitai ir įtemptai.' },
    '3min': { label: 'Blicas', per: '3 minutės žaidėjui', sub: 'Subalansuotas numatytasis.' },
    '5min': { label: 'Greitasis', per: '5 minutės žaidėjui', sub: 'Laiko pagalvoti.' },
  },

  friends: {
    online: (n: number) => `👥 ${n} prisijungę`,
    friends: '👥 Draugai',
    addFriendTitle: 'Pridėti draugą',
    onlineOfTotal: (online: number, total: number) => `${online} iš ${total} prisijungę`,
    newBadge: (n: number) => `${n} ${plural(n, 'naujas', 'nauji', 'naujų')}`,
    aria: 'Draugai',
    close: 'Uždaryti',
    title: 'Draugai',
    tabOnline: 'Prisijungę',
    tabAll: 'Visi',
    tabRequests: 'Prašymai',
    emptyOnline: 'Šiuo metu nėra prisijungusių draugų.',
    emptyAll: 'Draugų dar nėra – pridėkite žemiau.',
    addByUsername: 'Pridėti draugą pagal vardą',
    usernamePlaceholder: 'vardas',
    sending: 'Siunčiama…',
    send: 'Siųsti',
    requestSent: 'Prašymas išsiųstas.',
    requestFailed: 'Prašymo išsiųsti nepavyko.',
    removeConfirm: (name: string) => `Pašalinti ${name} iš draugų?`,
    blockConfirm: (name: string) =>
      `Užblokuoti ${name}? Šis žaidėjas negalės siųsti jums draugystės prašymų ar žaidimo kvietimų.`,
    inviteToGame: 'Pakviesti žaisti',
    friendMustBeOnMenu: 'Draugas turi būti meniu',
    invite: 'Pakviesti',
    more: 'Daugiau',
    removeFriend: 'Pašalinti draugą',
    block: 'Užblokuoti',
    statusAria: (label: string) => `Būsena: ${label}`,
    noPending: 'Laukiančių prašymų nėra.',
    incomingH: 'Gauti',
    wantsToBeFriends: 'nori draugauti',
    accept: 'Priimti',
    decline: 'Atmesti',
    sentH: 'Išsiųsti',
    waitingForThem: 'laukiama atsakymo',
    cancel: 'Atšaukti',
  },

  invite: {
    aria: 'Siųsti kvietimą',
    close: 'Uždaryti',
    title: (name: string) => `Pakviesti ${name}`,
    waiting: (name: string) => `Kvietimas išsiųstas ${name}. Laukiama, kol priims…`,
    cancelInvite: 'Atšaukti kvietimą',
    declined: (name: string) => `${name} nepriėmė kvietimo.`,
    sendAgain: 'Siųsti dar kartą',
    shapeH: 'Figūra',
    timeH: 'Laiko kontrolė',
    ranked: 'Reitinguojamas žaidimas',
    rankedHint:
      'Įskaitomas Elo tik jei varžovas taip pat sutiks žaisti reitinguojamą. Kitu atveju tai įprastas žaidimas.',
    cancel: 'Atšaukti',
    send: 'Siųsti kvietimą',
    sending: 'Siunčiama…',
    inviteFailed: 'Kvietimo išsiųsti nepavyko.',
    reasonOffline: 'yra neprisijungęs',
    reasonSearching: 'ieško varžovo',
    reasonInGame: 'jau žaidžia',
    declinedReason: (name: string, reason: string) => `${name} ${reason}.`,
    cantInviteNow: (name: string, reason: string) =>
      `${name} ${reason} – dabar pakviesti negalima.`,
    toastAria: 'Žaidimo kvietimai',
    aFriend: 'Draugas',
    invitesYou: 'kviečia jus žaisti',
    theyPickedRanked: 'Pasirinko reitinguojamą',
    declineFrom: (name: string) => `Atmesti ${name} kvietimą`,
    decline: 'Atmesti',
    acceptCasual: 'Priimti įprastą',
    acceptRanked: 'Priimti reitinguojamą',
    accept: 'Priimti',
  },

  gameOver: {
    oppWantsRematchTitle: 'Varžovas nori revanšo',
    acceptRematch: 'Priimti revanšą',
    waitingForOpponent: 'Laukiama varžovo…',
    cancel: 'Atšaukti',
    rematch: 'Revanšas',
    youWin: 'Jūs laimėjote',
    playerWins: (name: string) => `${name} laimėjo`,
    aborted: 'Žaidimas nutrauktas',
    abortedSub: 'nebuvo pirmo ėjimo · reitingas nekinta',
    draw: 'Žaidimas baigėsi lygiosiomis',
    youLost: 'Jūs pralaimėjote',
    onPoints: 'pagal taškus',
    onTime: 'pagal laiką',
    oppResigned: 'varžovas pasidavė',
    oppDisconnected: 'varžovas atsijungė',
    youResigned: 'jūs pasidavėte',
    disconnected: 'atsijungta',
    drawTitle: 'Lygiosios',
    champion: 'DotDuel čempionas',
    impossibleDefeated: 'Neįmanomas – įveiktas',
    rating: 'Reitingas',
    timesUp: '⏱ Laikas baigėsi',
    yourScore: 'Jūsų rezultatas:',
    bestToday: 'Šiandienos rekordas:',
    attemptOf: (n: number) => ` · bandymas ${n}/3`,
    streakLabel: 'Serija:',
    dayN: (n: number) => `${n} d.`,
    bestDay: (n: number) => `(rekordas: ${n} d.)`,
    attemptsLeft: (n: number) =>
      `Šiandien liko ${n} ${bandymai(n)}. Į lyderių lentelę įskaitomas geriausias rezultatas.`,
    allAttemptsUsed: 'Išnaudoti visi 3 bandymai. Grįžkite rytoj vidurnaktį (UTC).',
    savingResult: 'Išsaugoma…',
    menu: 'Meniu',
    lobby: 'Laukiamasis',
    playAgain: 'Žaisti dar kartą',
    leaderboard: 'Lyderių lentelė',
    tryAgainN: (n: number) => `Bandyti dar kartą (liko ${n})`,
    addAsFriend: (name: string) => `➕ Pridėti ${name} į draugus`,
    sendingRequest: 'Siunčiamas prašymas…',
    friendRequestSent: 'Draugystės prašymas išsiųstas.',
    couldntSend: 'Nepavyko išsiųsti – bandykite dar kartą',
    champHeadline: 'Įveikėte „DotDuel“ vieno žaidėjo režimą!',
    champBody:
      'Įveikėte kiekvieną figūrą kiekviename lygyje. Sunkiausias likęs iššūkis – tikri žmonės.',
    comingSoonTitle: 'Netrukus',
    multiplayerComingSoon: 'Keli žaidėjai · netrukus',
    impossibleHeadline: (shape: string) => `Įveikėte sunkiausią DI su figūra ${shape}.`,
    impossibleBody: (nextShape: string, beginner: string) =>
      `${nextShape} – kita jūsų viršukalnė. Pradėkite nuo „${beginner}“ ir kopkite atgal į viršų.`,
    tryShape: (shape: string) => `Išbandyti ${shape}`,
    shapeUnlockedHeadline: (shape: string) => `${shape} dabar atrakinta!`,
    shapeUnlockedBody: (shape: string) =>
      `Nauja lenta su nauja strategija. Arba likite prie figūros ${shape} ir padidinkite sudėtingumą.`,
    pushTo: (level: string, shape: string) => `Arba kilkite į „${level}“ su figūra ${shape}`,
    levelUnlockedHeadline: (level: string) => `„${level}“ atrakinta.`,
    levelUnlockedBody: 'DI ką tik patobulėjo. Pasiruošę jam?',
    tryLevel: (level: string) => `Išbandyti „${level}“`,
    niceOne: 'Puiku.',
    niceOneBody: 'Šitą jau įveikėte. Norite sunkesnės kovos?',
  },

  lobby: {
    back: '‹ Atgal',
    title: 'Keli žaidėjai',
    intro: (rating: number) =>
      `Pasirinkite laiko kontrolę. Suporuosime jus su kitu panašaus reitingo žaidėju (jūsų: ${rating}).`,
    lockedTitle: (openLabel: string) =>
      `Užrakinta, kol auga žaidėjų ratas – kol kas atviras tik „${openLabel}“, kad poravimas liktų greitas.`,
    comingBackSoon: 'Netrukus sugrįš',
    board: 'Lenta:',
    unlockHint: (nextLabel: string, n: number) =>
      `– „${nextLabel}“ atsirakins po dar ${n} reitinguojamų ${plural(n, 'žaidimo', 'žaidimų', 'žaidimų')}.`,
    findMatch: 'Rasti reitinguojamą varžovą',
  },

  matchmaking: {
    finding: 'Ieškoma varžovo…',
    waitingAtRating: (s: number) => `Laukiama jūsų reitingo žaidėjo (${s} s)`,
    stillSearching: (s: number) =>
      `Vis dar ieškoma – netrukus galime suporuoti su reitinguojamu DI (${s} s)`,
    cancelSearch: 'Atšaukti paiešką',
    rangeHint: 'Paieškos ribos plečiasi ~25 Elo per sekundę. Suporuosime su artimiausiu varžovu.',
  },

  matchFound: {
    opponentFound: 'Varžovas rastas!',
    youPlayerN: (n: number) => `Jūs · ${n} žaidėjas`,
    playerN: (n: number) => `${n} žaidėjas`,
    ready: '✓ Pasiruošęs',
    notReady: '— Nepasiruošęs',
    vs: 'prieš',
    bot: 'BOTAS',
    aiOpponent: 'DI varžovas',
    bothReady: 'Abu pasiruošę – pradedama…',
    startsIn: (s: number) => `Prasideda po ${s}`,
    shapeLine: (shape: string) => `Figūra: ${shape}. Pirmas eina 1 žaidėjas.`,
    shapeRandom: 'atsitiktinė',
    readyWaiting: '✓ Pasiruošęs – laukiama varžovo',
    readyBtn: 'Pasiruošęs!',
    backToMenu: 'Grįžti į meniu',
  },

  clock: {
    remaining: (time: string) => `liko ${time}`,
  },

  mpUnavailable: {
    heading: 'Keli žaidėjai nepasiekiami',
    blockedHint:
      'Jūsų tinklas blokuoja žaidimo serverį. Dažniausia priežastis – reklamų/sekiklių blokatorius (Whalebone, AdGuard, NextDNS, Pi-hole) arba DNS filtras telefone ar maršrutizatoriuje.',
    tryLabel: 'Pabandykite:',
    tryWifi: 'kitą „Wi-Fi“ tinklą arba mobilųjį internetą',
    tryBrowser: 'kitą naršyklę',
    tryDisableFilters: 'trumpam išjungti DNS filtrus / VPN',
    tryWhitelist: (domain: string) => `įtraukti ${domain} į blokatoriaus išimtis`,
    offlineHint: 'Žaidimas su botu veikia neprisijungus – atidarykite meniu ir pasirinkite „Botai“.',
  },

  mpConnecting: {
    heading: 'Jungiamasi prie žaidimo…',
    hint: 'Jungiamasi prie žaidimo serverio. Jei tai užtrunka ilgiau nei ~10 sekundžių, kažkas negerai — grįžkite atgal ir bandykite dar kartą.',
  },

  share: {
    title: 'DotDuel — greita 2 žaidėjų taškų strategija',
    textInvite: 'Sužaisk su manimi greitą taškų partiją.',
    textShare: 'Išbandyk „DotDuel“ – greitą 2 žaidėjų taškų strategijos žaidimą.',
    labelInvite: '➕ Pakviesti draugą',
    labelShare: 'Dalintis „DotDuel“',
    linkCopied: 'Nuoroda nukopijuota – įklijuokite bet kur',
    couldNotShare: 'Pasidalinti nepavyko – bandykite dar kartą',
    preparing: 'Ruošiama…',
    shareResult: '📤 Dalintis rezultatu',
    imageCopied: 'Paveikslėlis nukopijuotas – įklijuokite bet kur',
    imageCopyFailed: 'Nepavyko nukopijuoti paveikslėlio – bandykite „Atsisiųsti“',
    textCopied: 'Tekstas ir nuoroda nukopijuoti',
    textCopyFailed: 'Nukopijuoti nepavyko – bandykite „Atsisiųsti“',
    imageSaved: 'Paveikslėlis išsaugotas',
    dialogAria: 'Pasidalinkite rezultatu',
    dialogTitle: 'Pasidalinkite rezultatu',
    close: 'Uždaryti',
    resultCardAlt: 'Jūsų rezultato kortelė',
    copyImage: '📋 Kopijuoti paveikslėlį',
    copyTextLink: '🔗 Kopijuoti tekstą ir nuorodą',
    hintCardLink:
      'Įklijuota nuoroda automatiškai parodo kortelės paveikslėlį. Norėdami įterpti patį paveikslėlį, paspauskite „Kopijuoti paveikslėlį“ ir įklijuokite jį į įrašą.',
    hintNoCardLink:
      'Platformų mygtukai dalijasi jūsų tekstu ir nuoroda. Norėdami pridėti paveikslėlį, paspauskite „Kopijuoti paveikslėlį“ ir įklijuokite jį į įrašą.',
    downloadImage: '⬇ Atsisiųsti paveikslėlį',

    result: {
      genericBot: 'Botas',
      ptsLabel: 'tšk.',
      scanCaption: 'Nuskaitykite ir žaiskite dabar!',
      ctaWin: 'Ar pralenksite mane?',
      ctaLoss: 'Manote, kad galite geriau?',
      ctaDraw: 'Išspręskite lygiąsias?',

      tagDaily: 'DIENOS GALVOSŪKIS',
      tagVsBot: (shape: string) => `PRIEŠ BOTĄ · ${shape.toUpperCase()}`,
      tagRanked: (shape: string) => `REITINGUOJAMAS · ${shape.toUpperCase()}`,
      tagHotseat: (shape: string) => `VIETINIS ŽAIDIMAS · ${shape.toUpperCase()}`,

      dailyHeadline: 'Šiandienos galvosūkis',
      dailyCta: 'Ar pralenksite?',
      dailyShareText: (score: number, url: string) =>
        `Surinkau ${pts(score)} šiandienos „DotDuel“ galvosūkyje — ar pralenksite?\n${url}`,

      aiHeadlineWin: (level: string) => `${level} botas — nugalėtas`,
      aiHeadlineLoss: (level: string) => `${level} botas laimėjo šįkart`,
      aiHeadlineDraw: (level: string) => `Lygiosios su ${level} botu`,
      aiShareTextWin: (level: string, s1: number, s2: number, shape: string, url: string) =>
        `Įveikiau ${level} botą ${s1}–${s2} „${shape}“ lentoje „DotDuel“ žaidime — ar pavyks jums?\n${url}`,
      aiShareTextLoss: (level: string, s2: number, s1: number, url: string) =>
        `${level} botas mane įveikė ${s2}–${s1} „DotDuel“ žaidime. Manote, kad galite geriau?\n${url}`,
      aiShareTextDraw: (level: string, s1: number, s2: number, url: string) =>
        `Sužaidžiau lygiosiomis su ${level} botu ${s1}–${s2} „DotDuel“ žaidime. Ar baigsite darbą?\n${url}`,

      rankedHeadlineWin: (elo: string) => `Reitinguota pergalė${elo}`,
      rankedHeadlineLoss: 'Sunkios reitinguotos rungtynės',
      rankedHeadlineDraw: 'Reitinguotos lygiosios',
      rankedShareTextWin: (myScore: number, oppScore: number, elo: string, url: string) =>
        `Ką tik laimėjau reitinguotas „DotDuel“ rungtynes ${myScore}–${oppScore}${elo} — ar pralenksite mane?\n${url}`,
      rankedShareTextLoss: (myScore: number, oppScore: number, url: string) =>
        `Ką tik sužaidžiau reitinguotas „DotDuel“ rungtynes (${myScore}–${oppScore}). Norite sužaisti?\n${url}`,
      rankedShareTextDraw: (myScore: number, oppScore: number, url: string) =>
        `Reitinguotos rungtynės baigėsi lygiosiomis (${myScore}–${oppScore}). Išspręskite už mus?\n${url}`,

      hotseatHeadlineWin: (winnerName: string) => `${winnerName} laimėjo`,
      hotseatHeadlineDraw: 'Lygiosios',
      hotseatShareTextWin: (
        winnerName: string,
        loserName: string,
        winnerScore: number,
        loserScore: number,
        url: string,
      ) =>
        `${winnerName} įveikė ${loserName} ${winnerScore}–${loserScore} „DotDuel“ žaidime. Manote, kad galite geriau?\n${url}`,
      hotseatShareTextDraw: (p1: string, p2: string, s1: number, s2: number, url: string) =>
        `${p1} ir ${p2} sužaidė lygiosiomis ${s1}–${s2} „DotDuel“ žaidime. Išspręskite už mus?\n${url}`,
    },
  },

  rankings: {
    aria: 'Reitingai',
    backToRankings: 'Atgal į reitingus',
    closeRankings: 'Uždaryti reitingus',
    back: 'Atgal',
    close: 'Uždaryti',
    aiOpponent: 'DI varžovas',
    player: 'Žaidėjas',
    h2hTagline: 'Tarpusavio rezultatai pagal varžovą.',
    title: 'Reitingai',
    globalTagline: 'Pasaulinis Elo tarp visų kelių žaidėjų.',
    localTagline: 'Vietiniai profiliai šiame įrenginyje – žaidimų su botu ir vietinių žaidimų istorija.',
    globalElo: 'Pasaulinis Elo',
    local: 'Vietiniai',
    shape: 'Figūra:',
    all: 'Visos',
    emptyLocalAll: 'Šiame įrenginyje dar neužfiksuota nė vieno žaidimo.',
    emptyLocalShape: (shape: string) => `Su figūra ${shape} žaidimų dar nėra.`,
    colRank: '#',
    colPlayer: 'Žaidėjas',
    colGames: 'Žaidimai',
    colWinPct: 'Perg. %',
    deleteProfile: 'Ištrinti profilį',
    noH2H: 'Tarpusavio žaidimų neužfiksuota.',
    colOpponent: 'Varžovas',
    colWinPctShort: 'P %',
    colLossPctShort: 'Pr %',
    colDrawPctShort: 'L %',
    done: 'Atlikta',
    confirmAria: 'Patvirtinti profilio ištrynimą',
    deleteTitle: 'Ištrinti profilį?',
    deleteBody: (name: string) =>
      `${name} bus pašalintas iš reitingų ir iš visų tarpusavio rezultatų šiame įrenginyje.`,
    deleteConfirm2: 'Ar tikrai norite tai ištrinti? Duomenų atkurti nebus galima.',
    cancel: 'Atšaukti',
    signInPrompt: 'Prisijunkite, kad pamatytumėte pasaulinį Elo lyderių sąrašą.',
    signIn: 'Prisijungti',
    loadError: 'Nepavyko įkelti lyderių lentelės – patikrinkite ryšį.',
    tryAgain: 'Bandyti dar kartą',
    colElo: 'Elo',
    emptyGlobal: 'Reitinguojamų kelių žaidėjų žaidimų dar nesužaista. Būkite pirmas lentelės viršuje.',
    you: 'jūs',
    summaryGames: 'žaidimai',
    winRate: 'pergalių dažnis',
  },

  puzzleBoard: {
    aria: 'Galvosūkio lyderių lentelė',
    close: 'Uždaryti',
    title: 'Dienos nugalėtojai',
    tagline:
      'Dieną laimi aukščiausias rezultatas. Lygiuosius lemia, kas baigė pirmas. Atsinaujina vidurnaktį (UTC).',
    loading: 'Įkeliama…',
    empty: 'Dar niekas neužbaigė dienos galvosūkio. Būkite pirmas.',
    today: 'Šiandien',
    date: (month: string, day: number) => `${month} ${day}`,
    you: ' (jūs)',
    done: 'Atlikta',
  },

  sidePanel: {
    featuredTitle: (title: string) => `${title} — bakstelėkite pasiekimams`,
    noGames: 'dar nėra žaidimų',
    botLabel: (level: string) => `Botas · ${level}`,
    botShort: (level: number) => `Botas L${level}`,
    hotseat: 'Vietinis žaidimas',
    hotseatShort: 'VŽ',
    statsTitle: (label: string, total: number, record: string, pct: string) =>
      `${label}: ${total} žaidimų · ${record} · ${pct} pergalių`,
    pointsTitle: (games: number, scored: number, given: number, avgS: string, avgG: string) =>
      `Per ${games} žaidimus: surinkta ${scored} tšk., atiduota ${given} tšk. Vidurkiai ${avgS} / ${avgG} per žaidimą.`,
    aiLabel: (level: string) => `DI varžovas, ${level} sudėtingumas`,
  },

  achievements: {
    byId: {
      // ---- A: onboarding ----
      'first-game': { title: 'Pirmieji žingsniai', desc: 'Sužaiskite patį pirmą žaidimą.' },
      'first-win': { title: 'Nugalėtojas', desc: 'Laimėkite pirmą žaidimą.' },
      'first-claim': { title: 'Pretenzijų meistras', desc: 'Pasisavinkite pirmą laukiančią liniją.' },
      'all-shapes': { title: 'Kartografas', desc: 'Atrakinkite visas žaidžiamas lentos figūras.' },

      // ---- B/C/D: per-shape bot mastery (generated) ----
      'beat-triangle-1': { title: 'Trikampis: Naujokas įveiktas', desc: 'Įveikite Naujoko botą Trikampio lentoje.' },
      'beat-triangle-2': { title: 'Trikampis: Lengvas įveiktas', desc: 'Įveikite Lengvą botą Trikampio lentoje.' },
      'beat-triangle-3': { title: 'Trikampis: Vidutinis įveiktas', desc: 'Įveikite Vidutinį botą Trikampio lentoje.' },
      'beat-triangle-4': { title: 'Trikampis: Sunkus įveiktas', desc: 'Įveikite Sunkų botą Trikampio lentoje.' },
      'beat-triangle-5': { title: 'Trikampis: Neįmanomas įveiktas', desc: 'Įveikite Neįmanomą botą Trikampio lentoje.' },
      'grandmaster-triangle': { title: 'Trikampio didmeistris', desc: 'Įveikite visus botų lygius (nuo Naujoko iki Neįmanomo) Trikampio lentoje.' },
      'slayer-triangle-10': { title: 'Trikampio budelis', desc: 'Įveikite Neįmanomą botą 10 kartų Trikampio lentoje.' },
      'slayer-triangle-50': { title: 'Trikampio giltinė', desc: 'Įveikite Neįmanomą botą 50 kartų Trikampio lentoje.' },

      'beat-square-1': { title: 'Kvadratas: Naujokas įveiktas', desc: 'Įveikite Naujoko botą Kvadrato lentoje.' },
      'beat-square-2': { title: 'Kvadratas: Lengvas įveiktas', desc: 'Įveikite Lengvą botą Kvadrato lentoje.' },
      'beat-square-3': { title: 'Kvadratas: Vidutinis įveiktas', desc: 'Įveikite Vidutinį botą Kvadrato lentoje.' },
      'beat-square-4': { title: 'Kvadratas: Sunkus įveiktas', desc: 'Įveikite Sunkų botą Kvadrato lentoje.' },
      'beat-square-5': { title: 'Kvadratas: Neįmanomas įveiktas', desc: 'Įveikite Neįmanomą botą Kvadrato lentoje.' },
      'grandmaster-square': { title: 'Kvadrato didmeistris', desc: 'Įveikite visus botų lygius (nuo Naujoko iki Neįmanomo) Kvadrato lentoje.' },
      'slayer-square-10': { title: 'Kvadrato budelis', desc: 'Įveikite Neįmanomą botą 10 kartų Kvadrato lentoje.' },
      'slayer-square-50': { title: 'Kvadrato giltinė', desc: 'Įveikite Neįmanomą botą 50 kartų Kvadrato lentoje.' },

      'beat-rectangle-1': { title: 'Stačiakampis: Naujokas įveiktas', desc: 'Įveikite Naujoko botą Stačiakampio lentoje.' },
      'beat-rectangle-2': { title: 'Stačiakampis: Lengvas įveiktas', desc: 'Įveikite Lengvą botą Stačiakampio lentoje.' },
      'beat-rectangle-3': { title: 'Stačiakampis: Vidutinis įveiktas', desc: 'Įveikite Vidutinį botą Stačiakampio lentoje.' },
      'beat-rectangle-4': { title: 'Stačiakampis: Sunkus įveiktas', desc: 'Įveikite Sunkų botą Stačiakampio lentoje.' },
      'beat-rectangle-5': { title: 'Stačiakampis: Neįmanomas įveiktas', desc: 'Įveikite Neįmanomą botą Stačiakampio lentoje.' },
      'grandmaster-rectangle': { title: 'Stačiakampio didmeistris', desc: 'Įveikite visus botų lygius (nuo Naujoko iki Neįmanomo) Stačiakampio lentoje.' },
      'slayer-rectangle-10': { title: 'Stačiakampio budelis', desc: 'Įveikite Neįmanomą botą 10 kartų Stačiakampio lentoje.' },
      'slayer-rectangle-50': { title: 'Stačiakampio giltinė', desc: 'Įveikite Neįmanomą botą 50 kartų Stačiakampio lentoje.' },

      // ---- E: cross-shape nightmare ----
      'triple-impossible': { title: 'Košmaro naikintojas', desc: 'Įveikite Neįmanomą botą bent 3 kartus kiekvienoje figūroje.' },

      // ---- G: hot-seat volume ----
      'hotseat-5': { title: 'Sofos varžovai', desc: 'Sužaiskite 5 vietinius žaidimus.' },
      'hotseat-10': { title: 'Paduok telefoną', desc: 'Sužaiskite 10 vietinių žaidimų.' },
      'hotseat-50': { title: 'Svetainės legenda', desc: 'Sužaiskite 50 vietinių žaidimų.' },
      'hotseat-100': { title: 'Stalo žaidimų veteranas', desc: 'Sužaiskite 100 vietinių žaidimų.' },
      'hotseat-500': { title: 'Vietinių žaidimų herojus', desc: 'Sužaiskite 500 vietinių žaidimų.' },
      'hotseat-1000': { title: 'Vieno ekrano valdovas', desc: 'Sužaiskite 1 000 vietinių žaidimų.' },

      // ---- H: daily puzzle ----
      'daily-first': { title: 'Dienos debiutantas', desc: 'Sužaiskite pirmą dienos galvosūkį.' },
      'daily-streak-3': { title: 'Pagal grafiką', desc: 'Žaiskite dienos galvosūkį 3 dienas iš eilės.' },
      'daily-streak-7': { title: 'Kasdienis įprotis', desc: 'Žaiskite dienos galvosūkį 7 dienas iš eilės.' },
      'daily-streak-30': { title: 'Kalendoriaus sergėtojas', desc: 'Žaiskite dienos galvosūkį 30 dienų iš eilės.' },
      'daily-streak-100': { title: 'Nenutrūkstantis', desc: 'Žaiskite dienos galvosūkį 100 dienų iš eilės.' },
      'daily-all-attempts': { title: 'Atkaklus', desc: 'Panaudokite visus 3 bandymus per vieną dienos galvosūkį.' },
      'daily-top': { title: 'Galvosūkių čempionas', desc: 'Užimkite 1-ą vietą dienos galvosūkio lyderių lentelėje.' },

      // ---- I: consecutive-day play streak ----
      'streak-5': { title: 'Reguliarus', desc: 'Žaiskite 5 dienas iš eilės.' },
      'streak-10': { title: 'Pasišventęs', desc: 'Žaiskite 10 dienų iš eilės.' },
      'streak-50': { title: 'Atsidavęs', desc: 'Žaiskite 50 dienų iš eilės.' },
      'streak-100': { title: 'Šimtininkas', desc: 'Žaiskite 100 dienų iš eilės.' },
      'streak-300': { title: 'Nepailstantis', desc: 'Žaiskite 300 dienų iš eilės.' },
      'streak-500': { title: 'Nepalaužiamas', desc: 'Žaiskite 500 dienų iš eilės.' },
      'streak-1000': { title: 'Amžinoji liepsna', desc: 'Žaiskite 1 000 dienų iš eilės.' },

      // ---- J: distinct days played ----
      'days-7': { title: 'Pirmoji savaitė', desc: 'Žaiskite 7 skirtingomis dienomis.' },
      'days-30': { title: 'Mėnesio nuolatinis', desc: 'Žaiskite 30 skirtingų dienų.' },
      'days-100': { title: 'Šimtas dienų', desc: 'Žaiskite 100 skirtingų dienų.' },

      // ---- K: total games played ----
      'total-100': { title: 'Šimto klubas', desc: 'Sužaiskite iš viso 100 žaidimų (visais režimais).' },
      'total-500': { title: 'Penki šimtai stiprių', desc: 'Sužaiskite iš viso 500 žaidimų.' },
      'total-1000': { title: 'Tūkstantis žaidimų', desc: 'Sužaiskite iš viso 1 000 žaidimų.' },
      'total-10000': { title: 'Dešimt tūkstančių', desc: 'Sužaiskite iš viso 10 000 žaidimų.' },
      'total-50000': { title: 'Gyva legenda', desc: 'Sužaiskite iš viso 50 000 žaidimų.' },

      // ---- L: ranked volume ----
      'ranked-first': { title: 'Pirmas žingsnis', desc: 'Sužaiskite pirmą reitinguojamą internetinį žaidimą.' },
      'ranked-first-win': { title: 'Pirmas kraujas', desc: 'Laimėkite pirmą reitinguojamą internetinį žaidimą.' },
      'ranked-play-10': { title: 'Pretendentas', desc: 'Sužaiskite 10 reitinguojamų žaidimų.' },
      'ranked-play-50': { title: 'Iššūkio metėjas', desc: 'Sužaiskite 50 reitinguojamų žaidimų.' },
      'ranked-play-100': { title: 'Kovotojas', desc: 'Sužaiskite 100 reitinguojamų žaidimų.' },
      'ranked-play-500': { title: 'Mūšiuose grūdintas', desc: 'Sužaiskite 500 reitinguojamų žaidimų.' },
      'ranked-win-10': { title: 'Laimėtojas', desc: 'Laimėkite 10 reitinguojamų žaidimų.' },
      'ranked-win-50': { title: 'Užkariautojas', desc: 'Laimėkite 50 reitinguojamų žaidimų.' },
      'ranked-win-100': { title: 'Karvedys', desc: 'Laimėkite 100 reitinguojamų žaidimų.' },

      // ---- M: "on fire" ranked win streak ----
      'fire-3': { title: 'Įkaista', desc: 'Laimėkite 3 reitinguojamus žaidimus iš eilės.' },
      'fire-5': { title: 'Liepsnoja', desc: 'Laimėkite 5 reitinguojamus žaidimus iš eilės.' },
      'fire-7': { title: 'Žėruojantis', desc: 'Laimėkite 7 reitinguojamus žaidimus iš eilės.' },
      'fire-10': { title: 'Pragaras', desc: 'Laimėkite 10 reitinguojamų žaidimų iš eilės.' },
      'fire-15': { title: 'Nesustabdomas', desc: 'Laimėkite 15 reitinguojamų žaidimų iš eilės.' },
      'fire-20': { title: 'Siautulys', desc: 'Laimėkite 20 reitinguojamų žaidimų iš eilės.' },
      'fire-25': { title: 'Nepaliečiamas', desc: 'Laimėkite 25 reitinguojamus žaidimus iš eilės.' },
      'fire-50': { title: 'Legendinė serija', desc: 'Laimėkite 50 reitinguojamų žaidimų iš eilės.' },

      // ---- N: Elo milestones ----
      'elo-1100': { title: 'Kylantis', desc: 'Pasiekite 1100 reitingą.' },
      'elo-1200': { title: 'Įgudęs', desc: 'Pasiekite 1200 reitingą.' },
      'elo-1400': { title: 'Žinovas', desc: 'Pasiekite 1400 reitingą.' },
      'elo-1600': { title: 'Meistras', desc: 'Pasiekite 1600 reitingą.' },
      'elo-1800': { title: 'Didmeistris', desc: 'Pasiekite 1800 reitingą.' },
      'elo-2000': { title: 'Elitas', desc: 'Pasiekite 2000 reitingą.' },

      // ---- O: ranked skill ----
      'ranked-time-win': { title: 'Aplenk laikrodį', desc: 'Laimėkite reitinguojamą žaidimą, kai varžovui baigėsi laikas.' },
      'ranked-upset': { title: 'Milžinų nugalėtojas', desc: 'Įveikite varžovą, kurio reitingas 100+ taškų aukštesnis už jūsų.' },
      'ranked-rematch-win': { title: 'Jokių abejonių', desc: 'Laimėkite revanšą.' },

      // ---- P: line / scoring mechanics ----
      'line-8': { title: 'Pilnas komplektas', desc: 'Vienu ėjimu užbaikite 8 taškų liniją.' },
      'corner': { title: 'Kampe', desc: 'Pelnykite 1 taško kampinę liniją.' },
      'biggest-line': { title: 'Stambus laimikis', desc: 'Pelnykite vieną 6 ar daugiau taškų vertės liniją.' },
      'claim-10': { title: 'Oportunistas', desc: 'Pasisavinkite iš viso 10 laukiančių linijų.' },
      'claim-50': { title: 'Rinkėjas', desc: 'Pasisavinkite iš viso 50 laukiančių linijų.' },
      'claim-100': { title: 'Maitvanagis', desc: 'Pasisavinkite iš viso 100 laukiančių linijų.' },

      // ---- Q: social / cosmetic ----
      'add-friend': { title: 'Užmezgam draugystę', desc: 'Pridėkite pirmą draugą.' },
      'play-friend': { title: 'Draugiška varžytuvė', desc: 'Sužaiskite žaidimą su pakviestu draugu.' },
      'refer-friend': { title: 'Verbuotojas', desc: 'Pritraukite visiškai naują žaidėją per savo pakvietimo nuorodą.' },
      'share-card': { title: 'Pasipuikuok', desc: 'Pasidalinkite pergalės kortele.' },
      'all-themes': { title: 'Dekoratorius', desc: 'Išbandykite visas aštuonias spalvų temas.' },

      // ---- R: non-ranked win streaks ----
      'botstreak-3': { title: 'Karšta ranka', desc: 'Laimėkite 3 žaidimus su botais iš eilės.' },
      'botstreak-5': { title: 'Įsibėgėjimas', desc: 'Laimėkite 5 žaidimus su botais iš eilės.' },
      'botstreak-10': { title: 'Mašinų laužytojas', desc: 'Laimėkite 10 žaidimų su botais iš eilės.' },
    } as Record<string, { title: string; desc: string }>,
    tracks: {
      'Getting started': 'Pradžia',
      'Triangle bots': 'Trikampio botai',
      'Square bots': 'Kvadrato botai',
      'Rectangle bots': 'Stačiakampio botai',
      'Mastery': 'Meistriškumas',
      'Bot win streak': 'Pergalių su botais serija',
      'Hot-seat': 'Vietinis žaidimas',
      'Daily puzzle': 'Dienos galvosūkis',
      'Play streak': 'Žaidimo serija',
      'Days played': 'Žaistos dienos',
      'Milestones': 'Etapai',
      'Ranked play': 'Reitinguojami žaidimai',
      'Ranked wins': 'Reitinguojamos pergalės',
      'Ranked feats': 'Reitinguojami žygdarbiai',
      'Win streak': 'Pergalių serija',
      'Rating': 'Reitingas',
      'Scoring': 'Taškų rinkimas',
      'Claims': 'Pasisavinimai',
      'Social': 'Socialinė veikla',
    } as Record<string, string>,
    aria: 'Pasiekimai',
    close: 'Uždaryti',
    title: 'Pasiekimai',
    unlocked: 'atrakinta',
    hiddenReveal: 'Paslėptas — žaiskite toliau, kad jį atskleistumėte.',
    statusUnlocked: '✓ Atrakinta',
    statusLocked: 'Užrakinta',
    pinTitle: 'Rodyti šį ženklelį šalia jūsų vardo žaidimuose',
    featured: '★ Išskirtinis',
    pin: 'Prisegti',
    detailHint: 'Bakstelėkite ženklelį, kad pamatytumėte, už ką jis skiriamas.',
    secret: '???',
    hidden: 'Paslėptas',
    hiddenAria: 'Paslėptas pasiekimas',
    nodeTitle: (name: string, descOrHidden: string) => `${name} — ${descOrHidden}`,
    toastKicker: '🏆 Pasiekimas atrakintas',
  },

  howto: {
    aria: 'Kaip žaisti',
    close: 'Uždaryti',
    title: 'Kaip žaisti',
    tagline: 'Stebėkite kiekvieną ėjimą – lenta parodo, kas tiksliai vyksta.',
    prev: 'Atgal',
    next: 'Toliau',
    done: 'Supratau',
    scenes: {
      place: {
        title: 'Padėkite tašką',
        body: 'Per savo ėjimą bakstelėkite bet kurį tuščią tašką, kad jį nuspalvintumėte. Tada eilė pereina varžovui.',
      },
      corner: {
        title: 'Kampas duoda 1',
        body: 'Vienas kampinis taškas laikomas 1 ilgio linija – jis pats vienas duoda 1 tašką.',
      },
      lineScored: {
        title: 'Užbaikite liniją',
        body: 'Nuspalvinkite visus tiesios linijos taškus ir ji duos tiek taškų, koks jos ilgis.',
      },
      claim: {
        title: 'Pasiimkite laukiančias linijas',
        body: 'Vienas ėjimas gali užbaigti kelias linijas – taškus duoda tik ilgiausia, kitos laukia (švyti). Bakstelėkite laukiančios linijos tašką, kad pasiimtumėte jos taškus. Jas gali pasiimti bet kuris žaidėjas.',
      },
      triThreeWays: {
        title: 'Trikampis: 3 kryptys',
        body: 'Linijos eina skersai ir abiem įstrižainėmis.',
      },
      sqFourWays: {
        title: 'Kvadratas: 4 kryptys',
        body: 'Linijos eina skersai, žemyn ir abiem įstrižainėmis.',
      },
      finish: {
        title: 'Žaidimo pabaiga',
        body: 'Žaidimas baigiasi, kai užpildomi visi taškai ir paimamos visos linijos. Laimi daugiausiai taškų surinkęs; lygus rezultatas – lygiosios.',
      },
    } as Record<string, { title: string; body: string }>,
  },
};
