/**
 * Czech (Čeština). Must satisfy `Messages` (the shape from en.ts).
 *
 * Czech gaming conventions: Více hráčů, Úspěchy, Nastavení, hodnocená,
 * Vzdát se, deska (BOARD), tečka (DOT) vs bod (POINT/score) — Czech keeps them
 * distinct. Counts use plural() (one / few 2–4 / many). Register: informal
 * imperative (ty: Klepni, Vyber, Přihlas se). Reviewed in 3 native passes.
 */
import type { Messages } from './en';

/** Czech count form: one (1), few (exactly 2–4), many (0, 5+). No teen exception. */
function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}

const tecky = (n: number) => plural(n, 'tečka', 'tečky', 'teček');
const pokusy = (n: number) => plural(n, 'pokus', 'pokusy', 'pokusů');

export const cs: Messages = {
  common: {
    back: 'Zpět',
    cancel: 'Zrušit',
    close: 'Zavřít',
    locked: 'Zamčeno',
    signInToView: 'Přihlas se pro zobrazení.',
    signInToPlay: 'Přihlas se pro hru.',
  },

  lang: {
    label: 'Jazyk',
    english: 'English',
    lithuanian: 'Lietuvių',
  },

  shapes: {
    triangle: 'Trojúhelník',
    square: 'Čtverec',
    rectangle: 'Obdélník',
    rhombus: 'Kosočtverec',
  },

  difficulty: {
    1: 'Začátečnická',
    2: 'Snadná',
    3: 'Střední',
    4: 'Těžká',
    5: 'Nemožná',
  },

  menu: {
    tagline:
      'Střídavě pokládejte tečky; dokončením linie získáte body rovné její délce. Vybarvěte celou desku — vyhrává ten, kdo nasbírá více bodů.',
    welcomeLead: 'Vítej,',

    changeTheme: 'Změnit barevné téma',

    profile: 'Profil',
    signOut: 'Odhlásit se',
    signIn: 'Přihlásit se',
    shareDotDuel: 'Sdílet DotDuel',

    singlePlayer: 'Jeden hráč',
    singlePlayerSub: 'Boti a denní hádanka.',
    multiplayer: 'Více hráčů',
    multiplayerSub: 'Lokálně i online v žebříčku.',
    rankings: 'Žebříčky',
    rankingsSub: 'Hádanky, lokální i hodnocené.',

    bots: 'Boti',
    botsSub: 'Pět úrovní, od mírné po nelítostnou.',

    hotseat: 'Místní hra',
    hotseatSub: '1 zařízení · 2 hráči.',

    puzzleRankings: 'Žebříček hádanek',
    puzzleRankingsSub: 'Nejlepší dnešní výsledky hádanky.',
    localRankings: 'Lokální žebříčky',
    localRankingsSub: 'Tvé rekordy na tomto zařízení.',
    ratedRankings: 'Online žebříček',
    ratedRankingsSub: 'Světový žebříček Elo online.',
    achievements: 'Úspěchy',
    achievementsSub: 'Odznaky získané za hraní.',

    dailyPuzzle: 'Denní hádanka',
    dailyDoneSub: (best: number) => `✓ Hotovo · nejlepší ${best} · reset o půlnoci (UTC)`,
    dailyDoneTitle: 'Všechny 3 pokusy vyčerpány. Vrať se zítra.',
    dailyAttemptSub: (attempt: number, max: number, best: number) =>
      `Pokus ${attempt}/${max} · nejlepší ${best}`,
    dailyFreshSub: (max: number) => `${max} ${pokusy(max)} · 3 min · vyhrává nejlepší výsledek.`,
    dailySignInTitle: 'Přihlas se a zahraj si dnešní hádanku',

    onlineRanked: 'Online hodnocená hra',
    onlineFindMatch: 'Najdi hodnocenou hru.',
    onlineSignInTitle: 'Přihlas se pro hru online',
    onlineUnreachable: 'Server nedostupný — tvá síť ho možná blokuje.',
    onlineUnreachableTitle:
      'Tvá síť blokuje herní server (pravděpodobně blokovač reklam/sledování nebo DNS filtr)',
    onlineLocked: 'Aktivní v jiné kartě/na jiném zařízení — ukonči nebo zavři to tam.',
    onlineLockedTitle: 'Máš otevřenou hru pro více hráčů v jiné kartě nebo na jiném zařízení',

    chooseShape: 'Vyber tvar',
    chooseDifficulty: 'Vyber obtížnost',
    dots: (n: number) => `${n} ${tecky(n)}`,
    level: (d: number) => `Úroveň ${d}`,
    shapeLockedTitle: 'Poraz předchozí tvar na obtížnosti Těžká, abys odemkl další',

    whosPlaying: 'Kdo hraje?',
    vsBot: (shape: string, difficulty: string) => `${shape} · proti botovi · ${difficulty}`,
    hotseatHint: (shape: string) => `${shape} · potvrď nebo změň jména před začátkem`,
    yourNameFirst: 'Tvé jméno — hraješ první',
    player1First: 'Hráč 1 — hraje první',
    player2: 'Hráč 2',
    signedInAs: (name: string) => `Přihlášen jako ${name}. Změň v Profilu.`,
    swapColours: 'Prohodit barvy (Hráč 1 krémová · Hráč 2 zelená)',
    startGame: 'Začít hru',
    player1Placeholder: 'Hráč 1',
    player2Placeholder: 'Hráč 2',
  },

  footer: {
    rules: 'Pravidla',
    settings: 'Nastavení',
    privacy: 'Soukromí',
    theme: 'Téma',
    brand: 'DotDuel © 2026',
    brandTitle:
      '© 2026 DotDuel. Všechna práva vyhrazena. DotDuel a logo DotDuel jsou ochranné známky jejich autora.',
    versionTitle: 'Co je nového',
  },

  game: {
    ptsLeft: 'ZBÝVÁ BODŮ',
    linesToClaim: (n: number) =>
      plural(n, 'linie k zabrání', 'linie k zabrání', 'linií k zabrání'),
    pendingTitle:
      'Linie čekají na zabrání — klepni na barevnou tečku na některé z nich, abys ji zabral.',
    leaveMatch: 'Opustit hru',
    backToMenu: 'Zpět do menu',
    dailyTime: 'Tvůj čas na tento pokus',
    seeUnclaimed: 'Zobrazit nezabrané linie',
    seeUnclaimedTitle: (on: boolean) => `Zobrazit nezabrané linie: ${on ? 'zap.' : 'vyp.'}`,
    rules: 'Jak hrát',
    showRules: 'Zobrazit pravidla',
    resign: 'Vzdát se',
    resignTitle: 'Vzdát se a ukončit hru',
    resignConfirmTitle: 'Vzdát se?',
    resignConfirmBody: 'Tuto hru prohraješ.',
    resignRankedTitle: 'Vzdát tuto hodnocenou hru?',
    resignRankedBody: 'Bude započítána jako prohra ve tvém hodnocení.',
    thinking: 'Přemýšlí',
    bot: 'BOT',
    aiOpponent: 'Soupeř AI',
  },

  rules: {
    aria: 'Jak hrát DotDuel',
    close: 'Zavřít pravidla',
    title: 'Jak hrát DotDuel',
    tagline: 'Střídejte se. Dokončujte linie. Získejte nejvíce bodů.',
    goalH: 'Cíl',
    goalP: 'Získej více bodů než soupeř.',
    turnH: 'Každý tah',
    turnP: 'Proveď jednu z těchto akcí a tah přejde na soupeře:',
    turnTapEmpty: 'Klepni na prázdnou tečku, abys ji vybarvil.',
    turnTapClaim:
      'Klepni na tečku na dokončené, nezabrané linii, abys získal její body (nepokládáš novou tečku).',
    scoringH: 'Bodování',
    scoringP:
      'Linie je jakákoli rovná řada teček — vodorovná, svislá nebo úhlopříčná. Když jsou všechny její tečky vybarvené, vyplatí tolik bodů, kolik je její délka.',
    score3: 'Linie ze 3 teček → 3 body',
    score5: 'Linie z 5 teček → 5 bodů',
    score8: 'Linie z 8 teček → 8 bodů',
    scoreCorner: 'Jediná rohová tečka se počítá jako „linie“ za 1 bod',
    catchH: 'Háček — jeden tah, jedno skóre',
    catchP:
      'Pokud tvá tečka dokončí několik linií najednou, boduješ jen tu nejdelší. Ostatní dokončené linie se stanou nezabranými — kdokoli je může získat v pozdějším tahu.',
    watchH: 'Sleduj desku',
    watchP:
      'Hra nezabrané linie neoznačí. Vyhlédni si plně vybarvenou linii, která nebyla přeškrtnuta, a klepni na kteroukoli její tečku, abys ji zabral. Body zdarma za pozornost.',
    endH: 'Konec hry',
    endP:
      'Když jsou všechny tečky vybarvené a všechny dokončené linie zabrané. Vyhrává nejvyšší skóre; shodné skóre znamená remízu.',
    tipsH: 'Tipy',
    tip1: 'Vyhýbej se tahům, které dokončí dvě linie — zbytek daruješ soupeři.',
    tip2: 'Vždy si vezmi volný roh nebo velké dokončení.',
    tip3: 'Někdy je blok (0 bodů) chytřejší než malé skóre.',
    tip4: 'V závěru hry hledej nezabrané linie, než položíš tečku.',
    modesH: 'Režimy',
    modeBotsLead: 'Proti botům',
    modeBots: '— pět úrovní obtížnosti. Vyhraj na Snadné s jedním tvarem, abys odemkl další.',
    modeHotseatLead: 'Místní hra',
    modeHotseat: '— dva hráči, jedno zařízení.',
    modeMpLead: 'Více hráčů',
    modeMp: '— živě, se světovým žebříčkem Elo, šachovým měřením času a odvetami.',
    gotIt: 'Rozumím',
  },

  settings: {
    aria: 'Nastavení',
    close: 'Zavřít nastavení',
    title: 'Nastavení',
    tagline: 'Uloženo lokálně na tomto zařízení.',
    yourName: 'Tvé jméno',
    yourNameHintSignedIn: (name: string) => `Přihlášen jako ${name}. Přejmenuj v Profilu.`,
    yourNameHint: 'Používá se v režimu proti botovi A jako Hráč 1 v místní hře.',
    hotseatOpponent: 'Soupeř v místní hře',
    player2Name: 'Jméno Hráče 2',
    swapColours: 'Prohodit barvy (Hráč 1 krémová · Hráč 2 zelená)',
    privacyH: 'Soukromí',
    whoCanChallenge: 'Kdo mě může vyzvat na hru?',
    everyone: 'Všichni',
    friendsOnly: 'Jen přátelé',
    nobody: 'Nikdo',
    showStatus: 'Zobrazovat můj stav přátelům',
    showStatusHint:
      'Když je vypnuto, přátelé tě vidí jako offline. Žádosti o přátelství stále fungují; skrytý je jen indikátor stavu naživo.',
    resetProgress: 'Resetovat postup',
    resetProgressConfirm: 'Resetovat postup? Odemčené tvary a úrovně budou ztraceny.',
    resetStats: 'Resetovat statistiky',
    resetStatsConfirm:
      'Resetovat statistiky? Historie výher/remíz/proher všech hráčů na tomto zařízení bude vymazána.',
    renameNote:
      'Poznámka: přejmenováním sebe sama začneš nový řádek statistik. Historie starého jména zůstane uložena pod tímto jménem.',
    done: 'Hotovo',
  },

  theme: {
    aria: 'Vyber téma',
    close: 'Zavřít témata',
    title: 'Téma',
    tagline: 'Vyber paletu. Uloženo na tomto zařízení.',
    sunFriendly: 'Vhodné na slunce',
    done: 'Hotovo',
    taglines: {
      'forest-pearl': 'Originál. Smaragd na nefritové vinětě.',
      'royal-court': 'Fialový samet proti starému zlatu.',
      'tempo-rivals': 'Vínová červeň proti nebeské modři. Klasika.',
      'sunset-catan': 'Terakotové pouště, pergamenové figurky.',
      'coral-reef': 'Hluboká tyrkysová voda, koráloví společníci.',
      'twilight-cosmos': 'Indigová prázdnota proti elektrické azurové.',
      'monochrome-pro': 'Černobílé figurky na dřevě. Maximální kontrast.',
      'vintage-press': 'Vínový a námořnicky modrý inkoust na pergamenu. Vhodné na slunce.',
    },
  },

  changelog: {
    aria: 'Co je nového',
    close: 'Zavřít',
    title: 'Co je nového',
    tagline: 'Nejnovější aktualizace DotDuel, od nejnovější.',
    empty: 'Zatím žádné poznámky k vydání.',
    entryEmpty: 'Poznámky k vydání již brzy.',
    added: 'Přidáno',
    changed: 'Změněno',
    fixed: 'Opraveno',
    done: 'Hotovo',
    months: ['led', 'úno', 'bře', 'dub', 'kvě', 'čvn', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro'],
  },

  privacy: {
    aria: 'Zásady ochrany osobních údajů',
    close: 'Zavřít',
    title: 'Zásady ochrany osobních údajů',
    tagline: 'Co shromažďujeme, proč to shromažďujeme a jak to smazat.',
    whoH: 'Kdo jsme',
    whoP: 'DotDuel je nezávislá hra na vybarvování teček pro dva hráče. Správcem tvých osobních údajů podle GDPR je vývojář. Kontakt:',
    collectH: 'Co shromažďujeme',
    collectP: 'Jen to, co je potřeba, aby hra fungovala a zůstala férová.',
    collectAccountLead: 'Účet:',
    collectAccount:
      'e-mailová adresa, zobrazované jméno, poskytovatel přihlášení (Google nebo heslo) a datum vytvoření účtu. Zdroj: ty, prostřednictvím Supabase Auth při registraci.',
    collectRatingLead: 'Hodnocení ve hře pro více hráčů:',
    collectRating:
      'tvé aktuální Elo, počítadlo kvalifikačních her a časové razítko poslední hry. Zdroj: vypočítáno na serveru na konci každé hodnocené hry.',
    collectHistoryLead: 'Historie her:',
    collectHistory:
      'každá hodnocená hra ukládá identifikátory obou hráčů, zobrazovaná jména, konečné výsledky, změny hodnocení, tvar, časový limit, dobu trvání a způsob ukončení hry (normálně / vypršení času / vzdání).',
    collectLiveLead: 'Stav živé hry:',
    collectLive:
      'během probíhající hry pro více hráčů ukládáme desku, hodiny a čí je tah do naší databáze v reálném čase. To je smazáno krátce po skončení hry.',
    collectFriendsLead: 'Přátelé a pozvánky:',
    collectFriends:
      'tvůj seznam přátel, čekající žádosti, stav online a pozvánky do hry. Pokud ses připojil přes odkaz s pozvánkou nebo QR kód jiného hráče, zaznamenáme, který hráč tě pozval (jeho náhodný kód pozvánky — aby bylo možné v budoucnu uznat odměny za doporučení).',
    collectDeviceLead: 'Data pouze v zařízení:',
    collectDevice:
      'tvůj postup pro jednoho hráče, statistiky proti botům / místní hry, předvolba tématu a příznak „výukový program zobrazen“. Uloženo v localStorage tvého prohlížeče a nikdy nám neodesíláno.',
    collectAnalyticsLead: 'Analytika (jen pokud souhlasíš):',
    collectAnalytics:
      'události automaticky shromažďované službou Google Analytics — zobrazení stránek, model zařízení, jazyk, velikost obrazovky, anonymní ID relace. Nepropojené s tvým účtem v našem systému.',
    whyH: 'Proč to shromažďujeme (právní základy)',
    whyContractLead: 'Smlouva (čl. 6 odst. 1 písm. b):',
    whyContract:
      'účet, hodnocení, historie her, stav živé hry — vše nezbytné k provozu služby pro více hráčů, ke které ses zaregistroval.',
    whyLegitLead: 'Oprávněný zájem (čl. 6 odst. 1 písm. f):',
    whyLegit:
      'žebříček a hodnocená hra — abychom všem hráčům zajistili férové a konkurenční prostředí.',
    whyConsentLead: 'Souhlas (čl. 6 odst. 1 písm. a):',
    whyConsentAds:
      'Google Analytics A Google AdSense — oba se načtou až po kliknutí na Přijmout v liště souhlasu. Odmítnutí nebo nerozhodnutí znamená, že se nespustí ani jeden.',
    whyConsentNoAds:
      'Google Analytics — načte se až po kliknutí na Přijmout v liště souhlasu. Odmítnutí nebo nerozhodnutí znamená, že se nikdy nespustí.',
    sharedH: 'Komu jsou předávána',
    sharedAds:
      'Využíváme Supabase (databáze, ověřování, infrastruktura v reálném čase a serverless funkce, hostováno v EU) jako poskytovatele backendu, dále Google pro přihlášení a analytiku podmíněnou souhlasem, a Google AdSense k zobrazování malých reklamních bannerů na několika obrazovkách menu. Analytics i AdSense se načtou až po přijetí lišty souhlasu. Supabase a Google zpracovávají data podle svých standardních podmínek / smluv o zpracování údajů. Tvá data neprodáváme ani nesdílíme s žádnou jinou třetí stranou.',
    sharedNoAds:
      'Využíváme Supabase (databáze, ověřování, infrastruktura v reálném čase a serverless funkce, hostováno v EU) jako poskytovatele backendu a dále Google pro přihlášení a analytiku podmíněnou souhlasem. Analytics se načte až po přijetí lišty souhlasu. Supabase a Google zpracovávají data podle svých standardních podmínek / smluv o zpracování údajů. Tvá data neprodáváme ani nesdílíme s žádnou jinou třetí stranou. V současné době nevyužíváme reklamní sítě třetích stran.',
    keepH: 'Jak dlouho je uchováváme',
    keepAccountLead: 'Účet + žebříček:',
    keepAccount: 'dokud nesmažeš svůj účet.',
    keepHistoryLead: 'Historie her:',
    keepHistory: 'až 24 měsíců po skončení hry, poté trvale smazáno.',
    keepLiveLead: 'Stav živé hry:',
    keepLive: 'smazáno přibližně do 24 hodin po skončení hry.',
    keepAnalyticsLead: 'Analytika:',
    keepAnalytics: 'podle výchozího nastavení Google (aktuálně 14 měsíců pro data o událostech).',
    keepDeviceLead: 'Data pouze v zařízení:',
    keepDevice: 'zůstávají, dokud nevymažeš data prohlížeče.',
    rightsH: 'Tvá práva',
    rightsP: 'Podle GDPR máš právo na:',
    rightAccessLead: 'Přístup',
    rightAccess: 'k osobním údajům, které o tobě uchováváme — použij „Stáhnout moje data“ ve svém Profilu.',
    rightRectifyLead: 'Opravu',
    rightRectify: 'nepřesných údajů — použij tlačítko „Přejmenovat“ ve svém Profilu.',
    rightEraseLead: 'Výmaz',
    rightErase:
      'účtu („právo být zapomenut“) — použij „Smazat můj účet“ ve svém Profilu. Účinek je okamžitý.',
    rightPortLead: 'Přenositelnost',
    rightPort: 'dat — výše uvedené stažení je strojově čitelný soubor JSON, který si můžeš vzít jinam.',
    rightObjectLead: 'Námitku',
    rightObject: 'proti analytice — použij přepínač níže nebo klikni na Odmítnout v liště při prvním spuštění.',
    rightComplainLead: 'Podání stížnosti',
    rightComplain:
      'u svého národního úřadu pro ochranu osobních údajů, pokud se domníváš, že jsme s tvými údaji naložili nesprávně.',
    rankingsNoteLead: 'Důležitá poznámka k žebříčkům.',
    rankingsNote:
      'Pokud smažeš svůj účet (nebo budeš z jakéhokoli důvodu odstraněn), tvé zobrazované jméno a identifikátor účtu budou vymazány ze všech veřejných záznamů. Změny hodnocení, které jsi způsobil v Elo jiných hráčů, se však NEVRACÍ — minulé hry jsou neměnné. Soupeři, proti kterým jsi hrál, si ponechávají své zisky a ztráty hodnocení; jejich historie her ukazuje „Smazaný hráč“ tam, kde bývalo tvé jméno.',
    cookiesH: 'Soubory cookie a analytika',
    cookiesP:
      'Nepoužíváme sledovací soubory cookie. Naše přihlášení (Supabase Auth) používá vlastní úložiště relace, aby tě udrželo přihlášeného. Google Analytics používá soubory cookie, ale jen pokud níže vyjádříš souhlas.',
    currentChoice: 'Aktuální volba analytiky:',
    choiceAccepted: 'Přijato',
    choiceDeclined: 'Odmítnuto',
    choiceUndecided: 'Zatím nerozhodnuto',
    acceptAnalytics: 'Přijmout analytiku',
    declineAnalytics: 'Odmítnout analytiku',
    consentReloadHint:
      'Změna z Přijato na Odmítnuto znovu načte stránku, aby se SDK Analytics zcela zastavilo.',
    contactH: 'Jak nás kontaktovat',
    contactP: 'V případě jakýchkoli dotazů ohledně soukromí, žádostí o přístup k datům nebo stížností:',
    effectiveH: 'Datum účinnosti',
    effectiveLead: (date: string) =>
      `Tyto zásady jsou účinné od ${date}. Pokud se něco podstatného změní, aktualizujeme je zde. Kanonická verze je publikována na`,
    done: 'Hotovo',
  },
};
