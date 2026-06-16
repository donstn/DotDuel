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
    swapColours: 'Sukeisti spalvas (1 žaidėjas – kreminė · 2 žaidėjas – žalia)',
    startGame: 'Pradėti žaidimą',
    player1Placeholder: 'Žaidėjas 1',
    player2Placeholder: 'Žaidėjas 2',
  },

  footer: {
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
    thinking: 'Galvoja',
    bot: 'BOTAS',
    aiOpponent: 'DI varžovas',
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
    swapColours: 'Sukeisti spalvas (1 žaidėjas – kreminė · 2 žaidėjas – žalia)',
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
};
