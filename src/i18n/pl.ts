/**
 * Polish (Polski). Must satisfy `Messages` (the shape from en.ts).
 *
 * Polish gaming conventions: Wielu graczy, Osiągnięcia, Ustawienia, rankingowa,
 * Poddaj się, plansza, kropka (DOT) vs punkt (POINT/score) — Polish keeps them
 * distinct. Counts use plural() (one / few 2–4 / many). Register: informal
 * imperative (ty: Dotknij, Wybierz, Zaloguj). Reviewed in 3 native passes.
 */
import type { Messages } from './en';

/** Polish count form: one (1), few (2–4 except 12–14), many (0, 5+, 12–14). */
function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (n === 1) return one;
  if (m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14)) return few;
  return many;
}

const kropki = (n: number) => plural(n, 'kropka', 'kropki', 'kropek');
const proby = (n: number) => plural(n, 'próba', 'próby', 'prób');

export const pl: Messages = {
  common: {
    back: 'Wstecz',
    cancel: 'Anuluj',
    close: 'Zamknij',
    locked: 'Zablokowane',
    signInToView: 'Zaloguj się, aby zobaczyć.',
    signInToPlay: 'Zaloguj się, aby zagrać.',
  },

  lang: {
    label: 'Język',
    english: 'English',
    lithuanian: 'Lietuvių',
  },

  shapes: {
    triangle: 'Trójkąt',
    square: 'Kwadrat',
    rectangle: 'Prostokąt',
    rhombus: 'Romb',
  },

  difficulty: {
    1: 'Początkujący',
    2: 'Łatwy',
    3: 'Średni',
    4: 'Trudny',
    5: 'Niemożliwy',
  },

  menu: {
    tagline:
      'Na zmianę stawiaj kropki; po ukończeniu linii zdobywasz punkty równe jej długości. Pokoloruj całą planszę — wygrywa ten, kto ma więcej punktów.',
    welcomeLead: 'Witaj,',

    changeTheme: 'Zmień motyw kolorystyczny',

    profile: 'Profil',
    signOut: 'Wyloguj się',
    signIn: 'Zaloguj się',
    shareDotDuel: 'Udostępnij DotDuel',

    singlePlayer: 'Jeden gracz',
    singlePlayerSub: 'Boty i codzienna łamigłówka.',
    multiplayer: 'Wielu graczy',
    multiplayerSub: 'Lokalnie i rankingowo online.',
    rankings: 'Rankingi',
    rankingsSub: 'Łamigłówki, lokalne i rankingowe.',

    bots: 'Boty',
    botsSub: 'Pięć poziomów, od łagodnego po bezlitosny.',

    hotseat: 'Gra lokalna',
    hotseatSub: '1 urządzenie · 2 graczy.',

    puzzleRankings: 'Ranking łamigłówek',
    puzzleRankingsSub: 'Najlepsze wyniki dzisiejszej łamigłówki.',
    localRankings: 'Rankingi lokalne',
    localRankingsSub: 'Twoje rekordy na tym urządzeniu.',
    ratedRankings: 'Ranking online',
    ratedRankingsSub: 'Światowy ranking Elo online.',
    achievements: 'Osiągnięcia',
    achievementsSub: 'Odznaki zdobyte za grę.',

    dailyPuzzle: 'Codzienna łamigłówka',
    dailyDoneSub: (best: number) => `✓ Ukończono · najlepszy ${best} · reset o północy (UTC)`,
    dailyDoneTitle: 'Wykorzystano wszystkie 3 próby. Wróć jutro.',
    dailyAttemptSub: (attempt: number, max: number, best: number) =>
      `Próba ${attempt}/${max} · najlepszy ${best}`,
    dailyFreshSub: (max: number) => `${max} ${proby(max)} · 3 min · wygrywa najlepszy wynik.`,
    dailySignInTitle: 'Zaloguj się, aby zagrać dzisiejszą łamigłówkę',

    onlineRanked: 'Gra rankingowa online',
    onlineFindMatch: 'Znajdź grę rankingową.',
    onlineSignInTitle: 'Zaloguj się, aby grać online',
    onlineUnreachable: 'Serwer niedostępny — Twoja sieć może go blokować.',
    onlineUnreachableTitle:
      'Twoja sieć blokuje serwer gry (prawdopodobnie bloker reklam/śledzenia lub filtr DNS)',
    onlineLocked: 'Aktywne w innej karcie/na innym urządzeniu — zakończ lub zamknij tam.',
    onlineLockedTitle: 'Masz otwartą sesję gry wieloosobowej w innej karcie lub na innym urządzeniu',

    chooseShape: 'Wybierz kształt',
    chooseDifficulty: 'Wybierz poziom trudności',
    dots: (n: number) => `${n} ${kropki(n)}`,
    level: (d: number) => `Poziom ${d}`,
    shapeLockedTitle: 'Pokonaj poprzedni kształt na poziomie Trudnym, aby odblokować następny',

    whosPlaying: 'Kto gra?',
    vsBot: (shape: string, difficulty: string) => `${shape} · przeciw botowi · ${difficulty}`,
    hotseatHint: (shape: string) => `${shape} · potwierdź lub zmień imiona przed rozpoczęciem`,
    yourNameFirst: 'Twoje imię — grasz pierwszy',
    player1First: 'Gracz 1 — gra pierwszy',
    player2: 'Gracz 2',
    signedInAs: (name: string) => `Zalogowano jako ${name}. Zmień w Profilu.`,
    swapColours: 'Zamień kolory (Gracz 1 kremowy · Gracz 2 zielony)',
    startGame: 'Rozpocznij grę',
    player1Placeholder: 'Gracz 1',
    player2Placeholder: 'Gracz 2',
  },

  footer: {
    rules: 'Zasady',
    settings: 'Ustawienia',
    privacy: 'Prywatność',
    theme: 'Motyw',
    brand: 'DotDuel © 2026',
    brandTitle:
      '© 2026 DotDuel. Wszelkie prawa zastrzeżone. DotDuel i logo DotDuel są znakami towarowymi należącymi do ich autora.',
    versionTitle: 'Co nowego',
  },

  game: {
    ptsLeft: 'POZOSTAŁO',
    linesToClaim: (n: number) =>
      plural(n, 'linia do zajęcia', 'linie do zajęcia', 'linii do zajęcia'),
    pendingTitle:
      'Linie czekają na zajęcie — dotknij kolorowej kropki na jednej z nich, aby ją zająć.',
    leaveMatch: 'Opuść grę',
    backToMenu: 'Powrót do menu',
    dailyTime: 'Twój czas na tę próbę',
    seeUnclaimed: 'Pokaż niezajęte linie',
    seeUnclaimedTitle: (on: boolean) => `Pokaż niezajęte linie: ${on ? 'wł.' : 'wył.'}`,
    rules: 'Jak grać',
    showRules: 'Pokaż zasady',
    resign: 'Poddaj się',
    resignTitle: 'Poddaj się i zakończ grę',
    resignConfirmTitle: 'Poddać się?',
    resignConfirmBody: 'Przegrasz tę grę.',
    resignRankedTitle: 'Poddać tę grę rankingową?',
    resignRankedBody: 'Zostanie zaliczona jako porażka w Twoim rankingu.',
    thinking: 'Myśli',
    bot: 'BOT',
    aiOpponent: 'Przeciwnik AI',
  },

  rules: {
    aria: 'Jak grać w DotDuel',
    close: 'Zamknij zasady',
    title: 'Jak grać w DotDuel',
    tagline: 'Graj na zmianę. Kończ linie. Zdobądź najwięcej punktów.',
    goalH: 'Cel',
    goalP: 'Zdobądź więcej punktów niż przeciwnik.',
    turnH: 'W każdej turze',
    turnP: 'Wykonaj jedną z tych czynności, a tura przechodzi na przeciwnika:',
    turnTapEmpty: 'Dotknij pustej kropki, aby ją pokolorować.',
    turnTapClaim:
      'Dotknij kropki na ukończonej, niezajętej linii, aby zająć jej punkty (nie stawiasz nowej kropki).',
    scoringH: 'Punktacja',
    scoringP:
      'Linia to dowolny prosty ciąg kropek: poziomy, pionowy lub ukośny. Gdy wszystkie jej kropki są pokolorowane, daje tyle punktów, ile wynosi jej długość.',
    score3: 'Linia z 3 kropek → 3 pkt',
    score5: 'Linia z 5 kropek → 5 pkt',
    score8: 'Linia z 8 kropek → 8 pkt',
    scoreCorner: 'Pojedyncza kropka w rogu liczy się jako „linia” za 1 pkt',
    catchH: 'Haczyk — jeden ruch, jeden wynik',
    catchP:
      'Jeśli Twoja kropka ukończy kilka linii naraz, punktujesz tylko najdłuższą. Pozostałe ukończone linie stają się niezajęte — każdy może je zająć w późniejszej turze.',
    watchH: 'Obserwuj planszę',
    watchP:
      'Gra nie oznacza niezajętych linii. Wypatrz w pełni pokolorowaną linię, która nie została przekreślona, i dotknij dowolnej jej kropki, aby ją zająć. Darmowe punkty za uważność.',
    endH: 'Koniec gry',
    endP:
      'Gdy wszystkie kropki są pokolorowane i wszystkie ukończone linie zostały zajęte. Wygrywa najwyższy wynik; równy wynik to remis.',
    tipsH: 'Wskazówki',
    tip1: 'Unikaj ruchów kończących dwie linie — resztę oddajesz przeciwnikowi.',
    tip2: 'Zawsze bierz darmowy róg lub duże ukończenie.',
    tip3: 'Czasem blok (0 punktów) jest mądrzejszy niż mały wynik.',
    tip4: 'Pod koniec gry szukaj niezajętych linii przed postawieniem kropki.',
    modesH: 'Tryby',
    modeBotsLead: 'Przeciw botom',
    modeBots: '— pięć poziomów trudności. Wygraj na Łatwym jednym kształtem, aby odblokować następny.',
    modeHotseatLead: 'Gra lokalna',
    modeHotseat: '— dwóch graczy, jedno urządzenie.',
    modeMpLead: 'Wielu graczy',
    modeMp: '— na żywo, ze światowym rankingiem Elo, szachowym pomiarem czasu i rewanżami.',
    gotIt: 'Rozumiem',
  },

  settings: {
    aria: 'Ustawienia',
    close: 'Zamknij ustawienia',
    title: 'Ustawienia',
    tagline: 'Zapisywane lokalnie na tym urządzeniu.',
    yourName: 'Twoje imię',
    yourNameHintSignedIn: (name: string) => `Zalogowano jako ${name}. Zmień nazwę w Profilu.`,
    yourNameHint: 'Używane w trybie przeciw botowi ORAZ jako Gracz 1 w grze lokalnej.',
    hotseatOpponent: 'Przeciwnik w grze lokalnej',
    player2Name: 'Imię Gracza 2',
    swapColours: 'Zamień kolory (Gracz 1 kremowy · Gracz 2 zielony)',
    privacyH: 'Prywatność',
    whoCanChallenge: 'Kto może rzucić mi wyzwanie?',
    everyone: 'Wszyscy',
    friendsOnly: 'Tylko znajomi',
    nobody: 'Nikt',
    showStatus: 'Pokazuj mój status znajomym',
    showStatusHint:
      'Gdy wyłączone, znajomi widzą Cię jako offline. Zaproszenia do znajomych nadal działają; ukryty jest tylko wskaźnik statusu na żywo.',
    resetProgress: 'Zresetuj postęp',
    resetProgressConfirm: 'Zresetować postęp? Odblokowane kształty i poziomy zostaną utracone.',
    resetStats: 'Zresetuj statystyki',
    resetStatsConfirm:
      'Zresetować statystyki? Historia wygranych/remisów/porażek wszystkich graczy na tym urządzeniu zostanie usunięta.',
    renameNote:
      'Uwaga: zmiana imienia rozpoczyna nowy wiersz statystyk. Historia starego imienia jest zachowywana pod tym imieniem.',
    done: 'Gotowe',
  },

  theme: {
    aria: 'Wybierz motyw',
    close: 'Zamknij motywy',
    title: 'Motyw',
    tagline: 'Wybierz paletę. Zapisywane na tym urządzeniu.',
    sunFriendly: 'Dobre w słońcu',
    done: 'Gotowe',
    taglines: {
      'forest-pearl': 'Oryginał. Szmaragd na nefrytowej winiecie.',
      'royal-court': 'Fioletowy aksamit kontra stare złoto.',
      'tempo-rivals': 'Wino kontra błękit nieba. Klasyka.',
      'sunset-catan': 'Terakotowe pustynie, pergaminowe pionki.',
      'coral-reef': 'Głęboka turkusowa woda, koralowi kompani.',
      'twilight-cosmos': 'Indygo pustka kontra elektryczny cyjan.',
      'monochrome-pro': 'Czarno-białe pionki na drewnie. Maksymalny kontrast.',
      'vintage-press': 'Bordowy i granatowy atrament na pergaminie. Dobre w słońcu.',
    },
  },

  changelog: {
    aria: 'Co nowego',
    close: 'Zamknij',
    title: 'Co nowego',
    tagline: 'Najnowsze aktualizacje DotDuel, od najnowszej.',
    empty: 'Brak informacji o wersjach.',
    entryEmpty: 'Informacje o wersji wkrótce.',
    added: 'Dodano',
    changed: 'Zmieniono',
    fixed: 'Naprawiono',
    done: 'Gotowe',
    months: ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'],
  },

  privacy: {
    aria: 'Polityka prywatności',
    close: 'Zamknij',
    title: 'Polityka prywatności',
    tagline: 'Co zbieramy, dlaczego to zbieramy i jak to usunąć.',
    whoH: 'Kim jesteśmy',
    whoP: 'DotDuel to niezależna gra w kolorowanie kropek dla dwóch graczy. Administratorem Twoich danych osobowych zgodnie z RODO jest deweloper. Kontakt:',
    collectH: 'Co zbieramy',
    collectP: 'Tylko to, co potrzebne, aby gra działała i była uczciwa.',
    collectAccountLead: 'Konto:',
    collectAccount:
      'adres e-mail, wyświetlana nazwa, dostawca logowania (Google lub hasło) i data utworzenia konta. Źródło: Ty, przez Supabase Auth podczas rejestracji.',
    collectRatingLead: 'Ranking w grze wieloosobowej:',
    collectRating:
      'Twoje aktualne Elo, licznik gier kwalifikacyjnych i znacznik czasu ostatniej gry. Źródło: obliczane na serwerze na koniec każdej gry rankingowej.',
    collectHistoryLead: 'Historia gier:',
    collectHistory:
      'każda gra rankingowa zapisuje identyfikatory obu graczy, wyświetlane nazwy, końcowe wyniki, zmiany rankingu, kształt, kontrolę czasu, czas trwania oraz sposób zakończenia gry (normalne / upływ czasu / poddanie).',
    collectLiveLead: 'Stan gry na żywo:',
    collectLive:
      'gdy gra wieloosobowa trwa, przechowujemy planszę, zegar i czyja jest tura w naszej bazie danych czasu rzeczywistego. Jest to usuwane wkrótce po zakończeniu gry.',
    collectFriendsLead: 'Znajomi i zaproszenia:',
    collectFriends:
      'Twoja lista znajomych, oczekujące prośby, status online i zaproszenia do gry. Jeśli dołączyłeś przez link z zaproszeniem lub kod QR innego gracza, zapisujemy, który gracz Cię zaprosił (jego losowy kod zaproszenia — aby w przyszłości można było uznać nagrody za polecenia).',
    collectDeviceLead: 'Dane tylko na urządzeniu:',
    collectDevice:
      'Twój postęp w trybie jednoosobowym, statystyki przeciw botom / w grze lokalnej, preferencja motywu i znacznik „samouczek obejrzany”. Przechowywane w localStorage Twojej przeglądarki i nigdy nam nieprzesyłane.',
    collectAnalyticsLead: 'Analityka (tylko jeśli wyrazisz zgodę):',
    collectAnalytics:
      'zdarzenia automatycznie zbierane przez Google Analytics — odsłony stron, model urządzenia, język, rozmiar ekranu, anonimowy identyfikator sesji. Niepowiązane z Twoim kontem w naszym systemie.',
    whyH: 'Dlaczego to zbieramy (podstawy prawne)',
    whyContractLead: 'Umowa (art. 6 ust. 1 lit. b):',
    whyContract:
      'konto, ranking, historia gier, stan gry na żywo — wszystko niezbędne do działania usługi wieloosobowej, do której się zarejestrowałeś.',
    whyLegitLead: 'Prawnie uzasadniony interes (art. 6 ust. 1 lit. f):',
    whyLegit:
      'tabela wyników i gra rankingowa — aby zapewnić wszystkim graczom uczciwe, konkurencyjne środowisko.',
    whyConsentLead: 'Zgoda (art. 6 ust. 1 lit. a):',
    whyConsentAds:
      'Google Analytics ORAZ Google AdSense — oba ładują się dopiero po kliknięciu Akceptuj w banerze zgody. Odmowa lub brak decyzji oznacza, że żaden się nie uruchamia.',
    whyConsentNoAds:
      'Google Analytics — ładuje się dopiero po kliknięciu Akceptuj w banerze zgody. Odmowa lub brak decyzji oznacza, że nigdy się nie uruchamia.',
    sharedH: 'Komu są udostępniane',
    sharedAds:
      'Korzystamy z Supabase (baza danych, uwierzytelnianie, infrastruktura czasu rzeczywistego i funkcje serverless, hostowane w UE) jako dostawcy backendu, a także z Google do logowania i analityki uzależnionej od zgody, oraz z Google AdSense, aby wyświetlać małe banery reklamowe na kilku ekranach menu. Zarówno Analytics, jak i AdSense ładują się dopiero po zaakceptowaniu banera zgody. Supabase i Google przetwarzają dane zgodnie ze swoimi standardowymi warunkami / umowami powierzenia przetwarzania danych. Nie sprzedajemy ani nie udostępniamy Twoich danych żadnej innej stronie trzeciej.',
    sharedNoAds:
      'Korzystamy z Supabase (baza danych, uwierzytelnianie, infrastruktura czasu rzeczywistego i funkcje serverless, hostowane w UE) jako dostawcy backendu, a także z Google do logowania i analityki uzależnionej od zgody. Analytics ładuje się dopiero po zaakceptowaniu banera zgody. Supabase i Google przetwarzają dane zgodnie ze swoimi standardowymi warunkami / umowami powierzenia przetwarzania danych. Nie sprzedajemy ani nie udostępniamy Twoich danych żadnej innej stronie trzeciej. Obecnie nie korzystamy z sieci reklamowych stron trzecich.',
    keepH: 'Jak długo przechowujemy',
    keepAccountLead: 'Konto + tabela wyników:',
    keepAccount: 'do momentu usunięcia konta.',
    keepHistoryLead: 'Historia gier:',
    keepHistory: 'do 24 miesięcy po zakończeniu gry, następnie trwale usuwana.',
    keepLiveLead: 'Stan gry na żywo:',
    keepLive: 'usuwany w ciągu ok. 24 godzin po zakończeniu gry.',
    keepAnalyticsLead: 'Analityka:',
    keepAnalytics: 'zgodnie z domyślnymi ustawieniami Google (obecnie 14 miesięcy dla danych o zdarzeniach).',
    keepDeviceLead: 'Dane tylko na urządzeniu:',
    keepDevice: 'pozostają do czasu wyczyszczenia danych przeglądarki.',
    rightsH: 'Twoje prawa',
    rightsP: 'Zgodnie z RODO masz prawo do:',
    rightAccessLead: 'Dostępu',
    rightAccess: 'do danych osobowych, które przechowujemy na Twój temat — użyj „Pobierz moje dane” w Profilu.',
    rightRectifyLead: 'Sprostowania',
    rightRectify: 'nieprawidłowych danych — użyj przycisku „Zmień nazwę” w Profilu.',
    rightEraseLead: 'Usunięcia',
    rightErase:
      'konta („prawo do bycia zapomnianym”) — użyj „Usuń moje konto” w Profilu. Skutek jest natychmiastowy.',
    rightPortLead: 'Przenoszenia',
    rightPort: 'danych — powyższe pobranie to plik JSON do odczytu maszynowego, który możesz zabrać gdzie indziej.',
    rightObjectLead: 'Sprzeciwu',
    rightObject: 'wobec analityki — użyj przełącznika poniżej lub kliknij Odrzuć w banerze przy pierwszym uruchomieniu.',
    rightComplainLead: 'Wniesienia skargi',
    rightComplain:
      'do krajowego organu ochrony danych, jeśli uważasz, że niewłaściwie postąpiliśmy z Twoimi danymi.',
    rankingsNoteLead: 'Ważna uwaga o rankingach.',
    rankingsNote:
      'Jeśli usuniesz konto (lub zostaniesz usunięty z dowolnego powodu), Twoja wyświetlana nazwa i identyfikator konta zostaną usunięte ze wszystkich publicznych rejestrów. Jednak zmiany rankingu, które spowodowałeś w Elo innych graczy, NIE są cofane — przeszłe gry są niezmienne. Przeciwnicy, z którymi grałeś, zachowują swoje zyski i straty rankingowe; ich historia gier pokazuje „Usunięty gracz” tam, gdzie wcześniej było Twoje imię.',
    cookiesH: 'Pliki cookie i analityka',
    cookiesP:
      'Nie używamy plików cookie do śledzenia. Nasze logowanie (Supabase Auth) korzysta z własnego magazynu sesji, aby utrzymać Cię zalogowanym. Google Analytics używa plików cookie, ale tylko jeśli wyrazisz zgodę poniżej.',
    currentChoice: 'Aktualny wybór analityki:',
    choiceAccepted: 'Zaakceptowano',
    choiceDeclined: 'Odrzucono',
    choiceUndecided: 'Jeszcze nie zdecydowano',
    acceptAnalytics: 'Akceptuj analitykę',
    declineAnalytics: 'Odrzuć analitykę',
    consentReloadHint:
      'Zmiana z Zaakceptowano na Odrzucono przeładuje stronę, aby całkowicie zatrzymać SDK Analytics.',
    contactH: 'Jak się z nami skontaktować',
    contactP: 'W sprawie pytań o prywatność, żądań dostępu do danych lub skarg:',
    effectiveH: 'Data wejścia w życie',
    effectiveLead: (date: string) =>
      `Niniejsza polityka obowiązuje od ${date}. Zaktualizujemy ją tutaj, jeśli coś istotnego się zmieni. Wersja kanoniczna jest publikowana pod adresem`,
    done: 'Gotowe',
  },
};
