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
    w: 'V',
    d: 'R',
    l: 'P',
    you: 'Ty',
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
    swapColours: 'Prohodit barvy (Hráč 1 ↔ Hráč 2)',
    startGame: 'Začít hru',
    player1Placeholder: 'Hráč 1',
    player2Placeholder: 'Hráč 2',
  },

  footer: {
    howToPlay: 'Jak hrát',
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
    boardAriaLabel: (shape: string) => `Herní deska: ${shape}`,
    liveDraw: (s1: number, s2: number) => `Konec hry. Remíza, ${s1}:${s2}.`,
    liveWin: (winner: number, s1: number, s2: number) =>
      `Konec hry. Vyhrává hráč ${winner}, ${s1}:${s2}.`,
    liveTurn: (current: number, s1: number, s2: number) =>
      `Na tahu je hráč ${current}. Skóre: hráč 1, ${s1}; hráč 2, ${s2}.`,
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
    dailyForfeitTitle: 'Opustit tento pokus?',
    dailyForfeitBody: (remaining: number, max: number) =>
      `Tímto využiješ 1 ze svých ${max} denních pokusů — po tomto zbyde ${remaining}.`,
    dailyForfeitConfirm: 'Opustit',
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
    swapColours: 'Prohodit barvy (Hráč 1 ↔ Hráč 2)',
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
    appearanceH: 'Vzhled',
    colourTheme: 'Barevné téma',
    changeTheme: 'Změnit',
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
    entries: {
      'Alpha 0.4.12.2': {
        highlight: 'Aplikace teď mluví ještě víc vaším jazykem',
        changes: [
          'Jméno soupeře AI, sdílený obrázek/text karty vítězství a několik obrazovek stavu připojení zůstávaly anglicky bez ohledu na nastavený jazyk — teď jsou přeložené.',
          'Všechny dřívější poznámky ke změnám v tomto seznamu (až úplně dozadu) jsou teď dostupné v litevštině, španělštině, portugalštině, polštině a češtině, ne jen v angličtině.',
        ],
      },
      'Alpha 0.4.12.1': {
        highlight: 'Oprava',
        changes: [
          'Opravili jsme poskakování/zmenšování desky na telefonech, když skóre přešlo z 2 na 3 číslice.',
        ],
      },
      'Alpha 0.4.12.0': {
        highlight: 'Vyladění',
        changes: [
          'Přesunuli jsme přepínač jazyka doleva nahoru, aby nepřekrýval logo (přepínač tématu zůstává vpravo nahoře).',
          'Obě hráčské karty na telefonech se nyní správně zrcadlí místo nesouměrného vzhledu.',
          'Barevné vzorky v místní hře a nastavení „prohodit barvy“ teď odpovídají zvolenému tématu místo pevné krémové/zelené kombinace.',
          'Tlačítko zpět / gesto zpět nyní krok po kroku prochází menu a obrazovky místo opuštění aplikace — hodnocené hry a pokusy o denní hádanku se stále nejprve zeptají na potvrzení.',
        ],
      },
      'Alpha 0.4.11.0': {
        highlight: 'Jak hrát',
        changes: [
          'Nový průvodce „Jak hrát“ s krátkými animovanými ukázkami na skutečné desce — sleduj, jak roh dá 1 bod, jak se dokončí linie, jak několik linií čeká na zabrání a jak linie vedou všemi směry na Trojúhelníku (3 směry) a Čtverci (4 směry). Otevřeš ho z patičky, vedle Pravidel; klepnutím na desku pozastavíš, přejetím nebo šipkami procházíš.',
          'Barevné téma se nyní vybírá v Nastavení (přesunuto z patičky, aby bylo místo pro „Jak hrát“).',
        ],
      },
      'Alpha 0.4.10.1': {
        highlight: 'Opravy',
        changes: [
          'Vyskakovací okno odemčeného úspěchu a jazykové menu jsou nyní neprůhledné a čitelné (dříve byla průhledná a prosvítal skrz ně text). Okno úspěchu je také větší.',
          'Přihlášení na novém zařízení už znovu nezobrazí všechny úspěchy, které jsi už dřív získal.',
          'Úspěch „Do rohu“ (získej body za rohovou linii za 1 bod) se nyní správně odemyká — dříve se nesledoval.',
        ],
      },
      'Alpha 0.4.10.0': {
        highlight: 'Kompletní překlad',
        changes: [
          'Celá aplikace je nyní přeložená, nejen menu. Tvůj Profil, Přátelé a pozvánky, lobby a obrazovky zápasů pro více hráčů, obrazovka konce hry, Žebříčky a žebříček denní hádanky, sdílení a všech 97 Úspěchů (názvy i popisy) se nyní zobrazují v angličtině, litevštině, španělštině, portugalštině, polštině a češtině.',
        ],
      },
      'Alpha 0.4.9.0': {
        highlight: 'Jazyky',
        changes: [
          'DotDuel nyní mluví šesti jazyky: anglicky, litevsky, španělsky, portugalsky, polsky a česky. Vyber si svůj pomocí tlačítka jazyka vpravo nahoře v menu.',
          'Hra se nyní automaticky spustí ve tvém jazyce — podle nastavení prohlížeče na webu a podle jazyka zařízení v aplikaci.',
        ],
      },
      'Alpha 0.4.8.0': {
        highlight: 'Úspěchy',
        changes: [
          'Úspěchy! Získej až 100 odznaků za hraní — poražení Botů na každém tvaru a úrovni, série výher, běhy denní hádanky, denní série a velké milníky. Najdeš je pod Žebříčky → Úspěchy; každý odznak se po odemknutí rozsvítí v barvách tvého tématu a hned dostaneš upozornění „🏆 Úspěch odemčen“.',
          'Připni si oblíbený odznak, aby se zobrazoval vedle tvého jména během hraní.',
        ],
      },
      'Alpha 0.4.7.0': {
        highlight: 'Nové menu + Boti',
        changes: [
          'Hlavní menu je nově přehledně rozdělené do tří sekcí — Jeden hráč, Více hráčů a Žebříčky — každá otevírá úhledný seznam s vlastními ikonami.',
          'Počítačoví soupeři se nyní všude nazývají „Boti“ místo „AI“.',
          'Výběr tvaru desky nebo úrovně bota nyní zobrazuje odpovídající ikonu — tvar desky a vlastní tvář každého bota podle jeho obtížnosti.',
          'Na Androidu aplikace nyní zůstává na výšku i při naklonění telefonu.',
        ],
      },
      'Alpha 0.4.6.2': {
        changes: [
          'Přepracovali jsme sdílenou výsledkovou kartu: větší deska, výsledek zobrazený jednoduše jako Výhra / Prohra / Remíza a QR kód nyní v herních barvách uprostřed desky s popiskem „Naskenuj a hraj hned!“.',
        ],
      },
      'Alpha 0.4.6.0': {
        changes: [
          'Sdílené výsledkové karty nyní obsahují skenovatelný QR kód — přátelé namíří kameru (nebo podrží prst na obrázku) a rovnou se dostanou do hry. Odkazy s pozvánkou používají soukromý kód pozvánky místo tvého ID účtu.',
        ],
      },
      'Alpha 0.4.5.3': {
        changes: [
          'Přepracovaná sdílená karta: deska nyní leží na skutečném 3D plstěném stole jako ve hře, text je vystředěný a adresu DotDuel.com je mnohem snazší přečíst.',
        ],
      },
      'Alpha 0.4.5.2': {
        changes: [
          'Sdílená karta se nyní vykresluje ve dvojnásobném rozlišení — žádné viditelné pixely při zobrazení obrázku na celou obrazovku v Messengeru nebo WhatsAppu.',
        ],
      },
      'Alpha 0.4.5.1': {
        changes: [
          'Sdílená karta: deska teď vypadá jako ve skutečné hře (sjednocená tloušťka čar, tečky se už neztrácejí na plných deskách) a skóre se už nepřekrývá s popiskem „pts“.',
        ],
      },
      'Alpha 0.4.5.0': {
        highlight: 'Rychlejší na telefonech',
        changes: [
          'Odlehčené grafické efekty během hry — hra běží znatelně plynuleji na levnějších telefonech, vzhled se přitom nezměnil.',
          'Žebříček nyní během načítání zobrazuje zástupné řádky a při výpadku připojení tlačítko pro opakování.',
          'Aktualizovány zásady ochrany osobních údajů: opraven poskytovatel backendu na Supabase, doplněna oznámení o Android aplikaci a AdMob.',
          'Android aplikace: tlačítko zpět nyní zavírá otevřená vyskakovací okna místo ukončení hry.',
        ],
      },
      'Alpha 0.4.4.0': {
        highlight: 'Sdílej svůj výsledek',
        changes: [
          'Nové tlačítko „Sdílet výsledek“ na obrazovce konce hry — vytvoří obrázek tvé dokončené desky se skóre a sdílí ho kamkoli, spolu s odkazem, přes který si tě přátelé mohou zahrát.',
        ],
      },
      'Alpha 0.4.3.0': {
        highlight: 'Přehlednější deska, větší text',
        changes: [
          'Odstranili jsme bubliny s tipy, které se objevovaly uprostřed zápasu — mihly se moc rychle na přečtení a překážely. Obrazovka Pravidel a pohled „Zobrazit nezabrané linie“ stále učí bodování.',
          'Zvětšili jsme veškerý drobný text v celé aplikaci na minimální čitelnou velikost kvůli lepší čitelnosti a přístupnosti.',
        ],
      },
      'Alpha 0.4.2.0': {
        highlight: 'Denní hádanka znovuzrozena — jedna sdílená deska, závod s časem',
        changes: [
          'Denní hádanka je nyní pro všechny stejná deska, každý den: náhodný tvar s předehraným začátkem, poté 3 minuty na hodinách na co nejvyšší skóre. Počítá se nejlepší ze 3 pokusů.',
          'Denní žebříček se nyní řídí tvým skóre (ne rozdílem oproti AI) a žebříček ukazuje vítěze každého dne za posledních 30 dní.',
        ],
      },
      'Alpha 0.4.1.0': {
        highlight: 'Barevná témata přebarví celou desku',
        changes: [
          'Barevná témata nyní přebarví celou desku — hrací plochu, kameny, oslavu výhry i tlačítka podle zvoleného schématu, místo aby pod každým tématem prosvítala zelená deska.',
          'V online zápasech se o tom, kdo táhne první, nyní rozhoduje férový hod mincí a u odvet se střídá, kdo začíná — takže v sérii zápasů má každý první tah zhruba polovinu času.',
          'Počítačový soupeř táhne rychleji, takže hry proti AI působí svižněji.',
          'Menu, vyskakovací okna a obrazovka konce hry se nyní otevírají plynuleji, s menším zpožděním.',
          'Zamčené tvary a obtížnosti nyní zobrazují jasný zámek místo vypadání jako vyšedlé nebo rozbité.',
          'Pole pro přihlašovací e-mail a heslo jsou nyní jasně viditelná a kameny jsou lépe čitelné na desce v každém tématu.',
        ],
      },
      'Alpha 0.4.0.0': {
        highlight: 'Vylepšení serveru + plynulejší hra pro více hráčů',
        changes: [
          'Přesunuli jsme hru pro více hráčů na nový, rychlejší backend pro spolehlivější zápasy.',
          'Hodiny ve hře pro více hráčů jsou nyní plynulé a férové — tvé hodiny už neposkakují ani neběží dál po tvém tahu.',
          'Pozvánky do hry zůstávají na obrazovce, dokud přítel neodpoví, a přijmout je můžeš přímo z obrazovky výsledků.',
          'Nyní tě lze automaticky najít podle uživatelského jména, takže tě přátelé mohou přidat bez dalších kroků.',
        ],
      },
      'Alpha 0.3.7.0': {
        highlight: 'Automaticky se aktualizující aplikace + oprava posouvání menu',
        changes: [
          'Aplikace se nyní aktualizuje sama — pokud sis přidal DotDuel na plochu, nové verze se stáhnou automaticky místo uvíznutí na staré verzi z mezipaměti.',
          'Na telefonech se menu nyní správně posouvá, takže je karta Žebříčky dole plně vidět.',
        ],
      },
      'Alpha 0.3.6.1': {
        highlight: 'Pozice desky na mobilu',
        changes: [
          'Deska na mobilu se nyní opravdu posune nahoru k hráčským kartám (předchozí pokus se neprojevil).',
        ],
      },
      'Alpha 0.3.6.0': {
        highlight: 'Přihlas se a hraj',
        changes: [
          'První načtení nyní otevře obrazovku „Přihlas se a hraj“ — přihlas se pro hru pro více hráčů a postup synchronizovaný v cloudu, nebo zvol „hrát anonymně“ a naskoč rovnou do hry.',
          'Na telefonech se deska nyní posune nahoru k hráčským kartám místo velké mezery nad ní.',
        ],
      },
      'Alpha 0.3.5.0': {
        highlight: 'Minulí vítězové hádanky + přehlednější žebříčky',
        changes: [
          'Žebříček hádanky má nyní záložku „Nedávní vítězové“ — kdo vyhrál v každém z posledních 30 dní, s datem u každého jména.',
          'Světový žebříček Elo nyní na prvním místě ukazuje hodnocení: pořadí, Elo, pak jméno hráče.',
        ],
      },
      'Alpha 0.3.4.0': {
        highlight: 'Oslavy výhry podle obtížnosti',
        changes: [
          'Tvá oslava výhry nyní roste s výzvou — malá sprška pro výhru nad Začátečnickým botem, postupně sílí až po plnou zlatou show za poražení Nemožného.',
        ],
      },
      'Alpha 0.3.3.0': {
        highlight: 'Čistší, vypilovanější deska — připraveno na betu',
        changes: [
          'Přepracovaný rám desky: plsť nyní sedí v rovnoměrně rozloženém, hladce zaobleném rámu s jemným vsazeným 3D vzhledem — a správně orámuje každý tvar, včetně ostrého hrotu trojúhelníku (dříve vypadal obrys nerovnoměrně).',
          'Hráčské karty ve hře nyní sedí celé na obrazovce jako zaoblené karty místo přetékání přes okraje.',
          'Opravena vyskakovací nápověda ve hře, jejíž text mohl přetékat přes desku.',
        ],
      },
      'Alpha 0.3.2.0': {
        highlight: 'Prémiovější vzhled · oslavy výhry',
        changes: [
          'Vizuální vylepšení — tlačítka a karty Proti botovi / tvar / obtížnost nyní mají skutečnou hmatatelnou 3D hloubku (při najetí myší se nadzvednou, po kliknutí se zamáčknou) a hlavní tlačítka odpovídají barvě aktuálního tématu místo stálé zelené.',
          'Oslavy výhry! Dokončení hry výhrou spustí ohňostroj a konfety — s přehnanou zlatou show za poražení Nemožné AI.',
        ],
      },
      'Alpha 0.3.1.0': {
        highlight: 'Rovnou do hry · přehlednější návod na hlavní obrazovce',
        changes: [
          'Odstranili jsme úvodní vyskakovací výukový program — hra se nyní otevře rovnou do menu. Návod, jak hrát, je jeden jasný řádek přímo na hlavní obrazovce a kompletní pravidla jsou vždy na dosah přes tlačítko ?.',
        ],
      },
      'Alpha 0.3.0.0': {
        highlight: 'Reklamy podporují bezplatnou hru · ochrana proti nenastoupení ve hře pro více hráčů',
        changes: [
          'V menu a na bezplatných obrazovkách pro jednoho hráče (Proti botovi, Místní hra, Denní) se nyní zobrazují malé reklamy, aby DotDuel zůstal zdarma. Během hodnocených zápasů pro více hráčů žádné reklamy nejsou. Souhlas řeší dialog ochrany soukromí od Google.',
          'Ochrana proti nenastoupení ve hře pro více hráčů: pokud hráč neprovede svůj první tah do 10 sekund, hra se přeruší beze změny hodnocení pro obě strany — takže odpojení nebo rozptýlení na začátku tě nikdy nic nestojí.',
        ],
      },
      'Alpha 0.2.9.0': {
        highlight: 'Vizuální proměna + čitelnost v každém tématu',
        changes: [
          'Nový vzhled: nové písmo, orámovaná deska odpovídající každému tvaru (trojúhelník, kosočtverec, čtverec), jasnější kameny a přehlednější skóre.',
          'Hráčské panely se plynule zmenšují s velikostí obrazovky — na telefonech se sbalí do kompaktní karty s avatarem vedle jména, čímž deska získá více místa.',
          'Nastavení, Pravidla a Soukromí jsou nyní uspořádány do přehledných karet, které se snáz procházejí.',
          'Prázdné tečky jsou nyní dobře čitelné v každém tématu místo splývání s deskou — zejména u světlých témat.',
          'Tlačítka, obrazovka konce hry a vyskakovací okna už nejsou špatně čitelná u světlých témat (Monochrome Pro, Vintage Press) — text a pozadí mají všude správný kontrast.',
        ],
      },
      'Alpha 0.2.8.0': {
        highlight: 'Plné ovládání klávesnicí',
        changes: [
          'Plné ovládání klávesnicí: Tabem přejdi na desku, šipkami se pohybuj mezi tečkami, Enterem nebo mezerníkem polož tečku nebo zaber linii.',
          'Hodnocené zápasy ti nyní najdou botího soupeře asi za 15 sekund, pokud není k dispozici žádný člověk, místo až minuty.',
        ],
      },
      'Alpha 0.2.7.2': {
        highlight: 'Oprava: blikání / černá obrazovka v koncovce',
        changes: [
          'Blikání (a občasná černá obrazovka) uprostřed až na konci hry na plnějších deskách je pryč. Každá dokončená linie se dříve vykreslovala s aditivním prolínacím efektem pro jasnější zvýraznění; na Čtverci a Obdélníku to naskládalo desítky vrstev GPU kompozitoru, což nakonec přetížilo grafickou paměť mobilu. Linie se nyní vykreslují jednoduchými barvami s vysokým kontrastem — jasný „stužkový“ vzhled zůstal, pád aplikace ne.',
        ],
      },
      'Alpha 0.2.7.1': {
        highlight: 'Oprava: konec blikání na Čtverci/Obdélníku',
        changes: [
          'Zvýraznění „Zobrazit nezabrané linie“ se nyní zobrazuje jen na desce Trojúhelník. Na Čtverci a Obdélníku občas způsobovalo blikání a ztmavnutí obrazovky, když bylo nezabraných linií hodně. Přepínač je na těchto tvarech skrytý, dokud nebude tato vizuální chyba opravena.',
        ],
      },
      'Alpha 0.2.7.0': {
        highlight: 'Denní hádanka: 3 pokusy + žebříček',
        changes: [
          'Na dnešní hádanku nyní máš 3 pokusy místo 1. Počítá se tvůj nejlepší rozdíl — série se stále navýší po tvém prvním dokončení dne.',
          'Nová karta „Žebříček hádanky“ v menu. Živě ukazuje dnešní nejlepší rozdíly seřazené od největšího po nejmenší. Při shodě rozhoduje, kdo dokončil dřív. Historické žebříčky (podle dne, měsíce, hledání jména) přijdou brzy.',
        ],
      },
      'Alpha 0.2.6.0': {
        highlight: 'Dnešní hádanka',
        changes: [
          'Nová karta „Dnešní hádanka“ v menu. Jeden pokus denně proti Těžkému botovi na střídajícím se tvaru. Skóre je tvůj rozdíl (ty mínus AI) a každá výhra přidá den do tvé série v Profilu. Zítřejší hádanka se odemkne o půlnoci (UTC).',
          'Pro hraní denní hádanky a budování série je nutné přihlášení — série je vázaná na tvůj účet, takže funguje napříč zařízeními.',
        ],
      },
      'Alpha 0.2.5.0': {
        highlight: 'Základy denní série',
        changes: [
          'Nová sekce „Denní série“ v tvém Profilu, připravená na denní hádanku (přijde příště). Jakmile hádanka vyjde, její denní dokončování buduje tvou sérii napříč všemi zařízeními — uloženo na tvém účtu, ne v prohlížeči, takže přežije vymazání mezipaměti i výměnu zařízení.',
        ],
      },
      'Alpha 0.2.4.0': {
        highlight: 'Sdílení + pozvánka z menu',
        changes: [
          'Nyní můžeš sdílet DotDuel přímo z hlavního menu. Přihlášení hráči mají „Pozvat přítele“ — odkazy nesou tvé doporučení, takže se s tebou noví hráči automaticky spřátelí po registraci. Nepřihlášení uvidí pod přihlášením odkaz „Sdílet DotDuel“ pro rychlé jednoduché sdílení hry.',
        ],
      },
      'Alpha 0.2.3.0': {
        highlight: 'Nápovědy při učení + přepínač zabratelných linií',
        changes: [
          'Kontextové nápovědy, které se zobrazí jen jednou, jak se učíš hrát: poprvé, když skóruješ, poprvé, když jeden tah uzavře dvě linie (pravidlo „boduje jen nejdelší“), poprvé, když na tebe na začátku tahu čeká nezabraná linie, a ke konci hry.',
          'Nový přepínač s ikonou oka „Zobrazit zabratelné linie“ vedle tlačítka pravidel v režimu proti botovi Začátečník/Snadná/Střední/Těžká. Ve výchozím stavu zapnuto pro Začátečník–Střední, vypnuto pro Těžkou. Skryto v Nemožné, místní hře a hře pro více hráčů — čtení desky je součástí výzvy.',
          'Vnitřní úložiště nastavení bylo aktualizováno; budeš požádán o opětovné zadání jména a při prvním načtení znovu uvidíš úvodní vyskakovací okno. Statistiky, odemčení a data účtu nejsou ovlivněny.',
        ],
      },
      'Alpha 0.2.2.0': {
        highlight: 'Viditelné bodování',
        changes: [
          'Bodování je nyní viditelné: plovoucí +N vyskočí z tečky, která dokončila linii, ve tvé barvě, tvůj odznak skóre se rozpulzuje při změně a odznak „linie k zabrání“ se rozbliká, jakmile přibude nová čekající linie.',
        ],
      },
      'Alpha 0.2.1.0': {
        highlight: 'Telemetrie v zákulisí',
        changes: [
          'Interní: přidána anonymní analytika chování pro hráče, kteří přijali cookie lištu — pomáhá nám vidět, kde nové hráče hra frustruje, abychom to mohli vyladit. Žádná osobní data neopouštějí zařízení.',
        ],
      },
      'Alpha 0.2.0.0': {
        highlight: 'Přátelé a pozvánky',
        changes: [
          'Seznam přátel. Přidej přítele podle uživatelského jména, sleduj, kteří přátelé jsou online a co dělají (proti botovi, místní hra, hodnocený zápas), pozvi přítele do konkrétní hry (vlastní volba tvaru, měření času, hodnocená nebo přátelská). Pozvánky, které dostaneš během hry, zůstanou ve frontě a objeví se, jakmile se vrátíš do menu. Hodnocená pozvánka se počítá do Elo, jen pokud obě strany zvolí Hodnocenou; jinak jde o přátelský zápas. Po zápase pro více hráčů můžeš soupeře jedním klepnutím přidat jako přítele.',
          'Pozvi přítele: pozvi lidi, ať zkusí DotDuel — zatím nepotřebují účet. Použij sdílecí nabídku telefonu nebo e-mailového klienta; jejich adresu nikdy neuvidíme. Až se zaregistrují, automaticky od nich dostaneš žádost o přátelství.',
          'Nastavení → Soukromí: vyber, kdo tě může vyzvat na hru (Všichni / Jen přátelé / Nikdo) a jestli je tvůj stav naživo viditelný přátelům.',
        ],
      },
      'Alpha 0.1.5.0': {
        highlight: 'Úklid backendu',
        changes: [
          'Interní: stav hry pro více hráčů zcela přesunut na nový přenosový kanál. Stará cesta přes Realtime Database se pro herní data už nepoužívá. Žádný viditelný rozdíl — pokud vůbec, tak nepatrně svižnější.',
        ],
      },
      'Alpha 0.1.4.4': {
        highlight: 'Obnovení vede domů',
        changes: [
          'Tvrdé obnovení stránky po dokončené hře nyní vede zpět do hlavního menu místo opětovného přehrání stejné obrazovky konce hry při každém načtení.',
        ],
      },
      'Alpha 0.1.4.3': {
        highlight: 'Tlačítko Připraven + úklid neaktivních karet',
        changes: [
          'Tlačítko Připraven nyní reaguje okamžitě po klepnutí místo čekání na síťovou odezvu, a proti botovi hra začne ve chvíli, kdy ho stiskneš (bez čekání na odpočet).',
          'Pokud jsi převzal relaci pro více hráčů na druhém zařízení, první zařízení už nezobrazuje přízračný konec hry za zápas, který jsi dokončil jinde.',
        ],
      },
      'Alpha 0.1.4.2': {
        highlight: 'Obnova zamčené relace',
        changes: [
          'Pokud předchozí relace uvízla s podrženým zámkem pro více hráčů, nyní můžeš klepnutím na tlačítko Více hráčů relaci zde převzít, místo čekání, až se zámek sám uvolní.',
          'Uvíznuté zámky relace se nyní samy uvolní dvakrát rychleji (za 45 s místo 90 s), když je držící karta pryč.',
        ],
      },
      'Alpha 0.1.4.1': {
        highlight: 'Vyladění hry pro více hráčů',
        changes: [
          'Tlačítko Připraven nyní opravdu spustí hru, jakmile ho stisknou obě strany (proti botovi to znamená hned, jak ho stiskneš ty).',
          'První tah zápasu už soupeři netrvá 8-9 sekund, než zareaguje.',
          'Přihlášení na druhém zařízení už tě omylem nepřehodí do tvé aktivní hry na prvním.',
          'Tlačítka menu zarovnána na stejnou velikost pro čistší vzhled.',
        ],
      },
      'Alpha 0.1.4.0': {
        highlight: 'Hra pro více hráčů nyní funguje na více sítích',
        changes: [
          'Hra pro více hráčů se nyní připojí i v sítích, které dříve herní server blokovaly (Whalebone, AdGuard, NextDNS, Brave Shields a podobné DNS filtry). Hra používá novou přenosovou cestu, která jde přes běžné HTTPS a není blokována seznamy proti sledovacím prvkům. Pokud ti hra pro více hráčů dřív uvízla na načítací obrazovce, zkus to znovu.',
        ],
      },
      'Alpha 0.1.3.6': {
        highlight: 'Oprava zobrazení hodin',
        changes: [
          'Zobrazení hodin ve hře pro více hráčů už při každém tahu neblikne.',
        ],
      },
      'Alpha 0.1.3.5': {
        highlight: 'Přátelská zpráva o offline stavu',
        changes: [
          'Pokud tvá síť blokuje herní server (běžné u mobilních blokovačů reklam/sledování jako AdGuard, NextDNS nebo Whalebone), hra pro více hráčů nyní místo uvíznutí na načítací obrazovce zobrazí jasné vysvětlení s tipy na řešení. Hra proti botovi funguje offline jako obvykle.',
        ],
      },
      'Alpha 0.1.3.1': {
        highlight: 'Oprava tlačítek na mobilu',
        changes: [
          'Tlačítka Více hráčů a Odhlásit se občas v prohlížečích s přísným soukromím na mobilu (Brave, Firefox Focus) nic neudělala. Rozhraní se nyní přepne okamžitě a úklid proběhne na pozadí.',
        ],
      },
      'Alpha 0.1.3.0': {
        highlight: 'Armáda botů — nikdy nečekej sám',
        changes: [
          'Pokud se do ~15 s nenajde žádný člověk, spárujeme tě s hodnoceným AI soupeřem (Pip, Cricket, Ranger, Knight nebo Voidstar). Počítají se do Elo a objevují se v žebříčku.',
          'Obrazovka hledání ti nyní řekne, kdy může nastoupit bot.',
          'Tlačítko Odveta se nyní skryje, když byl soupeřem bot (boti odvety nepřijímají).',
        ],
      },
      'Alpha 0.1.2.5': {
        highlight: 'Navazující oprava registrace',
        changes: [
          'Výběr uživatelského jména nyní funguje, i když předchozí pokus o registraci zanechal napůl dokončený profil',
          'Tlačítko Odhlásit se na obrazovce výběru jména, abys nikdy nezůstal zaseknutý',
        ],
      },
      'Alpha 0.1.2.4': {
        highlight: 'Oprava registrace',
        changes: [
          'Registrace nového účtu už při výběru uživatelského jména neselže s chybou „chybějící oprávnění“',
        ],
      },
      'Alpha 0.1.2.3': {
        highlight: 'Sdílitelné odkazy + zabezpečení',
        changes: [
          'Ikona na kartě prohlížeče a ikona na ploše — dvě tečky DotDuelu se objeví všude, kam si hru přidáš do záložek nebo nainstaluješ.',
          'Náhledy při sdílení — vložení odkazu na DotDuel do Discordu, Telegramu, Slacku nebo Twitteru nyní vykreslí kartu se slovní značkou a sloganem místo prázdného rámečku.',
          'Změny uživatelského jména nyní probíhají atomicky — staré jméno se uvolní a nové zabere v jedné operaci.',
          'Zákulisní zpřísnění zabezpečení — přísnější zásady zabezpečení obsahu, limity počtu požadavků na serveru pro mazání účtu a kontrolu jmen, plánovaný úklid dokončených her (do ~24 h dle zásad soukromí) a hashovaná ID uživatelů v serverových záznamech.',
        ],
      },
      'Alpha 0.1.2.2': {
        highlight: 'Tempo hry pro více hráčů + čitelnost',
        changes: [
          'Tvar desky pro hru pro více hráčů se odemyká po 50 a 100 hodnocených hrách (Čtverec, poté Obdélník).',
          'Kulka (1 min) a Rapid (5 min) dočasně zamčené — zatím dostupný jen Blesk (3 min), dokud poroste hráčská základna.',
          'Vyskakovací pravidla nyní uvádí, že hra pro více hráčů je spuštěná.',
          'Nadpisy „Šampion DotDuel“ a „Nemožná — poražena“ byly na světlých tématech neviditelné.',
        ],
      },
      'Alpha 0.1.2.1': {
        highlight: 'Vyladění tématu',
        changes: [
          'Každé barevné téma má nyní vlastní barvy textu a slovní značky místo přebírání výchozí zelené.',
          'Odznak „Předběžné“ byl na pergamenovém tématu Vintage Press neviditelný.',
        ],
      },
      'Alpha 0.1.2': {
        highlight: 'Vylepšení UX',
        changes: [
          'Výběr tématu je nyní dostupný z každé obrazovky přes patičku.',
          'Hodiny viditelné na mobilu ve hře pro více hráčů.',
          'Zvýraznění posledního tahu nyní ukazuje soupeřovu tečku, ne tvou.',
          'Obrazovka výhry ti nyní řekne, JAK jsi vyhrál (na čas / na body / soupeř se vzdal).',
          'Vyskakovací okna na mobilu nešlo zavřít — tlačítko zavřít je nyní spolehlivě dosažitelné.',
          'Pilulka v patičce se na úzkých telefonech nyní zalomí na druhý řádek místo oříznutí.',
          'Výběr tématu a další vyskakovací okna jsou nyní správně posouvatelná, když je obsah vyšší než obrazovka.',
          'Vyskakovací okna byla na desktopu nečitelná, když byla vidět cookie lišta — velikost vyskakovacích oken nyní správně počítá s místem pro ni.',
        ],
      },
      'Alpha 0.1': {
        highlight: 'DotDuel jde do světa!',
        changes: [
          'Veřejné spuštění alfa verze — hra pro více hráčů, žebříček, témata, režim vhodný na slunce.',
        ],
      },
    } as Record<string, { highlight?: string; changes: string[] }>,
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

  profile: {
    aria: 'Profil',
    close: 'Zavřít',
    title: 'Tvůj profil',
    tagline: 'Informace o účtu + offline historie.',
    accountH: 'Účet',
    gameName: 'Herní jméno',
    rename: 'Přejmenovat',
    email: 'E-mail',
    signInMethod: 'Způsob přihlášení',
    providerGoogle: 'Google',
    providerEmail: 'E-mail a heslo',
    providerUnknown: 'Neznámý',
    emailUnverified:
      'E-mail zatím nebyl ověřen. Zkontroluj svou schránku (i složku se spamem) a najdi odkaz, který jsme ti poslali.',
    fallbackName: 'Hráč 1',
    accountFallback: 'Účet',
    multiplayerH: 'Více hráčů',
    rating: 'Hodnocení',
    provisional: (n: number, total: number) => `Předběžné ${n}/${total}`,
    provisionalTitle: 'Hodnocení se ustálí po 10 hodnocených hrách',
    lastMatches: (n: number) => `Posledních ${n} ${plural(n, 'hra', 'hry', 'her')}`,
    noMatches: 'Zatím žádné hodnocené hry. Zařaď se do fronty z menu.',
    streakH: 'Denní série',
    streakEmpty: 'Zahraj si dnešní hádanku a začni sérii. (Již brzy.)',
    currentStreak: 'Aktuální série',
    longest: 'Nejdelší',
    dayN: (n: number) => `${n}. den`,
    streakHint: 'Série počítá dokončené denní hádanky. Vynech den a vynuluje se.',
    offlineHistoryH: (name: string) => `Offline historie — „${name}“`,
    offlineEmpty:
      'Na tomto zařízení zatím žádné hry. Začni hru proti botovi nebo místní hru, abys ji naplnil.',
    totalGames: 'Celkem her',
    vsBotsWDL: 'Proti botům · V/R/P',
    hotseatWDL: 'Místní hra · V/R/P',
    pointsScored: 'Získané body',
    pointsGiven: 'Darované body',
    avg: (v: string) => `průměr ${v}`,
    offlineHint: 'Uloženo na tomto zařízení pod jménem z Nastavení. Synchronizace s cloudem přijde příště.',
    dataH: 'Tvá data',
    dataHint:
      'Podle GDPR si můžeš stáhnout vše, co o tobě uchováváme, nebo svůj účet úplně smazat. Smazání je okamžité a nelze ho vrátit zpět.',
    preparing: 'Připravuji…',
    downloadData: 'Stáhnout moje data',
    deleteAccount: 'Smazat můj účet',
    signOut: 'Odhlásit se',
    done: 'Hotovo',
    deleteFailed: 'Smazání se nezdařilo. Zkus to prosím znovu.',
    deleteConfirmTitle: 'Smazat tvůj účet?',
    deleteConfirmBody:
      'Tímto trvale odstraníš svůj účet, přihlášení a záznam v žebříčku a tvé jméno bude vymazáno z minulých her. Soupeři si ponechají svou historii hodnocení. Pokud jsi v živé hře, bude prohrána kontumačně. Toto nelze vrátit zpět.',
    cancel: 'Zrušit',
    deleting: 'Mažu…',
    deleteForever: 'Smazat navždy',
  },

  signIn: {
    aria: 'Přihlášení',
    close: 'Zavřít',
    titleGate: 'Přihlas se pro hru',
    titleSignIn: 'Přihlásit se',
    titleSignUp: 'Vytvořit účet',
    google: 'Pokračovat přes Google',
    orEmail: 'nebo e-mailem',
    emailPlaceholder: 'ty@priklad.cz',
    passwordPlaceholder: 'Heslo (min. 6 znaků)',
    confirmPlaceholder: 'Potvrď heslo',
    submitSignIn: 'Přihlásit se',
    submitSignUp: 'Vytvořit účet',
    newHere: 'Jsi tu nový?',
    createAccount: 'Vytvoř si účet',
    haveOne: 'Už nějaký máš?',
    signInLink: 'Přihlásit se',
    tryAnon: 'Chceš to zkusit anonymně bez přihlášení?',
    accountCreated: (email: string) =>
      `Účet vytvořen. Pokud je zapnuto potvrzení e-mailem, zkontroluj ${email} (i spam) a ověř ho.`,
    errPasswordsMatch: 'Hesla se neshodují.',
    errInvalidCreds: 'E-mail nebo heslo je nesprávné.',
    errAlreadyRegistered: 'Tento e-mail je již zaregistrován. Přihlas se místo toho.',
    errWeakPassword: 'Heslo musí mít alespoň 6 znaků.',
    errInvalidEmail: 'Tento e-mail nevypadá správně.',
    errNotConfirmed: 'Nejprve prosím potvrď svůj e-mail (zkontroluj schránku).',
    errRateLimit: 'Příliš mnoho pokusů. Zkus to znovu za minutu.',
    errNetwork: 'Chyba sítě. Zkontroluj připojení a zkus to znovu.',
    errGeneric: 'Něco se pokazilo.',
  },

  username: {
    ariaClaim: 'Vyber si herní jméno',
    ariaRename: 'Přejmenovat',
    cancel: 'Zrušit',
    titleClaim: 'Vyber si herní jméno',
    titleRename: 'Přejmenovat',
    taglineClaim:
      'Toto uvidí ostatní hráči. Je jedinečné pro tebe. Později se můžeš přejmenovat.',
    taglineRename: 'Statistiky se vážou k tvému účtu, ne ke jménu — přenesou se.',
    placeholder: 'např. Donatas',
    claim: 'Zabrat jméno',
    save: 'Uložit',
    signOut: 'Odhlásit se',
    checking: 'Kontroluji…',
    available: 'Dostupné',
    taken: 'Obsazeno — zkus jiné',
    hint: '3–16 znaků · písmena, číslice, _ nebo -',
    checkFailed: 'Kontrola se nezdařila.',
    genericError: 'Něco se pokazilo.',
    invalidShort: 'Alespoň 3 znaky.',
    invalidLong: 'Maximálně 16 znaků.',
    invalidChars: 'Jen písmena, číslice, _ nebo -.',
  },

  friendStatus: {
    menu: 'V menu',
    'in-ai': 'Proti botům',
    'in-hotseat': 'Místní hra',
    'in-ranked': 'Hodnocená hra',
    'searching-ranked': 'Hledá…',
    'in-daily': 'Dnešní hádanka',
    offline: 'Offline',
  },

  timeControls: {
    '1min': { label: 'Kulka', per: '1 minuta na hráče', sub: 'Rychlé a zběsilé.' },
    '3min': { label: 'Blesk', per: '3 minuty na hráče', sub: 'Vyvážená volba.' },
    '5min': { label: 'Rapid', per: '5 minut na hráče', sub: 'Čas na přemýšlení.' },
  },

  friends: {
    online: (n: number) => `👥 ${n} online`,
    friends: '👥 Přátelé',
    addFriendTitle: 'Přidat přítele',
    onlineOfTotal: (online: number, total: number) => `${online} z ${total} online`,
    newBadge: (n: number) => `${n} ${plural(n, 'nová', 'nové', 'nových')}`,
    aria: 'Přátelé',
    close: 'Zavřít',
    title: 'Přátelé',
    tabOnline: 'Online',
    tabAll: 'Všichni',
    tabRequests: 'Žádosti',
    emptyOnline: 'Právě teď není online žádný přítel.',
    emptyAll: 'Zatím žádní přátelé — přidej někoho níže.',
    addByUsername: 'Přidat přítele podle jména',
    usernamePlaceholder: 'jméno',
    sending: 'Odesílám…',
    send: 'Odeslat',
    requestSent: 'Žádost odeslána.',
    requestFailed: 'Žádost se nezdařila.',
    removeConfirm: (name: string) => `Odebrat ${name} z přátel?`,
    blockConfirm: (name: string) =>
      `Zablokovat ${name}? Nebude ti moci posílat žádosti o přátelství ani pozvánky do hry.`,
    inviteToGame: 'Pozvat do hry',
    friendMustBeOnMenu: 'Přítel musí být v menu',
    invite: 'Pozvat',
    more: 'Více',
    removeFriend: 'Odebrat přítele',
    block: 'Zablokovat',
    statusAria: (label: string) => `Stav: ${label}`,
    noPending: 'Žádné čekající žádosti.',
    incomingH: 'Příchozí',
    wantsToBeFriends: 'chce být tvým přítelem',
    accept: 'Přijmout',
    decline: 'Odmítnout',
    sentH: 'Odeslané',
    waitingForThem: 'čeká se na ně',
    cancel: 'Zrušit',
  },

  invite: {
    aria: 'Odeslat pozvánku',
    close: 'Zavřít',
    title: (name: string) => `Pozvat ${name}`,
    waiting: (name: string) => `Pozvánka odeslána hráči ${name}. Čeká se na přijetí…`,
    cancelInvite: 'Zrušit pozvánku',
    declined: (name: string) => `${name} pozvánku nepřijal.`,
    sendAgain: 'Odeslat znovu',
    shapeH: 'Tvar',
    timeH: 'Měření času',
    ranked: 'Hodnocená hra',
    rankedHint:
      'Počítá se do Elo, jen pokud soupeř také přijme hodnocenou hru. Jinak jde o přátelskou hru.',
    cancel: 'Zrušit',
    send: 'Odeslat pozvánku',
    sending: 'Odesílám…',
    inviteFailed: 'Pozvánka se nezdařila.',
    reasonOffline: 'je offline',
    reasonSearching: 'hledá hru',
    reasonInGame: 'je ve hře',
    declinedReason: (name: string, reason: string) => `${name} ${reason}.`,
    cantInviteNow: (name: string, reason: string) =>
      `${name} ${reason} — teď ho nelze pozvat.`,
    toastAria: 'Pozvánky do hry',
    aFriend: 'Přítel',
    invitesYou: 'tě zve',
    theyPickedRanked: 'Vybral hodnocenou hru',
    declineFrom: (name: string) => `Odmítnout pozvánku od ${name}`,
    decline: 'Odmítnout',
    acceptCasual: 'Přijmout přátelskou',
    acceptRanked: 'Přijmout hodnocenou',
    accept: 'Přijmout',
  },

  gameOver: {
    oppWantsRematchTitle: 'Tvůj soupeř chce odvetu',
    acceptRematch: 'Přijmout odvetu',
    waitingForOpponent: 'Čeká se na soupeře…',
    cancel: 'Zrušit',
    rematch: 'Odveta',
    youWin: 'Vyhráváš',
    playerWins: (name: string) => `${name} vyhrává`,
    aborted: 'Hra přerušena',
    abortedSub: 'žádný první tah · žádná změna hodnocení',
    draw: 'Hra skončila remízou',
    youLost: 'Prohrál jsi',
    onPoints: 'na body',
    onTime: 'na čas',
    oppResigned: 'soupeř se vzdal',
    oppDisconnected: 'soupeř se odpojil',
    youResigned: 'vzdal ses',
    disconnected: 'odpojeno',
    drawTitle: 'Remíza',
    champion: 'Šampion DotDuel',
    impossibleDefeated: 'Nemožná — poražena',
    rating: 'Hodnocení',
    timesUp: '⏱ Čas vypršel',
    yourScore: 'Tvé skóre:',
    bestToday: 'Nejlepší dnes:',
    attemptOf: (n: number) => ` · pokus ${n}/3`,
    streakLabel: 'Série:',
    dayN: (n: number) => `${n}. den`,
    bestDay: (n: number) => `(nejlepší: ${n}. den)`,
    attemptsLeft: (n: number) =>
      `Dnes ${plural(n, 'ti zbývá', 'ti zbývají', 'ti zbývá')} ${n} ${pokusy(n)}. Na žebříčku se počítá tvůj nejlepší.`,
    allAttemptsUsed: 'Všechny 3 pokusy vyčerpány. Vrať se zítra o půlnoci (UTC).',
    savingResult: 'Ukládám výsledek…',
    menu: 'Menu',
    lobby: 'Lobby',
    playAgain: 'Hrát znovu',
    leaderboard: 'Žebříček',
    tryAgainN: (n: number) => `Zkusit znovu (zbývá ${n})`,
    addAsFriend: (name: string) => `➕ Přidat ${name} jako přítele`,
    sendingRequest: 'Odesílám žádost…',
    friendRequestSent: 'Žádost o přátelství odeslána.',
    couldntSend: 'Nepodařilo se odeslat — zkus to znovu',
    champHeadline: 'Dokončil jsi DotDuel pro jednoho hráče!',
    champBody:
      'Pokořil jsi každý tvar na každé úrovni. Nejtěžší výzva, která zbývá, jsou skuteční lidé.',
    comingSoonTitle: 'Již brzy',
    multiplayerComingSoon: 'Více hráčů · již brzy',
    impossibleHeadline: (shape: string) => `Sundal jsi nejtěžší AI na tvaru ${shape}.`,
    impossibleBody: (nextShape: string, beginner: string) =>
      `${nextShape} je tvá další hora. Začni od obtížnosti ${beginner} a propracuj se zpět nahoru.`,
    tryShape: (shape: string) => `Zkusit ${shape}`,
    shapeUnlockedHeadline: (shape: string) => `${shape} je nyní odemčen!`,
    shapeUnlockedBody: (shape: string) =>
      `Nová deska s novou strategií. Nebo zůstaň u tvaru ${shape} a zvyš obtížnost.`,
    pushTo: (level: string, shape: string) => `Nebo zaber do obtížnosti ${level} na tvaru ${shape}`,
    levelUnlockedHeadline: (level: string) => `${level} odemčena.`,
    levelUnlockedBody: 'AI právě zchytřela. Připraven jí čelit?',
    tryLevel: (level: string) => `Zkusit ${level}`,
    niceOne: 'Pěkné.',
    niceOneBody: 'Tohle už máš za sebou. Chceš tvrdší boj?',
  },

  lobby: {
    back: '‹ Zpět',
    title: 'Více hráčů',
    intro: (rating: number) =>
      `Vyber měření času. Spárujeme tě s jiným hráčem s podobným hodnocením (tvé: ${rating}).`,
    lockedTitle: (openLabel: string) =>
      `Zamčeno, dokud poroste hráčská základna — zatím je otevřen jen režim ${openLabel}, aby bylo párování rychlé.`,
    comingBackSoon: 'Brzy se vrátí',
    board: 'Deska:',
    unlockHint: (nextLabel: string, n: number) =>
      `— ${nextLabel} se odemkne za ${n} ${plural(n, 'hodnocenou hru', 'hodnocené hry', 'hodnocených her')}.`,
    findMatch: 'Najít hodnocenou hru',
  },

  matchmaking: {
    finding: 'Hledám soupeře…',
    waitingAtRating: (s: number) => `Čekám na hráče s tvým hodnocením (${s} s)`,
    stillSearching: (s: number) =>
      `Stále hledám — možná tě brzy spárujeme s hodnocenou AI (${s} s)`,
    cancelSearch: 'Zrušit hledání',
    rangeHint: 'Rozsah párování se rozšiřuje o ~25 Elo za sekundu. Spárujeme tě s nejbližším soupeřem.',
  },

  matchFound: {
    opponentFound: 'Soupeř nalezen!',
    youPlayerN: (n: number) => `Ty · Hráč ${n}`,
    playerN: (n: number) => `Hráč ${n}`,
    ready: '✓ Připraven',
    notReady: '— Nepřipraven',
    vs: 'vs',
    bot: 'BOT',
    aiOpponent: 'Soupeř AI',
    bothReady: 'Oba připraveni — startuje se…',
    startsIn: (s: number) => `Začíná za ${s}`,
    shapeLine: (shape: string) => `Tvar: ${shape}. Hráč 1 táhne první.`,
    shapeRandom: 'náhodný',
    readyWaiting: '✓ Připraven — čeká se na soupeře',
    readyBtn: 'Připraven!',
    backToMenu: 'Zpět do menu',
  },

  clock: {
    remaining: (time: string) => `${time} zbývá`,
  },

  mpUnavailable: {
    heading: 'Hra pro více hráčů není dostupná',
    blockedHint:
      'Tvá síť blokuje herní server. Nejčastější příčinou je blokovač reklam/sledování (Whalebone, AdGuard, NextDNS, Pi-hole) nebo DNS filtr v telefonu či routeru.',
    tryLabel: 'Zkus:',
    tryWifi: 'jinou Wi-Fi síť nebo mobilní data',
    tryBrowser: 'jiný prohlížeč',
    tryDisableFilters: 'na chvíli vypnout DNS filtry / VPN',
    tryWhitelist: (domain: string) => `povolit ${domain} ve svém blokovači`,
    offlineHint: 'Hra proti botům funguje i offline — otevři Menu a vyber Boti.',
  },

  mpConnecting: {
    heading: 'Připojuji se ke hře…',
    hint: 'Navazuji spojení s herním serverem. Pokud to trvá déle než ~10 sekund, něco je špatně — vrať se zpět a zkus to znovu.',
  },

  share: {
    title: 'DotDuel — rychlá tečková strategie pro 2 hráče',
    textInvite: 'Zahraj si se mnou rychlou partii teček.',
    textShare: 'Vyzkoušej DotDuel — rychlou tečkovou strategii pro 2 hráče.',
    labelInvite: '➕ Pozvat přítele',
    labelShare: 'Sdílet DotDuel',
    linkCopied: 'Odkaz zkopírován — vlož ho kamkoli',
    couldNotShare: 'Nepodařilo se sdílet — zkus to znovu',
    preparing: 'Připravuji…',
    shareResult: '📤 Sdílet výsledek',
    imageCopied: 'Obrázek zkopírován — vlož ho kamkoli',
    imageCopyFailed: 'Obrázek se nepodařilo zkopírovat — zkus Stáhnout',
    textCopied: 'Text a odkaz zkopírovány',
    textCopyFailed: 'Nepodařilo se zkopírovat — zkus Stáhnout',
    imageSaved: 'Obrázek uložen',
    dialogAria: 'Sdílet svůj výsledek',
    dialogTitle: 'Sdílet svůj výsledek',
    close: 'Zavřít',
    resultCardAlt: 'Tvá výsledková karta',
    copyImage: '📋 Kopírovat obrázek',
    copyTextLink: '🔗 Kopírovat text + odkaz',
    hintCardLink:
      'Tvůj odkaz po vložení automaticky zobrazí obrázek karty. Pro vložený obrázek zkopíruj obrázek a vlož ho do svého příspěvku.',
    hintNoCardLink:
      'Tlačítka platforem sdílejí tvůj text a odkaz. Chceš-li přidat obrázek, použij Kopírovat obrázek a vlož ho do svého příspěvku.',
    downloadImage: '⬇ Stáhnout obrázek',

    result: {
      genericBot: 'Bot',
      ptsLabel: 'b.',
      scanCaption: 'Naskenuj a hraj hned!',
      ctaWin: 'Troufneš si mě porazit?',
      ctaLoss: 'Myslíš, že bys to zvládl líp?',
      ctaDraw: 'Rozhodneš to?',

      tagDaily: 'DENNÍ HÁDANKA',
      tagVsBot: (shape: string) => `PROTI BOTOVI · ${shape.toUpperCase()}`,
      tagRanked: (shape: string) => `HODNOCENÁ HRA · ${shape.toUpperCase()}`,
      tagHotseat: (shape: string) => `MÍSTNÍ HRA · ${shape.toUpperCase()}`,

      dailyHeadline: 'Dnešní hádanka',
      dailyCta: 'Troufneš si ji porazit?',
      dailyShareText: (score: number, url: string) =>
        `Dnes jsem v DotDuel hádance získal ${score} bodů — troufneš si mě porazit?\n${url}`,

      aiHeadlineWin: (level: string) => `Bot ${level} — poražen`,
      aiHeadlineLoss: (level: string) => `Bot ${level} tentokrát vyhrává`,
      aiHeadlineDraw: (level: string) => `Remíza proti botovi ${level}`,
      aiShareTextWin: (level: string, s1: number, s2: number, shape: string, url: string) =>
        `Porazil jsem bota ${level} ${s1}:${s2} na desce ${shape} v DotDuel — troufneš si taky?\n${url}`,
      aiShareTextLoss: (level: string, s2: number, s1: number, url: string) =>
        `Bot ${level} mě porazil ${s2}:${s1} v DotDuel. Myslíš, že bys to zvládl líp?\n${url}`,
      aiShareTextDraw: (level: string, s1: number, s2: number, url: string) =>
        `Remízoval jsem s botem ${level} ${s1}:${s2} v DotDuel. Dokončíš to za mě?\n${url}`,

      rankedHeadlineWin: (elo: string) => `Hodnocená výhra${elo}`,
      rankedHeadlineLoss: 'Těžký hodnocený zápas',
      rankedHeadlineDraw: 'Hodnocená remíza',
      rankedShareTextWin: (myScore: number, oppScore: number, elo: string, url: string) =>
        `Právě jsem vyhrál hodnocený zápas v DotDuel ${myScore}:${oppScore}${elo} — troufneš si mě porazit?\n${url}`,
      rankedShareTextLoss: (myScore: number, oppScore: number, url: string) =>
        `Odehrál jsem hodnocený zápas v DotDuel (${myScore}:${oppScore}). Nedáme si hru?\n${url}`,
      rankedShareTextDraw: (myScore: number, oppScore: number, url: string) =>
        `Naprosto vyrovnaný hodnocený zápas v DotDuel (${myScore}:${oppScore}). Rozhodneš to za nás?\n${url}`,

      hotseatHeadlineWin: (winnerName: string) => `${winnerName} vyhrává`,
      hotseatHeadlineDraw: 'Naprostá remíza',
      hotseatShareTextWin: (
        winnerName: string,
        loserName: string,
        winnerScore: number,
        loserScore: number,
        url: string,
      ) =>
        `${winnerName} porazil/a ${loserName} ${winnerScore}:${loserScore} v DotDuel. Myslíš, že bys to zvládl líp?\n${url}`,
      hotseatShareTextDraw: (p1: string, p2: string, s1: number, s2: number, url: string) =>
        `${p1} a ${p2} remízovali ${s1}:${s2} v DotDuel. Rozhodneš to za nás?\n${url}`,
    },
  },

  rankings: {
    aria: 'Žebříčky',
    backToRankings: 'Zpět na žebříčky',
    closeRankings: 'Zavřít žebříčky',
    back: 'Zpět',
    close: 'Zavřít',
    aiOpponent: 'Soupeř AI',
    player: 'Hráč',
    h2hTagline: 'Vzájemná bilance podle soupeře.',
    title: 'Žebříčky',
    globalTagline: 'Světové Elo napříč všemi hráči více hráčů.',
    localTagline: 'Lokální profily na tomto zařízení — historie proti botům a místní hry.',
    globalElo: 'Světové Elo',
    local: 'Lokální',
    shape: 'Tvar:',
    all: 'Vše',
    emptyLocalAll: 'Na tomto zařízení zatím nejsou zaznamenány žádné hry.',
    emptyLocalShape: (shape: string) => `Na tvaru ${shape} zatím žádné hry.`,
    colRank: '#',
    colPlayer: 'Hráč',
    colGames: 'Hry',
    colWinPct: 'Výhry %',
    deleteProfile: 'Smazat profil',
    noH2H: 'Žádné vzájemné hry nejsou zaznamenány.',
    colOpponent: 'Soupeř',
    colWinPctShort: 'V %',
    colLossPctShort: 'P %',
    colDrawPctShort: 'R %',
    done: 'Hotovo',
    confirmAria: 'Potvrdit smazání profilu',
    deleteTitle: 'Smazat profil?',
    deleteBody: (name: string) =>
      `${name} bude odstraněn ze žebříčků a ze všech vzájemných záznamů na tomto zařízení.`,
    deleteConfirm2: 'Opravdu to chceš smazat? Data budou neobnovitelná.',
    cancel: 'Zrušit',
    signInPrompt: 'Přihlas se a podívej se na světový žebříček Elo.',
    signIn: 'Přihlásit se',
    loadError: 'Nepodařilo se načíst žebříček — zkontroluj připojení.',
    tryAgain: 'Zkusit znovu',
    colElo: 'Elo',
    emptyGlobal: 'Zatím nebyly odehrány žádné hodnocené hry pro více hráčů. Buď první na špici.',
    you: 'ty',
    summaryGames: 'her',
    winRate: 'úspěšnost',
  },

  puzzleBoard: {
    aria: 'Žebříček hádanek',
    close: 'Zavřít',
    title: 'Dnešní vítězové',
    tagline:
      'Den ovládne nejvyšší skóre. Při shodě rozhoduje, kdo dokončil dřív. Reset o půlnoci (UTC).',
    loading: 'Načítám…',
    empty: 'Denní hádanku zatím nikdo nedokončil. Buď první.',
    today: 'Dnes',
    date: (month: string, day: number) => `${day}. ${month}`,
    you: ' (ty)',
    done: 'Hotovo',
  },

  sidePanel: {
    featuredTitle: (title: string) => `${title} — klepni pro úspěchy`,
    noGames: 'zatím žádné hry',
    botLabel: (level: string) => `Bot · ${level}`,
    botShort: (level: number) => `Bot L${level}`,
    hotseat: 'Místní hra',
    hotseatShort: 'MH',
    statsTitle: (label: string, total: number, record: string, pct: string) =>
      `${label}: ${total} ${plural(total, 'hra', 'hry', 'her')} · ${record} · ${pct} výher`,
    pointsTitle: (games: number, scored: number, given: number, avgS: string, avgG: string) =>
      `Za ${games} ${plural(games, 'hru', 'hry', 'her')}: ${scored} bodů získáno, ${given} bodů darováno. Průměry ${avgS} / ${avgG} na hru.`,
    aiLabel: (level: string) => `Soupeř AI, obtížnost ${level}`,
  },

  achievements: {
    byId: {
      // ---- A: onboarding ----
      'first-game': { title: 'První kroky', desc: 'Zahraj svou úplně první hru.' },
      'first-win': { title: 'Vítěz', desc: 'Vyhraj svou první hru.' },
      'first-claim': { title: 'Lovec linií', desc: 'Zaber svou první nezabranou linii.' },
      'all-shapes': { title: 'Kartograf', desc: 'Odemkni všechny hratelné tvary desky.' },

      // ---- B: Triangle bots ----
      'beat-triangle-1': { title: 'Trojúhelník: Začátečnická poražena', desc: 'Poraz bota na obtížnosti Začátečnická na desce Trojúhelník.' },
      'beat-triangle-2': { title: 'Trojúhelník: Snadná poražena', desc: 'Poraz bota na obtížnosti Snadná na desce Trojúhelník.' },
      'beat-triangle-3': { title: 'Trojúhelník: Střední poražena', desc: 'Poraz bota na obtížnosti Střední na desce Trojúhelník.' },
      'beat-triangle-4': { title: 'Trojúhelník: Těžká poražena', desc: 'Poraz bota na obtížnosti Těžká na desce Trojúhelník.' },
      'beat-triangle-5': { title: 'Trojúhelník: Nemožná poražena', desc: 'Poraz bota na obtížnosti Nemožná na desce Trojúhelník.' },
      'grandmaster-triangle': { title: 'Velmistr trojúhelníku', desc: 'Poraz bota na každé úrovni (Začátečnická → Nemožná) na desce Trojúhelník.' },
      'slayer-triangle-10': { title: 'Kat trojúhelníku', desc: 'Poraz bota na obtížnosti Nemožná 10krát na desce Trojúhelník.' },
      'slayer-triangle-50': { title: 'Smrtka trojúhelníku', desc: 'Poraz bota na obtížnosti Nemožná 50krát na desce Trojúhelník.' },

      // ---- C: Square bots ----
      'beat-square-1': { title: 'Čtverec: Začátečnická poražena', desc: 'Poraz bota na obtížnosti Začátečnická na desce Čtverec.' },
      'beat-square-2': { title: 'Čtverec: Snadná poražena', desc: 'Poraz bota na obtížnosti Snadná na desce Čtverec.' },
      'beat-square-3': { title: 'Čtverec: Střední poražena', desc: 'Poraz bota na obtížnosti Střední na desce Čtverec.' },
      'beat-square-4': { title: 'Čtverec: Těžká poražena', desc: 'Poraz bota na obtížnosti Těžká na desce Čtverec.' },
      'beat-square-5': { title: 'Čtverec: Nemožná poražena', desc: 'Poraz bota na obtížnosti Nemožná na desce Čtverec.' },
      'grandmaster-square': { title: 'Velmistr čtverce', desc: 'Poraz bota na každé úrovni (Začátečnická → Nemožná) na desce Čtverec.' },
      'slayer-square-10': { title: 'Kat čtverce', desc: 'Poraz bota na obtížnosti Nemožná 10krát na desce Čtverec.' },
      'slayer-square-50': { title: 'Smrtka čtverce', desc: 'Poraz bota na obtížnosti Nemožná 50krát na desce Čtverec.' },

      // ---- D: Rectangle bots ----
      'beat-rectangle-1': { title: 'Obdélník: Začátečnická poražena', desc: 'Poraz bota na obtížnosti Začátečnická na desce Obdélník.' },
      'beat-rectangle-2': { title: 'Obdélník: Snadná poražena', desc: 'Poraz bota na obtížnosti Snadná na desce Obdélník.' },
      'beat-rectangle-3': { title: 'Obdélník: Střední poražena', desc: 'Poraz bota na obtížnosti Střední na desce Obdélník.' },
      'beat-rectangle-4': { title: 'Obdélník: Těžká poražena', desc: 'Poraz bota na obtížnosti Těžká na desce Obdélník.' },
      'beat-rectangle-5': { title: 'Obdélník: Nemožná poražena', desc: 'Poraz bota na obtížnosti Nemožná na desce Obdélník.' },
      'grandmaster-rectangle': { title: 'Velmistr obdélníku', desc: 'Poraz bota na každé úrovni (Začátečnická → Nemožná) na desce Obdélník.' },
      'slayer-rectangle-10': { title: 'Kat obdélníku', desc: 'Poraz bota na obtížnosti Nemožná 10krát na desce Obdélník.' },
      'slayer-rectangle-50': { title: 'Smrtka obdélníku', desc: 'Poraz bota na obtížnosti Nemožná 50krát na desce Obdélník.' },

      // ---- E: cross-shape nightmare ----
      'triple-impossible': { title: 'Hubitel nočních můr', desc: 'Poraz bota na obtížnosti Nemožná alespoň 3krát na každém tvaru.' },

      // ---- G: hot-seat volume ----
      'hotseat-5': { title: 'Soupeři z gauče', desc: 'Odehraj 5 místních her.' },
      'hotseat-10': { title: 'Podej telefon', desc: 'Odehraj 10 místních her.' },
      'hotseat-50': { title: 'Legenda obýváku', desc: 'Odehraj 50 místních her.' },
      'hotseat-100': { title: 'Veterán stolních bitev', desc: 'Odehraj 100 místních her.' },
      'hotseat-500': { title: 'Hrdina místní hry', desc: 'Odehraj 500 místních her.' },
      'hotseat-1000': { title: 'Vládce jedné obrazovky', desc: 'Odehraj 1 000 místních her.' },

      // ---- H: daily puzzle ----
      'daily-first': { title: 'Začátečník hádanek', desc: 'Zahraj svou první denní hádanku.' },
      'daily-streak-3': { title: 'Podle plánu', desc: 'Zahraj denní hádanku 3 dny po sobě.' },
      'daily-streak-7': { title: 'Denní zvyk', desc: 'Zahraj denní hádanku 7 dní po sobě.' },
      'daily-streak-30': { title: 'Strážce kalendáře', desc: 'Zahraj denní hádanku 30 dní po sobě.' },
      'daily-streak-100': { title: 'Nepřerušeno', desc: 'Zahraj denní hádanku 100 dní po sobě.' },
      'daily-all-attempts': { title: 'Vytrvalý', desc: 'Využij všechny 3 pokusy na jedné denní hádance.' },
      'daily-top': { title: 'Šampion hádanek', desc: 'Skonči na 1. místě v žebříčku denní hádanky.' },

      // ---- I: play streak ----
      'streak-5': { title: 'Pravidelný', desc: 'Hraj 5 dní po sobě.' },
      'streak-10': { title: 'Oddaný', desc: 'Hraj 10 dní po sobě.' },
      'streak-50': { title: 'Zapálený', desc: 'Hraj 50 dní po sobě.' },
      'streak-100': { title: 'Centurion', desc: 'Hraj 100 dní po sobě.' },
      'streak-300': { title: 'Neúnavný', desc: 'Hraj 300 dní po sobě.' },
      'streak-500': { title: 'Neochvějný', desc: 'Hraj 500 dní po sobě.' },
      'streak-1000': { title: 'Věčný plamen', desc: 'Hraj 1 000 dní po sobě.' },

      // ---- J: days played ----
      'days-7': { title: 'První týden', desc: 'Hraj v 7 různých dnech.' },
      'days-30': { title: 'Měsíční stálice', desc: 'Hraj ve 30 různých dnech.' },
      'days-100': { title: 'Sto dní', desc: 'Hraj ve 100 různých dnech.' },

      // ---- K: total games ----
      'total-100': { title: 'Klub stovky', desc: 'Odehraj celkem 100 her (všechny režimy).' },
      'total-500': { title: 'Pět set silných', desc: 'Odehraj celkem 500 her.' },
      'total-1000': { title: 'Tisíc her', desc: 'Odehraj celkem 1 000 her.' },
      'total-10000': { title: 'Deset tisíc', desc: 'Odehraj celkem 10 000 her.' },
      'total-50000': { title: 'Žijící legenda', desc: 'Odehraj celkem 50 000 her.' },

      // ---- L: ranked volume ----
      'ranked-first': { title: 'Vstup do arény', desc: 'Zahraj svou první hodnocenou hru online.' },
      'ranked-first-win': { title: 'První krev', desc: 'Vyhraj svou první hodnocenou hru online.' },
      'ranked-play-10': { title: 'Vyzyvatel', desc: 'Odehraj 10 hodnocených her.' },
      'ranked-play-50': { title: 'Soupeř', desc: 'Odehraj 50 hodnocených her.' },
      'ranked-play-100': { title: 'Bojovník', desc: 'Odehraj 100 hodnocených her.' },
      'ranked-play-500': { title: 'Ostřílený', desc: 'Odehraj 500 hodnocených her.' },
      'ranked-win-10': { title: 'Vítěz', desc: 'Vyhraj 10 hodnocených her.' },
      'ranked-win-50': { title: 'Dobyvatel', desc: 'Vyhraj 50 hodnocených her.' },
      'ranked-win-100': { title: 'Válečník', desc: 'Vyhraj 100 hodnocených her.' },

      // ---- M: on fire (ranked win streak) ----
      'fire-3': { title: 'Zahřívání', desc: 'Vyhraj 3 hodnocené hry po sobě.' },
      'fire-5': { title: 'V jednom ohni', desc: 'Vyhraj 5 hodnocených her po sobě.' },
      'fire-7': { title: 'Žhavý', desc: 'Vyhraj 7 hodnocených her po sobě.' },
      'fire-10': { title: 'Inferno', desc: 'Vyhraj 10 hodnocených her po sobě.' },
      'fire-15': { title: 'Nezastavitelný', desc: 'Vyhraj 15 hodnocených her po sobě.' },
      'fire-20': { title: 'Řádění', desc: 'Vyhraj 20 hodnocených her po sobě.' },
      'fire-25': { title: 'Nedotknutelný', desc: 'Vyhraj 25 hodnocených her po sobě.' },
      'fire-50': { title: 'Legendární série', desc: 'Vyhraj 50 hodnocených her po sobě.' },

      // ---- N: Elo milestones ----
      'elo-1100': { title: 'Stoupající', desc: 'Dosáhni hodnocení 1100.' },
      'elo-1200': { title: 'Zkušený', desc: 'Dosáhni hodnocení 1200.' },
      'elo-1400': { title: 'Expert', desc: 'Dosáhni hodnocení 1400.' },
      'elo-1600': { title: 'Mistr', desc: 'Dosáhni hodnocení 1600.' },
      'elo-1800': { title: 'Velmistr', desc: 'Dosáhni hodnocení 1800.' },
      'elo-2000': { title: 'Elita', desc: 'Dosáhni hodnocení 2000.' },

      // ---- O: ranked skill ----
      'ranked-time-win': { title: 'Závod s časem', desc: 'Vyhraj hodnocenou hru tím, že soupeři vyprší čas.' },
      'ranked-upset': { title: 'Přemožitel obrů', desc: 'Poraz soupeře s hodnocením o 100+ bodů vyšším, než máš ty.' },
      'ranked-rematch-win': { title: 'Bez pochyb', desc: 'Vyhraj odvetu.' },

      // ---- P: line / scoring mechanics ----
      'line-8': { title: 'Plný dům', desc: 'Dokonči linii z 8 teček jedním tahem.' },
      'corner': { title: 'Do rohu', desc: 'Získej body za rohovou linii za 1 bod.' },
      'biggest-line': { title: 'Velké skóre', desc: 'Získej za jednu linii 6 nebo více bodů.' },
      'claim-10': { title: 'Příležitostný', desc: 'Zaber celkem 10 nezabraných linií.' },
      'claim-50': { title: 'Sběrač', desc: 'Zaber celkem 50 nezabraných linií.' },
      'claim-100': { title: 'Sup', desc: 'Zaber celkem 100 nezabraných linií.' },

      // ---- Q: social ----
      'add-friend': { title: 'Navazování přátelství', desc: 'Přidej svého prvního přítele.' },
      'play-friend': { title: 'Přátelská rivalita', desc: 'Zahraj si hru proti pozvanému příteli.' },
      'refer-friend': { title: 'Náborář', desc: 'Přiveď zcela nového hráče přes svůj odkaz s pozvánkou.' },
      'share-card': { title: 'Pochlub se', desc: 'Sdílej vítěznou kartu.' },
      'all-themes': { title: 'Dekoratér', desc: 'Vyzkoušej všech osm barevných témat.' },

      // ---- R: non-ranked win streaks ----
      'botstreak-3': { title: 'Šťastná ruka', desc: 'Vyhraj 3 hry proti botům po sobě.' },
      'botstreak-5': { title: 'V proudu', desc: 'Vyhraj 5 her proti botům po sobě.' },
      'botstreak-10': { title: 'Bořič strojů', desc: 'Vyhraj 10 her proti botům po sobě.' },
    } as Record<string, { title: string; desc: string }>,
    tracks: {
      'Getting started': 'Začínáme',
      'Triangle bots': 'Boti na trojúhelníku',
      'Square bots': 'Boti na čtverci',
      'Rectangle bots': 'Boti na obdélníku',
      'Mastery': 'Mistrovství',
      'Bot win streak': 'Série výher proti botům',
      'Hot-seat': 'Místní hra',
      'Daily puzzle': 'Denní hádanka',
      'Play streak': 'Série hraní',
      'Days played': 'Odehrané dny',
      'Milestones': 'Milníky',
      'Ranked play': 'Hodnocené hry',
      'Ranked wins': 'Hodnocené výhry',
      'Ranked feats': 'Hodnocené počiny',
      'Win streak': 'Série výher',
      'Rating': 'Hodnocení',
      'Scoring': 'Bodování',
      'Claims': 'Zabrání',
      'Social': 'Sociální',
    } as Record<string, string>,
    aria: 'Úspěchy',
    close: 'Zavřít',
    title: 'Úspěchy',
    unlocked: 'odemčeno',
    hiddenReveal: 'Skryto — hraj dál, abys tohle odhalil.',
    statusUnlocked: '✓ Odemčeno',
    statusLocked: 'Zamčeno',
    pinTitle: 'Zobrazit tento odznak vedle tvého jména ve hrách',
    featured: '★ Vybráno',
    pin: 'Připnout',
    detailHint: 'Klepni na odznak a zjisti, za co je.',
    secret: '???',
    hidden: 'Skryto',
    hiddenAria: 'Skrytý úspěch',
    nodeTitle: (name: string, descOrHidden: string) => `${name} — ${descOrHidden}`,
    toastKicker: '🏆 Úspěch odemčen',
  },

  howto: {
    aria: 'Jak hrát',
    close: 'Zavřít',
    title: 'Jak hrát',
    tagline: 'Sleduj každý tah — deska ukáže přesně, co se děje.',
    prev: 'Předchozí',
    next: 'Další',
    done: 'Rozumím',
    scenes: {
      place: {
        title: 'Polož tečku',
        body: 'Ve svém tahu klepni na libovolnou prázdnou tečku, abys ji vybarvil. Pak je na řadě soupeř.',
      },
      corner: {
        title: 'Roh dá 1 bod',
        body: 'Jediná rohová tečka se počítá jako linie z 1 — sama o sobě dá 1 bod.',
      },
      lineScored: {
        title: 'Dokonči linii',
        body: 'Vybarvi všechny tečky na rovné linii a získáš tolik bodů, kolik je její délka.',
      },
      claim: {
        title: 'Zaber čekající linie',
        body: 'Jeden tah může dokončit několik linií — boduje jen ta nejdelší, ostatní čekají (svítí). Klepni na tečku na čekající linii, abys zabral její body. Zabrat je může kterýkoli hráč.',
      },
      triThreeWays: {
        title: 'Trojúhelník: 3 směry',
        body: 'Linie vedou napříč a podél obou úhlopříček.',
      },
      sqFourWays: {
        title: 'Čtverec: 4 směry',
        body: 'Linie vedou napříč, dolů a podél obou úhlopříček.',
      },
      finish: {
        title: 'Konec hry',
        body: 'Hra končí, když jsou všechny tečky položené a všechny linie zabrané. Vyhrává nejvíce bodů; shodné skóre znamená remízu.',
      },
    } as Record<string, { title: string; body: string }>,
  },
};
