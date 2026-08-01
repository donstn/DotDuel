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
    w: 'Z',
    d: 'R',
    l: 'P',
    you: 'Ty',
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
    swapColours: 'Zamień kolory (Gracz 1 ↔ Gracz 2)',
    startGame: 'Rozpocznij grę',
    player1Placeholder: 'Gracz 1',
    player2Placeholder: 'Gracz 2',
  },

  footer: {
    howToPlay: 'Jak grać',
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
    boardAriaLabel: (shape: string) => `Plansza gry: ${shape}`,
    liveDraw: (s1: number, s2: number) => `Koniec gry. Remis, ${s1} do ${s2}.`,
    liveWin: (winner: number, s1: number, s2: number) =>
      `Koniec gry. Gracz ${winner} wygrywa, ${s1} do ${s2}.`,
    liveTurn: (current: number, s1: number, s2: number) =>
      `Ruch gracza ${current}. Wynik: Gracz 1 – ${s1}; Gracz 2 – ${s2}.`,
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
    dailyForfeitTitle: 'Opuścić tę próbę?',
    dailyForfeitBody: (remaining: number, max: number) =>
      `To wykorzysta 1 z Twoich ${max} dziennych prób — po tym zostanie ${remaining}.`,
    dailyForfeitConfirm: 'Opuść',
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
    swapColours: 'Zamień kolory (Gracz 1 ↔ Gracz 2)',
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
    appearanceH: 'Wygląd',
    colourTheme: 'Motyw kolorystyczny',
    changeTheme: 'Zmień',
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
    entries: {
      'Alpha 0.4.12.2': {
        highlight: 'Aplikacja mówi teraz jeszcze lepiej w Twoim języku',
        changes: [
          'Nazwa przeciwnika AI, obraz/tekst udostępnianej karty zwycięstwa oraz kilka ekranów stanu połączenia pozostawały po angielsku niezależnie od wybranego języka — teraz są przetłumaczone.',
          'Wszystkie wcześniejsze wpisy w tej liście zmian (od samego początku) są teraz dostępne po litewsku, hiszpańsku, portugalsku, polsku i czesku, nie tylko po angielsku.',
        ],
      },
      'Alpha 0.4.12.1': {
        highlight: 'Poprawka',
        changes: [
          'Naprawiono przeskakiwanie/kurczenie się planszy na telefonach, gdy wynik zmieniał się z 2 na 3 cyfry.',
        ],
      },
      'Alpha 0.4.12.0': {
        highlight: 'Poprawki',
        changes: [
          'Przeniesiono wybór języka w lewy górny róg, aby nie zachodził na logo (przycisk motywu został w prawym górnym rogu).',
          'Karty obu graczy na telefonach są teraz lustrzanym odbiciem siebie, zamiast wyglądać nierówno.',
          'Próbki kolorów w grze lokalnej oraz ustawienie „zamień kolory” dopasowują się teraz do wybranego motywu, zamiast zawsze pokazywać kremowy/zielony.',
          'Przycisk/gest cofania przechodzi teraz krok po kroku przez menu i ekrany zamiast zamykać aplikację — gry rankingowe i próby codziennej łamigłówki nadal proszą najpierw o potwierdzenie.',
        ],
      },
      'Alpha 0.4.11.0': {
        highlight: 'Jak grać',
        changes: [
          'Nowy przewodnik „Jak grać” z animowanymi przykładami na prawdziwej planszy — zobacz, jak róg daje 1 punkt, jak kończy się linia, jak kilka linii czeka na zajęcie oraz jak linie biegną we wszystkich kierunkach na Trójkącie (3 kierunki) i Kwadracie (4 kierunki). Otwórz go ze stopki, obok Zasad; dotknij planszy, aby zatrzymać, przesuwaj palcem lub użyj strzałek do przeglądania.',
          'Motyw kolorystyczny wybiera się teraz w Ustawieniach (przeniesiono go ze stopki, aby zrobić miejsce na „Jak grać”).',
        ],
      },
      'Alpha 0.4.10.1': {
        highlight: 'Poprawki',
        changes: [
          'Wyskakujące okienka odblokowania osiągnięć oraz menu języka są teraz nieprzezroczyste i czytelne (wcześniej były przezroczyste, przez co widać było tekst w tle). Okienko osiągnięcia jest też większe.',
          'Logowanie na nowym urządzeniu nie pokazuje już ponownie wszystkich wcześniej zdobytych osiągnięć.',
          'Osiągnięcie „Zapędzony w róg” (zdobądź 1 punkt za linię narożną) teraz się odblokowuje — wcześniej nie było śledzone.',
        ],
      },
      'Alpha 0.4.10.0': {
        highlight: 'Pełne tłumaczenie',
        changes: [
          'Cała aplikacja jest teraz przetłumaczona, nie tylko menu. Twój Profil, Znajomi i zaproszenia, poczekalnia i ekrany meczów wieloosobowych, ekran końca gry, Rankingi i tabela wyników codziennej łamigłówki, udostępnianie oraz wszystkie 97 Osiągnięć (nazwy i opisy) pojawiają się teraz po angielsku, litewsku, hiszpańsku, portugalsku, polsku i czesku.',
        ],
      },
      'Alpha 0.4.9.0': {
        highlight: 'Języki',
        changes: [
          'DotDuel mówi teraz w sześciu językach: angielskim, litewskim, hiszpańskim, portugalskim, polskim i czeskim. Wybierz swój za pomocą przycisku języka w prawym górnym rogu menu.',
          'Gra uruchamia się teraz automatycznie w Twoim języku — na podstawie ustawień przeglądarki w wersji webowej oraz języka urządzenia w aplikacji.',
        ],
      },
      'Alpha 0.4.8.0': {
        highlight: 'Osiągnięcia',
        changes: [
          'Osiągnięcia! Zdobądź do 100 odznak za grę — pokonywanie botów na każdym kształcie i poziomie, serie zwycięstw, rozgrywki w codziennej łamigłówce, serie dni i wielkie kamienie milowe. Znajdziesz je w Rankingi → Osiągnięcia; każda odznaka zapala się w kolorach Twojego motywu po odblokowaniu, a w chwili zdobycia zobaczysz okienko „🏆 Osiągnięcie odblokowane”.',
          'Przypnij ulubioną odznakę, aby pokazywała się obok Twojego imienia podczas gry.',
        ],
      },
      'Alpha 0.4.7.0': {
        highlight: 'Nowe menu i Boty',
        changes: [
          'Menu główne zostało przeorganizowane w trzy przejrzyste sekcje — Jeden gracz, Wielu graczy i Rankingi — każda otwiera uporządkowaną listę z własnymi ikonami.',
          'Przeciwnicy komputerowi są teraz wszędzie nazywani „Botami” zamiast „AI”.',
          'Wybór kształtu planszy lub poziomu bota pokazuje teraz pasującą ikonę — kształt planszy oraz własną twarz każdego bota dla jego poziomu trudności.',
          'Na Androidzie aplikacja pozostaje teraz w orientacji pionowej po przechyleniu telefonu.',
        ],
      },
      'Alpha 0.4.6.2': {
        changes: [
          'Przeprojektowano udostępnianą kartę wyniku: większa plansza, wynik pokazany po prostu jako Wygrana / Przegrana / Remis, a kod QR jest teraz w kolorach gry, umieszczony na środku planszy, z podpisem „Zeskanuj i zagraj!”.',
        ],
      },
      'Alpha 0.4.6.0': {
        changes: [
          'Udostępniane karty wyniku zawierają teraz skanowalny kod QR — znajomi mogą skierować na niego aparat (lub przytrzymać obraz), aby od razu przejść do gry. Linki z zaproszeniem używają teraz prywatnego kodu zaproszenia zamiast identyfikatora Twojego konta.',
        ],
      },
      'Alpha 0.4.5.3': {
        changes: [
          'Przeprojektowano kartę udostępniania: plansza leży teraz na prawdziwym 3D stole z filcu, tak jak w grze, tekst jest wyśrodkowany, a adres DotDuel.com jest znacznie łatwiejszy do odczytania.',
        ],
      },
      'Alpha 0.4.5.2': {
        changes: [
          'Karta udostępniania jest teraz renderowana w podwójnej rozdzielczości — nie widać już pikseli po otwarciu obrazu na pełnym ekranie w Messengerze lub WhatsApp.',
        ],
      },
      'Alpha 0.4.5.1': {
        changes: [
          'Karta udostępniania: plansza wygląda teraz jak w prawdziwej grze (dopasowano grubość linii; kropki nie są już zagubione na zapełnionych planszach), a wynik nie zachodzi już na etykietę „pkt”.',
        ],
      },
      'Alpha 0.4.5.0': {
        highlight: 'Szybciej na telefonach',
        changes: [
          'Lżejsze efekty graficzne podczas gry — gra działa zauważalnie płynniej na tańszych telefonach, bez zmiany wyglądu.',
          'Tabela wyników pokazuje teraz zastępcze wiersze podczas ładowania oraz przycisk ponowienia, gdy połączenie zostanie przerwane.',
          'Zaktualizowano politykę prywatności: poprawiono dostawcę backendu na Supabase, dodano informacje o aplikacji na Androida i AdMob.',
          'Aplikacja na Androida: przycisk cofania zamyka teraz otwarte okienka zamiast zamykać grę.',
        ],
      },
      'Alpha 0.4.4.0': {
        highlight: 'Udostępnij swój wynik',
        changes: [
          'Nowy przycisk „Udostępnij wynik” na ekranie końca gry — tworzy obraz ukończonej planszy z wynikiem i pozwala udostępnić go gdziekolwiek, wraz z linkiem, dzięki któremu znajomi mogą z Tobą zagrać.',
        ],
      },
      'Alpha 0.4.3.0': {
        highlight: 'Czystsza plansza, większy tekst',
        changes: [
          'Usunięto dymki z podpowiedziami pojawiające się w trakcie gry — migały zbyt szybko, by je przeczytać, i tylko przeszkadzały. Ekran Zasad oraz widok „Pokaż niezajęte linie” nadal uczą zasad punktacji.',
          'Powiększono każdy mały tekst do minimalnego czytelnego rozmiaru w całej aplikacji, dla lepszej czytelności i dostępności.',
        ],
      },
      'Alpha 0.4.2.0': {
        highlight: 'Codzienna łamigłówka odrodzona — jedna wspólna plansza, wyścig z czasem',
        changes: [
          'Codzienna łamigłówka to teraz ta sama plansza dla wszystkich, każdego dnia: losowy kształt z rozegranym już otwarciem, a potem 3 minuty na zegarze, by zdobyć jak najwyższy wynik. Liczy się najlepsza z 3 prób.',
          'Codzienny ranking opiera się teraz na Twoim wyniku (nie na przewadze nad AI), a tabela wyników pokazuje zwycięzcę każdego z ostatnich 30 dni.',
        ],
      },
      'Alpha 0.4.1.0': {
        highlight: 'Motywy kolorystyczne zmieniają wygląd całej planszy',
        changes: [
          'Motywy kolorystyczne zmieniają teraz wygląd całej planszy — powierzchnia gry, pionki, świętowanie zwycięstwa i przyciski dopasowują się do wybranego schematu, zamiast pokazywać zieloną planszę pod każdym motywem.',
          'W meczach online o tym, kto rusza pierwszy, decyduje teraz uczciwy rzut monetą, a rewanże na przemian zmieniają, kto zaczyna — dzięki temu w serii gier każdy z Was ma pierwszy ruch mniej więcej połowę czasu.',
          'Przeciwnik komputerowy rusza się szybciej, dzięki czemu gry przeciw AI są bardziej responsywne.',
          'Menu, okienka i ekran końca gry otwierają się teraz płynniej, z mniejszymi opóźnieniami.',
          'Zablokowane kształty i poziomy trudności pokazują teraz wyraźną kłódkę zamiast wyglądać na wyszarzone lub zepsute.',
          'Pola logowania e-mailem i hasłem są teraz wyraźnie widoczne, a pionki lepiej odcinają się od planszy w każdym motywie.',
        ],
      },
      'Alpha 0.4.0.0': {
        highlight: 'Aktualizacja serwera i płynniejsza rozgrywka wieloosobowa',
        changes: [
          'Przeniesiono tryb wieloosobowy na nowy, szybszy backend, dla bardziej niezawodnych meczów.',
          'Zegary w trybie wieloosobowym są teraz płynne i sprawiedliwe — Twój zegar nie przeskakuje już ani nie działa dalej po wykonaniu ruchu.',
          'Zaproszenia do gry pozostają na ekranie, dopóki znajomy nie odpowie, a Ty możesz je zaakceptować od razu z ekranu wyników.',
          'Można Cię teraz automatycznie znaleźć po nazwie użytkownika, dzięki czemu znajomi mogą dodać Cię bez dodatkowych kroków.',
        ],
      },
      'Alpha 0.3.7.0': {
        highlight: 'Automatyczna aktualizacja aplikacji i poprawka przewijania menu',
        changes: [
          'Aplikacja aktualizuje się teraz automatycznie — jeśli dodałeś DotDuel do ekranu głównego, sama pobiera nowe wersje, zamiast utknąć na starej wersji z pamięci podręcznej.',
          'Na telefonach menu przewija się teraz prawidłowo, dzięki czemu karta Rankingi na dole jest w pełni widoczna.',
        ],
      },
      'Alpha 0.3.6.1': {
        highlight: 'Pozycja planszy na telefonie',
        changes: [
          'Plansza na telefonie faktycznie przesuwa się teraz w górę, bliżej kart graczy (poprzednia próba nie zadziałała).',
        ],
      },
      'Alpha 0.3.6.0': {
        highlight: 'Zaloguj się, aby zagrać',
        changes: [
          'Pierwsze uruchomienie otwiera się teraz ekranem „Zaloguj się, aby zagrać” — zaloguj się, aby grać wieloosobowo i mieć postęp zsynchronizowany w chmurze, albo wybierz „graj anonimowo”, by wejść od razu do gry.',
          'Na telefonach plansza znajduje się teraz bliżej kart graczy, zamiast zostawiać nad sobą dużą pustą przestrzeń.',
        ],
      },
      'Alpha 0.3.5.0': {
        highlight: 'Poprzedni zwycięzcy łamigłówki i uporządkowane rankingi',
        changes: [
          'Tabela wyników łamigłówki ma teraz zakładkę „Ostatni zwycięzcy” — kto wygrał każdego z ostatnich 30 dni, z datą obok każdego imienia.',
          'Globalny ranking Elo zaczyna się teraz od rankingu: pozycja, Elo, a potem imię gracza.',
        ],
      },
      'Alpha 0.3.4.0': {
        highlight: 'Świętowanie zwycięstwa skaluje się z poziomem trudności',
        changes: [
          'Świętowanie zwycięstwa rośnie teraz wraz z wyzwaniem — niewielki pokaz za wygraną z Początkującym, stopniowo rosnący aż po pełny złoty pokaz za pokonanie Niemożliwego.',
        ],
      },
      'Alpha 0.3.3.0': {
        highlight: 'Czystsza, dopracowana plansza — gotowa na betę',
        changes: [
          'Przeprojektowano ramę planszy: filc leży teraz w równomiernie rozłożonej, gładkiej obudowie z zaokrąglonymi rogami i subtelnym wgłębionym efektem 3D — i prawidłowo obejmuje każdy kształt, w tym ostry wierzchołek trójkąta (wcześniej obrys wyglądał nierówno).',
          'Karty graczy w grze mieszczą się teraz w pełni na ekranie jako zaokrąglone karty, zamiast wychodzić poza krawędzie.',
          'Naprawiono okienko podpowiedzi w grze, którego tekst mógł wychodzić poza planszę.',
        ],
      },
      'Alpha 0.3.2.0': {
        highlight: 'Bardziej premium wygląd · świętowanie zwycięstwa',
        changes: [
          'Poprawki wizualne — przyciski oraz karty wyboru trybu Przeciw AI / kształtu / poziomu trudności mają teraz prawdziwą, namacalną głębię 3D (unoszą się po najechaniu i wciskają się po kliknięciu), a główne przyciski dopasowują się kolorem do każdego motywu, zamiast być zawsze zielone.',
          'Świętowanie zwycięstwa! Zakończenie gry wygraną odpala fajerwerki i konfetti — z przesadnym złotym pokazem za pokonanie Niemożliwego AI.',
        ],
      },
      'Alpha 0.3.1.0': {
        highlight: 'Prosto do gry · czytelniejsze wyjaśnienie na ekranie głównym',
        changes: [
          'Usunięto wprowadzające okienko samouczka — gra otwiera się teraz od razu w menu. Instrukcja gry to teraz jedna, przejrzysta linijka na ekranie głównym, a pełne zasady są zawsze w zasięgu jednego dotknięcia przycisku ?.',
        ],
      },
      'Alpha 0.3.0.0': {
        highlight: 'Reklamy wspierają darmową grę · ochrona przed brakiem stawienia się w trybie wieloosobowym',
        changes: [
          'Na ekranie menu oraz darmowych ekranach jednoosobowych (Przeciw AI, Gra lokalna, Codzienna łamigłówka) pojawiają się teraz małe reklamy, aby DotDuel mógł pozostać darmowy. Brak reklam podczas rankingowych gier wieloosobowych. Zgodą zarządza monit prywatności Google.',
          'Ochrona przed brakiem stawienia się w trybie wieloosobowym: jeśli gracz nie wykona pierwszego ruchu w ciągu 10 sekund, gra zostaje przerwana bez zmiany rankingu dla żadnej ze stron — dzięki temu rozłączenie lub chwila nieuwagi na starcie nigdy Cię nie kosztuje.',
        ],
      },
      'Alpha 0.2.9.0': {
        highlight: 'Odświeżony wygląd i czytelność na każdym motywie',
        changes: [
          'Świeży wygląd: nowa typografia, oprawiona plansza dopasowana do każdego kształtu (trójkąt, romb, kwadrat), jaśniejsze pionki i czytelniejsze wyniki.',
          'Panele graczy płynnie zmniejszają się wraz z ekranem — na telefonach zwijają się do kompaktowej karty z awatarem obok imienia, dając planszy więcej miejsca.',
          'Ustawienia, Zasady i Prywatność zostały uporządkowane w przejrzyste karty, łatwiejsze do przejrzenia.',
          'Puste kropki są teraz wyraźnie widoczne na każdym motywie, zamiast zlewać się z planszą — zwłaszcza na jasnych motywach.',
          'Przyciski, ekran końca gry i okienka nie są już trudne do odczytania na jasnych motywach (Monochrome Pro, Vintage Press) — tekst i tła zachowują teraz wszędzie odpowiedni kontrast.',
        ],
      },
      'Alpha 0.2.8.0': {
        highlight: 'Pełna gra na klawiaturze',
        changes: [
          'Pełna gra na klawiaturze: Tab, aby przejść do planszy, strzałki, aby poruszać się między kropkami, Enter lub Spacja, aby postawić kropkę lub zająć linię.',
          'Mecze rankingowe znajdują teraz przeciwnika-bota w około 15 sekund, gdy brak dostępnego człowieka, zamiast nawet minuty.',
        ],
      },
      'Alpha 0.2.7.2': {
        highlight: 'Poprawka: miganie / czarny ekran w końcówce gry',
        changes: [
          'Miganie w środkowej i końcowej fazie gry (oraz okazjonalny czarny ekran) na bardziej zapełnionych planszach zniknęło. Każda ukończona linia była wcześniej renderowana z efektem dodatkowego blendowania dla jaśniejszego podświetlenia; na Kwadracie i Prostokącie powodowało to nakładanie się dziesiątek warstw kompozytora GPU, co ostatecznie przeciążało pamięć graficzną telefonu. Linie są teraz renderowane prostymi, kontrastowymi kolorami — jasny wygląd „wstążki” pozostał, awaria już nie.',
        ],
      },
      'Alpha 0.2.7.1': {
        highlight: 'Poprawka: koniec migania na Kwadracie/Prostokącie',
        changes: [
          'Podświetlenie „Pokaż niezajęte linie” pojawia się teraz tylko na planszy Trójkąt. Na Kwadracie i Prostokącie powodowało czasami miganie i ciemnienie ekranu, gdy wiele linii było niezajętych. Przełącznik jest ukryty na tych kształtach, dopóki błąd wizualny nie zostanie naprawiony.',
        ],
      },
      'Alpha 0.2.7.0': {
        highlight: 'Codzienna łamigłówka: 3 próby i tabela wyników',
        changes: [
          'Masz teraz 3 próby na dzisiejszą łamigłówkę zamiast 1. Liczy się Twoja najlepsza przewaga — passa nadal rośnie po pierwszym ukończeniu danego dnia.',
          'Nowa karta „Tabela wyników łamigłówki” w menu. Dzisiejsze najlepsze przewagi na żywo, posortowane od największej do najmniejszej. Remisy rozstrzyga, kto skończył pierwszy. Historyczne tabele wyników (wg dnia, miesiąca, wyszukiwania po imieniu) już wkrótce.',
        ],
      },
      'Alpha 0.2.6.0': {
        highlight: 'Dzisiejsza łamigłówka',
        changes: [
          'Nowa karta „Dzisiejsza łamigłówka” w menu. Jedna próba dziennie przeciw Trudnemu AI na zmieniającym się kształcie. Wynik to Twoja przewaga (Ty minus AI), a każda wygrana dodaje dzień do Twojej passy w Profilu. Jutrzejsza łamigłówka odblokowuje się o północy UTC.',
          'Logowanie jest wymagane, aby grać w codzienną łamigłówkę i budować passę — passa jest przypisana do konta, więc działa na wszystkich urządzeniach.',
        ],
      },
      'Alpha 0.2.5.0': {
        highlight: 'Fundament pod codzienną passę',
        changes: [
          'Nowa sekcja „Dzienna passa” w Twoim Profilu, przygotowana pod codzienną łamigłówkę (nadchodzi wkrótce). Gdy łamigłówka zostanie wprowadzona, jej codzienne ukończanie będzie budować Twoją passę na wszystkich urządzeniach — przechowywaną na koncie, nie w przeglądarce, więc przetrwa czyszczenie pamięci podręcznej i zmianę urządzenia.',
        ],
      },
      'Alpha 0.2.4.0': {
        highlight: 'Udostępnianie i zapraszanie z menu',
        changes: [
          'Możesz teraz udostępnić DotDuel bezpośrednio z menu głównego. Zalogowani gracze widzą „Zaproś znajomego” — linki niosą Twoje polecenie, więc po rejestracji automatycznie zostajecie znajomymi. Osoby niezalogowane widzą link „Udostępnij DotDuel” pod przyciskiem logowania, do szybkiego, prostego udostępnienia gry.',
        ],
      },
      'Alpha 0.2.3.0': {
        highlight: 'Podpowiedzi dla nowych graczy i przełącznik zajmowalnych linii',
        changes: [
          'Kontekstowe podpowiedzi pojawiające się jednorazowo w trakcie nauki: przy pierwszym zdobyciu punktów, przy pierwszym ruchu kończącym dwie linie naraz (zasada „liczy się tylko największa”), przy pierwszej linii czekającej na zajęcie na początku Twojej tury oraz pod koniec gry.',
          'Nowy przełącznik z ikoną oka „Pokaż zajmowalne linie” obok przycisku zasad w trybie przeciw AI na poziomach Początkujący/Łatwy/Średni/Trudny. Domyślnie włączony dla Początkującego–Średniego, wyłączony dla Trudnego. Ukryty w Niemożliwym, grze lokalnej i trybie wieloosobowym — odczytywanie planszy jest częścią wyzwania.',
          'Zaktualizowano wewnętrzny sposób przechowywania ustawień; przy pierwszym uruchomieniu zostaniesz poproszony o ponowne wpisanie imienia i ponownie zobaczysz okienko samouczka. Statystyki, odblokowania i dane konta pozostają nienaruszone.',
        ],
      },
      'Alpha 0.2.2.0': {
        highlight: 'Widoczna punktacja',
        changes: [
          'Punktacja jest teraz widoczna: unoszące się +N wyskakuje z kropki kończącej linię w Twoim kolorze, odznaka Twojego wyniku pulsuje przy zmianie, a odznaka „linii do zajęcia” błyska, gdy nowa linia staje się czekająca.',
        ],
      },
      'Alpha 0.2.1.0': {
        highlight: 'Telemetria w tle',
        changes: [
          'Wewnętrznie: dodano anonimową analitykę lejka dla graczy, którzy zaakceptowali baner cookies — pomaga nam zobaczyć, w którym miejscu gra frustruje nowych graczy, abyśmy mogli to wygładzić. Żadne dane osobowe nie opuszczają urządzenia.',
        ],
      },
      'Alpha 0.2.0.0': {
        highlight: 'Znajomi i zaproszenia',
        changes: [
          'Lista znajomych. Dodaj znajomego po nazwie użytkownika, zobacz, którzy znajomi są online i co robią (przeciw AI, gra lokalna, mecz rankingowy), zaproś znajomego do konkretnej gry (wybierz kształt, kontrolę czasu, rankingową lub towarzyską). Zaproszenia otrzymane w trakcie gry pozostają w kolejce i pojawiają się w chwili powrotu do menu. Zaproszenie rankingowe liczy się do Elo tylko, gdy obie strony wybiorą opcję rankingową; w przeciwnym razie to mecz towarzyski. Po meczu wieloosobowym możesz dodać przeciwnika do znajomych jednym dotknięciem.',
          'Poleć znajomemu: zaproś ludzi do wypróbowania DotDuel — nie potrzebują jeszcze konta. Korzysta z menu udostępniania Twojego telefonu lub klienta e-mail; nigdy nie widzimy ich adresu. Gdy się zarejestrują, automatycznie otrzymasz od nich prośbę o znajomość.',
          'Ustawienia → Prywatność: wybierz, kto może rzucić Ci wyzwanie (Wszyscy / Tylko znajomi / Nikt) oraz czy Twój status na żywo jest widoczny dla znajomych.',
        ],
      },
      'Alpha 0.1.5.0': {
        highlight: 'Porządki w backendzie',
        changes: [
          'Wewnętrznie: stan gry wieloosobowej został w całości przeniesiony na nowy transport. Stara ścieżka Realtime Database nie jest już używana do danych gry. Brak widocznej różnicy — jeśli już, to lekko szybciej.',
        ],
      },
      'Alpha 0.1.4.4': {
        highlight: 'Odświeżenie wraca do menu',
        changes: [
          'Twarde odświeżenie strony po zakończonej grze wraca teraz do menu głównego, zamiast pokazywać ten sam ekran końca gry przy każdym odświeżeniu.',
        ],
      },
      'Alpha 0.1.4.3': {
        highlight: 'Przycisk Gotów i porządkowanie nieaktywnych kart',
        changes: [
          'Przycisk Gotów reaguje teraz natychmiast po dotknięciu, zamiast czekać na komunikację z serwerem, a w trybie przeciw AI gra zaczyna się od razu po jego wciśnięciu (bez czekania na odliczanie).',
          'Jeśli przejąłeś sesję wieloosobową na drugim urządzeniu, pierwsze urządzenie nie pokazuje już fantomowego ekranu końca gry dla rozgrywki zakończonej tam wcześniej.',
        ],
      },
      'Alpha 0.1.4.2': {
        highlight: 'Odzyskiwanie zablokowanej sesji',
        changes: [
          'Jeśli poprzednia sesja utknęła, trzymając blokadę trybu wieloosobowego, możesz teraz dotknąć przycisku Wielu graczy, aby przejąć ją tutaj, zamiast czekać, aż się zwolni.',
          'Zablokowane sesje zwalniają się teraz dwa razy szybciej (45s zamiast 90s), gdy karta trzymająca blokadę zniknie.',
        ],
      },
      'Alpha 0.1.4.1': {
        highlight: 'Dopracowanie trybu wieloosobowego',
        changes: [
          'Przycisk Gotów faktycznie rozpoczyna teraz grę, gdy tylko obie strony go wciśną (w trybie przeciw AI oznacza to natychmiast po Twoim wciśnięciu).',
          'Pierwszy ruch w meczu nie wymaga już 8–9 sekund, zanim zareaguje przeciwnik.',
          'Zalogowanie się na drugim urządzeniu nie wrzuca go już przypadkiem do Twojej aktywnej gry na pierwszym.',
          'Przyciski menu wyrównano do tego samego rozmiaru, dla czystszego wyglądu.',
        ],
      },
      'Alpha 0.1.4.0': {
        highlight: 'Tryb wieloosobowy działa teraz w większej liczbie sieci',
        changes: [
          'Tryb wieloosobowy łączy się teraz w sieciach, które wcześniej blokowały serwer gry (Whalebone, AdGuard, NextDNS, Brave Shields i podobne filtry na poziomie DNS). Gra korzysta z nowej ścieżki transportu, która przechodzi przez standardowe HTTPS i nie jest blokowana przez listy blokujące trackery. Jeśli tryb wieloosobowy wcześniej zawieszał się na ekranie ładowania, spróbuj ponownie.',
        ],
      },
      'Alpha 0.1.3.6': {
        highlight: 'Poprawka wyświetlania zegara',
        changes: [
          'Wyświetlanie zegara w trybie wieloosobowym nie miga już przy każdym ruchu.',
        ],
      },
      'Alpha 0.1.3.5': {
        highlight: 'Przyjazny komunikat offline',
        changes: [
          'Jeśli Twoja sieć blokuje serwer gry (częste przy mobilnych blokerach reklam/śledzenia takich jak AdGuard, NextDNS czy Whalebone), tryb wieloosobowy pokazuje teraz jasne wyjaśnienie ze wskazówkami zamiast zawieszać się na ekranie ładowania. Tryb jednoosobowy przeciw AI działa offline jak zwykle.',
        ],
      },
      'Alpha 0.1.3.1': {
        highlight: 'Poprawka przycisków na telefonie',
        changes: [
          'Przyciski Wielu graczy i Wyloguj czasami nie reagowały w przeglądarkach mobilnych z rygorystyczną prywatnością (Brave, Firefox Focus). Interfejs przechodzi teraz od razu do kolejnego ekranu, a porządkowanie odbywa się w tle.',
        ],
      },
      'Alpha 0.1.3.0': {
        highlight: 'Armia botów — nigdy nie czekaj sam',
        changes: [
          'Jeśli w ciągu ~15 sekund nie znajdzie się żaden człowiek, zostaniesz sparowany z rankingowym przeciwnikiem AI (Pip, Cricket, Ranger, Knight lub Voidstar). Liczą się oni do Elo i pojawiają się w tabeli wyników.',
          'Ekran wyszukiwania informuje teraz, kiedy może wkroczyć bot.',
          'Przycisk rewanżu ukrywa się teraz, gdy przeciwnikiem był bot (boty nie akceptują rewanżów).',
        ],
      },
      'Alpha 0.1.2.5': {
        highlight: 'Dalsza poprawka rejestracji',
        changes: [
          'Wybór nazwy użytkownika działa teraz nawet, jeśli poprzednia próba rejestracji zostawiła niedokończony profil.',
          'Przycisk wylogowania na ekranie wyboru nazwy, abyś nigdy nie utknął.',
        ],
      },
      'Alpha 0.1.2.4': {
        highlight: 'Poprawka rejestracji',
        changes: [
          'Rejestracja nowego konta nie kończy się już błędem „brak uprawnień” podczas wyboru nazwy użytkownika.',
        ],
      },
      'Alpha 0.1.2.3': {
        highlight: 'Linki do udostępniania i wzmocnienie bezpieczeństwa',
        changes: [
          'Ikona karty przeglądarki i ikona ekranu głównego — dwie kropki DotDuel pojawiają się wszędzie tam, gdzie dodasz grę do zakładek lub zainstalujesz ją.',
          'Podglądy udostępniania — wklejenie linku DotDuel na Discordzie, Telegramie, Slacku lub Twitterze pokazuje teraz kartę z logotypem i hasłem zamiast pustego pola.',
          'Zmiana nazwy użytkownika odbywa się teraz atomowo — stara nazwa jest zwalniana, a nowa zajmowana w tej samej operacji.',
          'Wzmocnienie bezpieczeństwa w tle — bardziej rygorystyczna polityka bezpieczeństwa treści, limity zapytań po stronie serwera dla usuwania konta i sprawdzania nazw użytkownika, zaplanowane porządkowanie zakończonych gier (w ciągu ~24h zgodnie z polityką prywatności) oraz haszowane identyfikatory UID w logach serwera.',
        ],
      },
      'Alpha 0.1.2.2': {
        highlight: 'Tempo trybu wieloosobowego i czytelność',
        changes: [
          'Kolejne kształty planszy w trybie wieloosobowym odblokowują się po 50 i 100 grach rankingowych (najpierw Kwadrat, potem Prostokąt).',
          'Tryby Kulka (1 min) i Szybka (5 min) tymczasowo zablokowane — dostępna jest tylko Błyskawica (3 min), dopóki baza graczy rośnie.',
          'Okienko zasad informuje teraz, że tryb wieloosobowy jest dostępny.',
          'Tytuły „mistrz DotDuel” i „Niemożliwy — pokonany” były niewidoczne na jasnych motywach.',
        ],
      },
      'Alpha 0.1.2.1': {
        highlight: 'Dopracowanie motywów',
        changes: [
          'Każdy motyw kolorystyczny ma teraz własne kolory tekstu i logotypu, zamiast korzystać z domyślnej zieleni.',
          'Odznaka „wstępny” była niewidoczna na pergaminowym motywie Vintage Press.',
        ],
      },
      'Alpha 0.1.2': {
        highlight: 'Dopracowanie UX',
        changes: [
          'Wybór motywu jest teraz dostępny z każdego ekranu poprzez stopkę.',
          'Zegar widoczny na telefonie w trybie wieloosobowym.',
          'Podświetlenie ostatniego ruchu pokazuje teraz kropkę przeciwnika, nie Twoją.',
          'Ekran wygranej pokazuje teraz, JAK wygrałeś (na czas / na punkty / przeciwnik się poddał).',
          'Nie dało się zamknąć okienek na telefonie — przycisk zamknięcia jest teraz niezawodnie dostępny.',
          'Pigułka w stopce zawija się na drugą linię na wąskich telefonach, zamiast być ucinana.',
          'Wybór motywu i inne okienka są teraz prawidłowo przewijalne, gdy treść jest wyższa niż ekran.',
          'Okienka były nieczytelne na komputerze, gdy widoczny był baner cookies — rozmiar okienek teraz prawidłowo rezerwuje miejsce.',
        ],
      },
      'Alpha 0.1': {
        highlight: 'DotDuel wystartował!',
        changes: [
          'Publiczny start alfa — tryb wieloosobowy, ranking, motywy, tryb czytelny w słońcu.',
        ],
      },
    },
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

  profile: {
    aria: 'Profil',
    close: 'Zamknij',
    title: 'Twój profil',
    tagline: 'Informacje o koncie + historia offline.',
    accountH: 'Konto',
    gameName: 'Nazwa w grze',
    rename: 'Zmień nazwę',
    email: 'E-mail',
    signInMethod: 'Metoda logowania',
    providerGoogle: 'Google',
    providerEmail: 'E-mail i hasło',
    providerUnknown: 'Nieznana',
    emailUnverified:
      'E-mail jeszcze niezweryfikowany. Sprawdź skrzynkę (i folder spam) w poszukiwaniu wysłanego linku.',
    fallbackName: 'Gracz 1',
    accountFallback: 'Konto',
    multiplayerH: 'Wielu graczy',
    rating: 'Ranking',
    provisional: (n: number, total: number) => `Wstępny ${n}/${total}`,
    provisionalTitle: 'Ranking stabilizuje się po 10 grach rankingowych',
    lastMatches: (n: number) => `Ostatnie ${plural(n, 'gra', 'gry', 'gier')}: ${n}`,
    noMatches: 'Brak gier rankingowych. Dołącz do kolejki z menu.',
    streakH: 'Dzienna passa',
    streakEmpty: 'Zagraj dzisiejszą łamigłówkę, aby rozpocząć passę. (Wkrótce.)',
    currentStreak: 'Aktualna passa',
    longest: 'Najdłuższa',
    dayN: (n: number) => `Dzień ${n}`,
    streakHint: 'Passa liczy ukończenia codziennej łamigłówki. Opuść dzień, a się zeruje.',
    offlineHistoryH: (name: string) => `Historia offline — „${name}”`,
    offlineEmpty:
      'Brak gier na tym urządzeniu. Rozpocznij grę przeciw botowi lub grę lokalną, aby ją wypełnić.',
    totalGames: 'Wszystkie gry',
    vsBotsWDL: 'Przeciw botom · Z/R/P',
    hotseatWDL: 'Gra lokalna · Z/R/P',
    pointsScored: 'Zdobyte punkty',
    pointsGiven: 'Oddane punkty',
    avg: (v: string) => `śr. ${v}`,
    offlineHint: 'Przechowywane na tym urządzeniu pod nazwą z Ustawień. Synchronizacja z chmurą wkrótce.',
    dataH: 'Twoje dane',
    dataHint:
      'Zgodnie z RODO możesz pobrać wszystko, co o Tobie przechowujemy, lub całkowicie usunąć konto. Usunięcie jest natychmiastowe i nieodwracalne.',
    preparing: 'Przygotowywanie…',
    downloadData: 'Pobierz moje dane',
    deleteAccount: 'Usuń moje konto',
    signOut: 'Wyloguj się',
    done: 'Gotowe',
    deleteFailed: 'Usunięcie nie powiodło się. Spróbuj ponownie.',
    deleteConfirmTitle: 'Usunąć konto?',
    deleteConfirmBody:
      'Trwale usuwa to Twoje konto, logowanie, wpis w tabeli wyników oraz usuwa Twoją nazwę z poprzednich gier. Przeciwnicy zachowują swoją historię rankingu. Jeśli jesteś w trwającej grze, zostanie ona oddana walkowerem. Tego nie można cofnąć.',
    cancel: 'Anuluj',
    deleting: 'Usuwanie…',
    deleteForever: 'Usuń na zawsze',
  },

  signIn: {
    aria: 'Zaloguj się',
    close: 'Zamknij',
    titleGate: 'Zaloguj się, aby zagrać',
    titleSignIn: 'Zaloguj się',
    titleSignUp: 'Utwórz konto',
    google: 'Kontynuuj z Google',
    orEmail: 'lub przez e-mail',
    emailPlaceholder: 'ty@example.com',
    passwordPlaceholder: 'Hasło (min. 6 znaków)',
    confirmPlaceholder: 'Potwierdź hasło',
    submitSignIn: 'Zaloguj się',
    submitSignUp: 'Utwórz konto',
    newHere: 'Pierwszy raz tutaj?',
    createAccount: 'Utwórz konto',
    haveOne: 'Masz już konto?',
    signInLink: 'Zaloguj się',
    tryAnon: 'Chcesz spróbować anonimowo, bez logowania?',
    accountCreated: (email: string) =>
      `Konto utworzone. Jeśli potwierdzanie e-mailem jest włączone, sprawdź ${email} (i spam), aby zweryfikować.`,
    errPasswordsMatch: 'Hasła nie są zgodne.',
    errInvalidCreds: 'Nieprawidłowy e-mail lub hasło.',
    errAlreadyRegistered: 'Ten e-mail jest już zarejestrowany. Zaloguj się zamiast tego.',
    errWeakPassword: 'Hasło musi mieć co najmniej 6 znaków.',
    errInvalidEmail: 'Ten e-mail wygląda na nieprawidłowy.',
    errNotConfirmed: 'Najpierw potwierdź swój e-mail (sprawdź skrzynkę).',
    errRateLimit: 'Zbyt wiele prób. Spróbuj ponownie za minutę.',
    errNetwork: 'Błąd sieci. Sprawdź połączenie i spróbuj ponownie.',
    errGeneric: 'Coś poszło nie tak.',
  },

  username: {
    ariaClaim: 'Wybierz nazwę w grze',
    ariaRename: 'Zmień nazwę',
    cancel: 'Anuluj',
    titleClaim: 'Wybierz swoją nazwę w grze',
    titleRename: 'Zmień nazwę',
    taglineClaim:
      'To zobaczą inni gracze. Tylko dla Ciebie. Możesz ją później zmienić.',
    taglineRename: 'Statystyki są przypisane do konta, nie do nazwy — przechodzą z Tobą.',
    placeholder: 'np. Donatas',
    claim: 'Zajmij nazwę',
    save: 'Zapisz',
    signOut: 'Wyloguj się',
    checking: 'Sprawdzanie…',
    available: 'Dostępna',
    taken: 'Zajęta — spróbuj innej',
    hint: '3–16 znaków · litery, cyfry, _ lub -',
    checkFailed: 'Sprawdzenie nie powiodło się.',
    genericError: 'Coś poszło nie tak.',
    invalidShort: 'Co najmniej 3 znaki.',
    invalidLong: 'Maksymalnie 16 znaków.',
    invalidChars: 'Tylko litery, cyfry, _ lub -.',
  },

  friendStatus: {
    menu: 'W menu',
    'in-ai': 'Przeciw botom',
    'in-hotseat': 'Gra lokalna',
    'in-ranked': 'Gra rankingowa',
    'searching-ranked': 'Szuka gry…',
    'in-daily': 'Dzisiejsza łamigłówka',
    offline: 'Offline',
  },

  timeControls: {
    '1min': { label: 'Kulka', per: '1 minuta na gracza', sub: 'Szybko i nerwowo.' },
    '3min': { label: 'Błyskawica', per: '3 minuty na gracza', sub: 'Zrównoważony domyślny.' },
    '5min': { label: 'Szybka', per: '5 minut na gracza', sub: 'Czas na myślenie.' },
  },

  friends: {
    online: (n: number) => `👥 ${n} online`,
    friends: '👥 Znajomi',
    addFriendTitle: 'Dodaj znajomego',
    onlineOfTotal: (online: number, total: number) => `${online} z ${total} online`,
    newBadge: (n: number) => `${n} ${plural(n, 'nowa', 'nowe', 'nowych')}`,
    aria: 'Znajomi',
    close: 'Zamknij',
    title: 'Znajomi',
    tabOnline: 'Online',
    tabAll: 'Wszyscy',
    tabRequests: 'Prośby',
    emptyOnline: 'Nikt ze znajomych nie jest teraz online.',
    emptyAll: 'Brak znajomych — dodaj kogoś poniżej.',
    addByUsername: 'Dodaj znajomego po nazwie',
    usernamePlaceholder: 'nazwa',
    sending: 'Wysyłanie…',
    send: 'Wyślij',
    requestSent: 'Prośba wysłana.',
    requestFailed: 'Prośba nie powiodła się.',
    removeConfirm: (name: string) => `Usunąć ${name} ze znajomych?`,
    blockConfirm: (name: string) =>
      `Zablokować ${name}? Ta osoba nie będzie mogła wysyłać Ci próśb o znajomość ani zaproszeń do gry.`,
    inviteToGame: 'Zaproś do gry',
    friendMustBeOnMenu: 'Znajomy musi być w menu',
    invite: 'Zaproś',
    more: 'Więcej',
    removeFriend: 'Usuń znajomego',
    block: 'Zablokuj',
    statusAria: (label: string) => `Status: ${label}`,
    noPending: 'Brak oczekujących próśb.',
    incomingH: 'Przychodzące',
    wantsToBeFriends: 'chce zostać znajomym',
    accept: 'Akceptuj',
    decline: 'Odrzuć',
    sentH: 'Wysłane',
    waitingForThem: 'oczekuje na odpowiedź',
    cancel: 'Anuluj',
  },

  invite: {
    aria: 'Wyślij zaproszenie',
    close: 'Zamknij',
    title: (name: string) => `Zaproś ${name}`,
    waiting: (name: string) => `Zaproszenie wysłane do ${name}. Oczekiwanie na akceptację…`,
    cancelInvite: 'Anuluj zaproszenie',
    declined: (name: string) => `${name} nie zaakceptował zaproszenia.`,
    sendAgain: 'Wyślij ponownie',
    shapeH: 'Kształt',
    timeH: 'Kontrola czasu',
    ranked: 'Gra rankingowa',
    rankedHint:
      'Liczy się do Elo tylko, jeśli przeciwnik też zaakceptuje grę rankingową. W przeciwnym razie to gra towarzyska.',
    cancel: 'Anuluj',
    send: 'Wyślij zaproszenie',
    sending: 'Wysyłanie…',
    inviteFailed: 'Zaproszenie nie powiodło się.',
    reasonOffline: 'jest offline',
    reasonSearching: 'szuka gry',
    reasonInGame: 'jest w grze',
    declinedReason: (name: string, reason: string) => `${name} ${reason}.`,
    cantInviteNow: (name: string, reason: string) =>
      `${name} ${reason} — nie można teraz zaprosić.`,
    toastAria: 'Zaproszenia do gry',
    aFriend: 'Znajomy',
    invitesYou: 'zaprasza Cię',
    theyPickedRanked: 'Wybrał grę rankingową',
    declineFrom: (name: string) => `Odrzuć zaproszenie od ${name}`,
    decline: 'Odrzuć',
    acceptCasual: 'Akceptuj towarzyską',
    acceptRanked: 'Akceptuj rankingową',
    accept: 'Akceptuj',
  },

  gameOver: {
    oppWantsRematchTitle: 'Przeciwnik chce rewanżu',
    acceptRematch: 'Przyjmij rewanż',
    waitingForOpponent: 'Oczekiwanie na przeciwnika…',
    cancel: 'Anuluj',
    rematch: 'Rewanż',
    youWin: 'Wygrywasz',
    playerWins: (name: string) => `${name} wygrywa`,
    aborted: 'Gra przerwana',
    abortedSub: 'brak pierwszego ruchu · bez zmiany rankingu',
    draw: 'Gra zakończona remisem',
    youLost: 'Przegrałeś',
    onPoints: 'na punkty',
    onTime: 'na czas',
    oppResigned: 'przeciwnik się poddał',
    oppDisconnected: 'przeciwnik się rozłączył',
    youResigned: 'poddałeś się',
    disconnected: 'rozłączenie',
    drawTitle: 'Remis',
    champion: 'mistrz DotDuel',
    impossibleDefeated: 'Niemożliwy — pokonany',
    rating: 'Ranking',
    timesUp: '⏱ Czas minął',
    yourScore: 'Twój wynik:',
    bestToday: 'Najlepszy dziś:',
    attemptOf: (n: number) => ` · próba ${n}/3`,
    streakLabel: 'Passa:',
    dayN: (n: number) => `Dzień ${n}`,
    bestDay: (n: number) => `(najlepszy: Dzień ${n})`,
    attemptsLeft: (n: number) =>
      `${plural(n, 'Pozostała', 'Pozostały', 'Pozostało')} dziś ${n} ${proby(n)}. Na tabeli wyników liczy się Twój najlepszy.`,
    allAttemptsUsed: 'Wykorzystano wszystkie 3 próby. Wróć jutro o północy (UTC).',
    savingResult: 'Zapisywanie wyniku…',
    menu: 'Menu',
    lobby: 'Poczekalnia',
    playAgain: 'Zagraj ponownie',
    leaderboard: 'Tabela wyników',
    tryAgainN: (n: number) => `Spróbuj ponownie (pozostało: ${n})`,
    addAsFriend: (name: string) => `➕ Dodaj ${name} do znajomych`,
    sendingRequest: 'Wysyłanie prośby…',
    friendRequestSent: 'Prośba o znajomość wysłana.',
    couldntSend: 'Nie udało się wysłać — spróbuj ponownie',
    champHeadline: 'Ukończyłeś tryb jednoosobowy DotDuel!',
    champBody:
      'Podbiłeś każdy kształt na każdym poziomie. Największe wyzwanie, jakie zostało, to prawdziwi ludzie.',
    comingSoonTitle: 'Wkrótce',
    multiplayerComingSoon: 'Wielu graczy · wkrótce',
    impossibleHeadline: (shape: string) => `Pokonałeś najtrudniejsze AI na kształcie ${shape}.`,
    impossibleBody: (nextShape: string, beginner: string) =>
      `${nextShape} to Twoja następna góra. Zacznij od poziomu ${beginner} i wspinaj się z powrotem na szczyt.`,
    tryShape: (shape: string) => `Wypróbuj kształt ${shape}`,
    shapeUnlockedHeadline: (shape: string) => `${shape} został odblokowany!`,
    shapeUnlockedBody: (shape: string) =>
      `Nowa plansza i nowa strategia. Albo zostań przy kształcie ${shape} i podnieś poziom trudności.`,
    pushTo: (level: string, shape: string) => `Albo sięgnij po poziom ${level} na kształcie ${shape}`,
    levelUnlockedHeadline: (level: string) => `Poziom ${level} odblokowany.`,
    levelUnlockedBody: 'AI właśnie zmądrzało. Gotów, by się z nim zmierzyć?',
    tryLevel: (level: string) => `Wypróbuj poziom ${level}`,
    niceOne: 'Nieźle.',
    niceOneBody: 'To masz już za sobą. Chcesz trudniejszej walki?',
  },

  lobby: {
    back: '‹ Wstecz',
    title: 'Wielu graczy',
    intro: (rating: number) =>
      `Wybierz kontrolę czasu. Dobierzemy Ci przeciwnika o podobnym rankingu (Twój: ${rating}).`,
    lockedTitle: (openLabel: string) =>
      `Zablokowane, dopóki baza graczy rośnie — na razie otwarty jest tylko tryb ${openLabel}, aby dobieranie przeciwników było szybkie.`,
    comingBackSoon: 'Wkrótce powraca',
    board: 'Plansza:',
    unlockHint: (nextLabel: string, n: number) =>
      `— ${nextLabel} odblokujesz po ${n} ${plural(n, 'grze', 'grach', 'grach')} rankingowych.`,
    findMatch: 'Znajdź grę rankingową',
  },

  matchmaking: {
    finding: 'Szukanie przeciwnika…',
    waitingAtRating: (s: number) => `Oczekiwanie na gracza w Twoim rankingu (${s}s)`,
    stillSearching: (s: number) =>
      `Wciąż szukamy — wkrótce możemy dobrać Ci rankingowe AI (${s}s)`,
    cancelSearch: 'Anuluj szukanie',
    rangeHint: 'Zakres dobierania rośnie o ok. 25 Elo na sekundę. Dobierzemy Ci najbliższego przeciwnika.',
  },

  matchFound: {
    opponentFound: 'Znaleziono przeciwnika!',
    youPlayerN: (n: number) => `Ty · Gracz ${n}`,
    playerN: (n: number) => `Gracz ${n}`,
    ready: '✓ Gotów',
    notReady: '— Niegotowy',
    vs: 'kontra',
    bot: 'BOT',
    aiOpponent: 'Przeciwnik AI',
    bothReady: 'Obaj gotowi — rozpoczynamy…',
    startsIn: (s: number) => `Start za ${s}`,
    shapeLine: (shape: string) => `Kształt: ${shape}. Gracz 1 rusza pierwszy.`,
    shapeRandom: 'losowy',
    readyWaiting: '✓ Gotów — czekam na przeciwnika',
    readyBtn: 'Gotów!',
    backToMenu: 'Powrót do menu',
  },

  clock: {
    remaining: (time: string) => `pozostało ${time}`,
  },

  mpUnavailable: {
    heading: 'Tryb wieloosobowy niedostępny',
    blockedHint:
      'Twoja sieć blokuje serwer gry. Najczęstszą przyczyną jest bloker reklam/śledzenia (Whalebone, AdGuard, NextDNS, Pi-hole) lub filtr DNS na Twoim telefonie lub routerze.',
    tryLabel: 'Spróbuj:',
    tryWifi: 'innej sieci Wi-Fi lub danych mobilnych',
    tryBrowser: 'innej przeglądarki',
    tryDisableFilters: 'chwilowo wyłączyć filtry DNS / VPN',
    tryWhitelist: (domain: string) => `dodać ${domain} do wyjątków w swoim blokerze`,
    offlineHint: 'Tryb jednoosobowy przeciw botom działa offline — otwórz Menu i wybierz Boty.',
  },

  mpConnecting: {
    heading: 'Łączenie z grą…',
    hint: 'Łączymy się z serwerem gry. Jeśli trwa to dłużej niż ~10 sekund, coś poszło nie tak — wróć i spróbuj ponownie.',
  },

  share: {
    title: 'DotDuel — szybka strategia w kropki dla 2 graczy',
    textInvite: 'Zagraj ze mną szybką partię w kropki.',
    textShare: 'Wypróbuj DotDuel — szybką grę strategiczną w kropki dla 2 graczy.',
    labelInvite: '➕ Zaproś znajomego',
    labelShare: 'Udostępnij DotDuel',
    linkCopied: 'Link skopiowany — wklej go gdziekolwiek',
    couldNotShare: 'Nie udało się udostępnić — spróbuj ponownie',
    preparing: 'Przygotowywanie…',
    shareResult: '📤 Udostępnij wynik',
    imageCopied: 'Obraz skopiowany — wklej go gdziekolwiek',
    imageCopyFailed: 'Nie udało się skopiować obrazu — spróbuj Pobierz',
    textCopied: 'Tekst i link skopiowane',
    textCopyFailed: 'Nie udało się skopiować — spróbuj Pobierz',
    imageSaved: 'Obraz zapisany',
    dialogAria: 'Udostępnij swój wynik',
    dialogTitle: 'Udostępnij swój wynik',
    close: 'Zamknij',
    resultCardAlt: 'Twoja karta wyniku',
    copyImage: '📋 Kopiuj obraz',
    copyTextLink: '🔗 Kopiuj tekst + link',
    hintCardLink:
      'Twój link po wklejeniu automatycznie pokazuje obraz karty. Aby wstawić obraz w treści, użyj Kopiuj obraz i wklej go do swojego posta.',
    hintNoCardLink:
      'Przyciski platform udostępniają Twój tekst i link. Aby dołączyć obraz, użyj Kopiuj obraz i wklej go do swojego posta.',
    downloadImage: '⬇ Pobierz obraz',

    result: {
      genericBot: 'Bot',
      ptsLabel: 'pkt',
      scanCaption: 'Zeskanuj i zagraj!',
      ctaWin: 'Pokonasz mnie?',
      ctaLoss: 'Myślisz, że zrobisz to lepiej?',
      ctaDraw: 'Rozstrzygniesz remis?',

      tagDaily: 'CODZIENNA ŁAMIGŁÓWKA',
      tagVsBot: (shape: string) => `PRZECIW BOTOWI · ${shape.toUpperCase()}`,
      tagRanked: (shape: string) => `RANKINGOWA · ${shape.toUpperCase()}`,
      tagHotseat: (shape: string) => `GRA LOKALNA · ${shape.toUpperCase()}`,

      dailyHeadline: 'Dzisiejsza łamigłówka',
      dailyCta: 'Pokonasz ten wynik?',
      dailyShareText: (score: number, url: string) =>
        `Mój wynik w dzisiejszej łamigłówce DotDuel: ${score} pkt — pokonasz go?\n${url}`,

      aiHeadlineWin: (level: string) => `Bot (${level}) — pokonany`,
      aiHeadlineLoss: (level: string) => `Bot (${level}) wygrywa tę rundę`,
      aiHeadlineDraw: (level: string) => `Remis z botem (${level})`,
      aiShareTextWin: (level: string, s1: number, s2: number, shape: string, url: string) =>
        `Wynik meczu z botem (${level}) na planszy ${shape} w DotDuel: ${s1}–${s2} dla mnie — dasz radę?\n${url}`,
      aiShareTextLoss: (level: string, s2: number, s1: number, url: string) =>
        `Bot (${level}) był górą w DotDuel: ${s2}–${s1}. Myślisz, że zrobisz to lepiej?\n${url}`,
      aiShareTextDraw: (level: string, s1: number, s2: number, url: string) =>
        `Remis z botem (${level}) w DotDuel: ${s1}–${s2}. Dokończysz to za mnie?\n${url}`,

      rankedHeadlineWin: (elo: string) => `Zwycięstwo rankingowe${elo}`,
      rankedHeadlineLoss: 'Zacięty mecz rankingowy',
      rankedHeadlineDraw: 'Remis rankingowy',
      rankedShareTextWin: (myScore: number, oppScore: number, elo: string, url: string) =>
        `Wygrany mecz rankingowy w DotDuel: ${myScore}–${oppScore}${elo} — pokonasz mnie?\n${url}`,
      rankedShareTextLoss: (myScore: number, oppScore: number, url: string) =>
        `Rozegrany mecz rankingowy w DotDuel (${myScore}–${oppScore}). Masz ochotę na partię?\n${url}`,
      rankedShareTextDraw: (myScore: number, oppScore: number, url: string) =>
        `Remisowy mecz rankingowy w DotDuel (${myScore}–${oppScore}). Rozstrzygniesz go za nas?\n${url}`,

      hotseatHeadlineWin: (winnerName: string) => `${winnerName} wygrywa`,
      hotseatHeadlineDraw: 'Remis',
      hotseatShareTextWin: (
        winnerName: string,
        loserName: string,
        winnerScore: number,
        loserScore: number,
        url: string,
      ) =>
        `Wynik w DotDuel: ${winnerName} – ${winnerScore}, ${loserName} – ${loserScore}. Myślisz, że zrobisz to lepiej?\n${url}`,
      hotseatShareTextDraw: (p1: string, p2: string, s1: number, s2: number, url: string) =>
        `Remis w DotDuel: ${p1} – ${s1}, ${p2} – ${s2}. Rozstrzygniesz to za nas?\n${url}`,
    },
  },

  rankings: {
    aria: 'Rankingi',
    backToRankings: 'Powrót do rankingów',
    closeRankings: 'Zamknij rankingi',
    back: 'Wstecz',
    close: 'Zamknij',
    aiOpponent: 'Przeciwnik AI',
    player: 'Gracz',
    h2hTagline: 'Bilans bezpośrednich pojedynków wg przeciwnika.',
    title: 'Rankingi',
    globalTagline: 'Światowe Elo wszystkich graczy wieloosobowych.',
    localTagline: 'Lokalne profile na tym urządzeniu — historia przeciw botom i gry lokalnej.',
    globalElo: 'Światowe Elo',
    local: 'Lokalny',
    shape: 'Kształt:',
    all: 'Wszystkie',
    emptyLocalAll: 'Brak gier zapisanych na tym urządzeniu.',
    emptyLocalShape: (shape: string) => `Brak gier na kształcie ${shape}.`,
    colRank: '#',
    colPlayer: 'Gracz',
    colGames: 'Gry',
    colWinPct: '% wygranych',
    deleteProfile: 'Usuń profil',
    noH2H: 'Brak zapisanych bezpośrednich pojedynków.',
    colOpponent: 'Przeciwnik',
    colWinPctShort: 'Z %',
    colLossPctShort: 'P %',
    colDrawPctShort: 'R %',
    done: 'Gotowe',
    confirmAria: 'Potwierdź usunięcie profilu',
    deleteTitle: 'Usunąć profil?',
    deleteBody: (name: string) =>
      `${name} zostanie usunięty z rankingów oraz z każdego bezpośredniego pojedynku na tym urządzeniu.`,
    deleteConfirm2: 'Naprawdę chcesz to usunąć? Danych nie da się odzyskać.',
    cancel: 'Anuluj',
    signInPrompt: 'Zaloguj się, aby zobaczyć światowy ranking Elo.',
    signIn: 'Zaloguj się',
    loadError: 'Nie udało się wczytać tabeli wyników — sprawdź połączenie.',
    tryAgain: 'Spróbuj ponownie',
    colElo: 'Elo',
    emptyGlobal: 'Nie rozegrano jeszcze żadnych gier rankingowych. Bądź pierwszy na szczycie.',
    you: 'ty',
    summaryGames: 'gry',
    winRate: 'odsetek wygranych',
  },

  puzzleBoard: {
    aria: 'Tabela wyników łamigłówki',
    close: 'Zamknij',
    title: 'Dzisiejsi zwycięzcy',
    tagline:
      'Najwyższy wynik wygrywa dzień. Remisy rozstrzyga, kto skończył pierwszy. Reset o północy (UTC).',
    loading: 'Wczytywanie…',
    empty: 'Nikt jeszcze nie ukończył codziennej łamigłówki. Bądź pierwszy.',
    today: 'Dziś',
    date: (month: string, day: number) => `${day} ${month}`,
    you: ' (ty)',
    done: 'Gotowe',
  },

  sidePanel: {
    featuredTitle: (title: string) => `${title} — dotknij, aby zobaczyć osiągnięcia`,
    noGames: 'brak gier',
    botLabel: (level: string) => `Bot · ${level}`,
    botShort: (level: number) => `Bot L${level}`,
    hotseat: 'Gra lokalna',
    hotseatShort: 'GL',
    statsTitle: (label: string, total: number, record: string, pct: string) =>
      `${label}: ${total} ${plural(total, 'gra', 'gry', 'gier')} · ${record} · ${pct} wygranych`,
    pointsTitle: (games: number, scored: number, given: number, avgS: string, avgG: string) =>
      `Na przestrzeni ${games} ${plural(games, 'gry', 'gier', 'gier')}: ${scored} pkt zdobyte, ${given} pkt oddane. Średnio ${avgS} / ${avgG} na grę.`,
    aiLabel: (level: string) => `Przeciwnik AI, poziom trudności ${level}`,
  },

  achievements: {
    byId: {
      // Onboarding
      'first-game': { title: 'Pierwsze kroki', desc: 'Zagraj swoją pierwszą grę.' },
      'first-win': { title: 'Zwycięzca', desc: 'Wygraj pierwszą grę.' },
      'first-claim': { title: 'Sprytny łowca', desc: 'Zajmij swoją pierwszą zawieszoną linię.' },
      'all-shapes': { title: 'Kartograf', desc: 'Odblokuj każdy grywalny kształt planszy.' },

      // Triangle bots
      'beat-triangle-1': { title: 'Trójkąt: Początkujący pokonany', desc: 'Pokonaj bota Początkującego na planszy Trójkąt.' },
      'beat-triangle-2': { title: 'Trójkąt: Łatwy pokonany', desc: 'Pokonaj bota Łatwego na planszy Trójkąt.' },
      'beat-triangle-3': { title: 'Trójkąt: Średni pokonany', desc: 'Pokonaj bota Średniego na planszy Trójkąt.' },
      'beat-triangle-4': { title: 'Trójkąt: Trudny pokonany', desc: 'Pokonaj bota Trudnego na planszy Trójkąt.' },
      'beat-triangle-5': { title: 'Trójkąt: Niemożliwy pokonany', desc: 'Pokonaj bota Niemożliwego na planszy Trójkąt.' },
      'grandmaster-triangle': { title: 'Arcymistrz Trójkąta', desc: 'Pokonaj każdy poziom bota (Początkujący → Niemożliwy) na planszy Trójkąt.' },
      'slayer-triangle-10': { title: 'Kat Trójkąta', desc: 'Pokonaj bota Niemożliwego 10 razy na planszy Trójkąt.' },
      'slayer-triangle-50': { title: 'Żniwiarz Trójkąta', desc: 'Pokonaj bota Niemożliwego 50 razy na planszy Trójkąt.' },

      // Square bots
      'beat-square-1': { title: 'Kwadrat: Początkujący pokonany', desc: 'Pokonaj bota Początkującego na planszy Kwadrat.' },
      'beat-square-2': { title: 'Kwadrat: Łatwy pokonany', desc: 'Pokonaj bota Łatwego na planszy Kwadrat.' },
      'beat-square-3': { title: 'Kwadrat: Średni pokonany', desc: 'Pokonaj bota Średniego na planszy Kwadrat.' },
      'beat-square-4': { title: 'Kwadrat: Trudny pokonany', desc: 'Pokonaj bota Trudnego na planszy Kwadrat.' },
      'beat-square-5': { title: 'Kwadrat: Niemożliwy pokonany', desc: 'Pokonaj bota Niemożliwego na planszy Kwadrat.' },
      'grandmaster-square': { title: 'Arcymistrz Kwadratu', desc: 'Pokonaj każdy poziom bota (Początkujący → Niemożliwy) na planszy Kwadrat.' },
      'slayer-square-10': { title: 'Kat Kwadratu', desc: 'Pokonaj bota Niemożliwego 10 razy na planszy Kwadrat.' },
      'slayer-square-50': { title: 'Żniwiarz Kwadratu', desc: 'Pokonaj bota Niemożliwego 50 razy na planszy Kwadrat.' },

      // Rectangle bots
      'beat-rectangle-1': { title: 'Prostokąt: Początkujący pokonany', desc: 'Pokonaj bota Początkującego na planszy Prostokąt.' },
      'beat-rectangle-2': { title: 'Prostokąt: Łatwy pokonany', desc: 'Pokonaj bota Łatwego na planszy Prostokąt.' },
      'beat-rectangle-3': { title: 'Prostokąt: Średni pokonany', desc: 'Pokonaj bota Średniego na planszy Prostokąt.' },
      'beat-rectangle-4': { title: 'Prostokąt: Trudny pokonany', desc: 'Pokonaj bota Trudnego na planszy Prostokąt.' },
      'beat-rectangle-5': { title: 'Prostokąt: Niemożliwy pokonany', desc: 'Pokonaj bota Niemożliwego na planszy Prostokąt.' },
      'grandmaster-rectangle': { title: 'Arcymistrz Prostokąta', desc: 'Pokonaj każdy poziom bota (Początkujący → Niemożliwy) na planszy Prostokąt.' },
      'slayer-rectangle-10': { title: 'Kat Prostokąta', desc: 'Pokonaj bota Niemożliwego 10 razy na planszy Prostokąt.' },
      'slayer-rectangle-50': { title: 'Żniwiarz Prostokąta', desc: 'Pokonaj bota Niemożliwego 50 razy na planszy Prostokąt.' },

      // Cross-shape mastery
      'triple-impossible': { title: 'Pogromca koszmarów', desc: 'Pokonaj bota Niemożliwego co najmniej 3 razy na każdym kształcie.' },

      // Hot-seat
      'hotseat-5': { title: 'Kanapowi rywale', desc: 'Rozegraj 5 gier lokalnych.' },
      'hotseat-10': { title: 'Podaj telefon', desc: 'Rozegraj 10 gier lokalnych.' },
      'hotseat-50': { title: 'Legenda salonu', desc: 'Rozegraj 50 gier lokalnych.' },
      'hotseat-100': { title: 'Weteran stołu', desc: 'Rozegraj 100 gier lokalnych.' },
      'hotseat-500': { title: 'Bohater gry lokalnej', desc: 'Rozegraj 500 gier lokalnych.' },
      'hotseat-1000': { title: 'Władca jednego ekranu', desc: 'Rozegraj 1000 gier lokalnych.' },

      // Daily puzzle
      'daily-first': { title: 'Codzienny debiut', desc: 'Zagraj swoją pierwszą codzienną łamigłówkę.' },
      'daily-streak-3': { title: 'Zgodnie z planem', desc: 'Zagraj codzienną łamigłówkę 3 dni z rzędu.' },
      'daily-streak-7': { title: 'Codzienny nawyk', desc: 'Zagraj codzienną łamigłówkę 7 dni z rzędu.' },
      'daily-streak-30': { title: 'Strażnik kalendarza', desc: 'Zagraj codzienną łamigłówkę 30 dni z rzędu.' },
      'daily-streak-100': { title: 'Nieprzerwany', desc: 'Zagraj codzienną łamigłówkę 100 dni z rzędu.' },
      'daily-all-attempts': { title: 'Wytrwały', desc: 'Wykorzystaj wszystkie 3 próby w jednej codziennej łamigłówce.' },
      'daily-top': { title: 'Mistrz łamigłówek', desc: 'Zajmij 1. miejsce w tabeli wyników codziennej łamigłówki.' },

      // Play streak
      'streak-5': { title: 'Regularny', desc: 'Graj przez 5 dni z rzędu.' },
      'streak-10': { title: 'Oddany', desc: 'Graj przez 10 dni z rzędu.' },
      'streak-50': { title: 'Wierny', desc: 'Graj przez 50 dni z rzędu.' },
      'streak-100': { title: 'Centurion', desc: 'Graj przez 100 dni z rzędu.' },
      'streak-300': { title: 'Niezmordowany', desc: 'Graj przez 300 dni z rzędu.' },
      'streak-500': { title: 'Niezachwiany', desc: 'Graj przez 500 dni z rzędu.' },
      'streak-1000': { title: 'Wieczny płomień', desc: 'Graj przez 1000 dni z rzędu.' },

      // Days played
      'days-7': { title: 'Pierwszy tydzień', desc: 'Zagraj w 7 różnych dniach.' },
      'days-30': { title: 'Miesięczny bywalec', desc: 'Zagraj w 30 różnych dniach.' },
      'days-100': { title: 'Sto dni', desc: 'Zagraj w 100 różnych dniach.' },

      // Milestones (total games)
      'total-100': { title: 'Klub stu', desc: 'Rozegraj łącznie 100 gier (wszystkie tryby).' },
      'total-500': { title: 'Pięćset za pasem', desc: 'Rozegraj łącznie 500 gier.' },
      'total-1000': { title: 'Tysiąc gier', desc: 'Rozegraj łącznie 1000 gier.' },
      'total-10000': { title: 'Dziesięć tysięcy', desc: 'Rozegraj łącznie 10 000 gier.' },
      'total-50000': { title: 'Żywa legenda', desc: 'Rozegraj łącznie 50 000 gier.' },

      // Ranked play
      'ranked-first': { title: 'Wkraczasz na arenę', desc: 'Zagraj swoją pierwszą grę rankingową online.' },
      'ranked-first-win': { title: 'Pierwsza krew', desc: 'Wygraj swoją pierwszą grę rankingową online.' },
      'ranked-play-10': { title: 'Pretendent', desc: 'Rozegraj 10 gier rankingowych.' },
      'ranked-play-50': { title: 'Wyzywający', desc: 'Rozegraj 50 gier rankingowych.' },
      'ranked-play-100': { title: 'Bojownik', desc: 'Rozegraj 100 gier rankingowych.' },
      'ranked-play-500': { title: 'Zaprawiony w boju', desc: 'Rozegraj 500 gier rankingowych.' },
      'ranked-win-10': { title: 'Triumfator', desc: 'Wygraj 10 gier rankingowych.' },
      'ranked-win-50': { title: 'Zdobywca', desc: 'Wygraj 50 gier rankingowych.' },
      'ranked-win-100': { title: 'Wódz', desc: 'Wygraj 100 gier rankingowych.' },

      // Win streak (on fire)
      'fire-3': { title: 'Rozgrzewka', desc: 'Wygraj 3 gry rankingowe z rzędu.' },
      'fire-5': { title: 'W ogniu', desc: 'Wygraj 5 gier rankingowych z rzędu.' },
      'fire-7': { title: 'Rozpalony', desc: 'Wygraj 7 gier rankingowych z rzędu.' },
      'fire-10': { title: 'Piekło', desc: 'Wygraj 10 gier rankingowych z rzędu.' },
      'fire-15': { title: 'Nie do zatrzymania', desc: 'Wygraj 15 gier rankingowych z rzędu.' },
      'fire-20': { title: 'Szał', desc: 'Wygraj 20 gier rankingowych z rzędu.' },
      'fire-25': { title: 'Nietykalny', desc: 'Wygraj 25 gier rankingowych z rzędu.' },
      'fire-50': { title: 'Legendarna seria', desc: 'Wygraj 50 gier rankingowych z rzędu.' },

      // Rating (Elo)
      'elo-1100': { title: 'Wschodzący', desc: 'Osiągnij ranking 1100.' },
      'elo-1200': { title: 'Wprawny', desc: 'Osiągnij ranking 1200.' },
      'elo-1400': { title: 'Ekspert', desc: 'Osiągnij ranking 1400.' },
      'elo-1600': { title: 'Mistrz', desc: 'Osiągnij ranking 1600.' },
      'elo-1800': { title: 'Arcymistrz', desc: 'Osiągnij ranking 1800.' },
      'elo-2000': { title: 'Elita', desc: 'Osiągnij ranking 2000.' },

      // Ranked feats
      'ranked-time-win': { title: 'Wyścig z zegarem', desc: 'Wygraj grę rankingową, doprowadzając do upływu czasu przeciwnika.' },
      'ranked-upset': { title: 'Pogromca gigantów', desc: 'Pokonaj przeciwnika z rankingiem wyższym o 100+ punktów.' },
      'ranked-rematch-win': { title: 'Bez wątpienia', desc: 'Wygraj rewanż.' },

      // Scoring / lines
      'line-8': { title: 'Komplet', desc: 'Ukończ linię z 8 kropek w jednym ruchu.' },
      'corner': { title: 'Zapędzony w róg', desc: 'Zdobądź punkt za linię narożną o wartości 1.' },
      'biggest-line': { title: 'Gruby wynik', desc: 'Zdobądź za jedną linię 6 punktów lub więcej.' },
      'claim-10': { title: 'Oportunista', desc: 'Zajmij łącznie 10 zawieszonych linii.' },
      'claim-50': { title: 'Padlinożerca', desc: 'Zajmij łącznie 50 zawieszonych linii.' },
      'claim-100': { title: 'Sęp', desc: 'Zajmij łącznie 100 zawieszonych linii.' },

      // Social
      'add-friend': { title: 'Nowe znajomości', desc: 'Dodaj swojego pierwszego znajomego.' },
      'play-friend': { title: 'Przyjacielska rywalizacja', desc: 'Zagraj grę przeciw zaproszonemu znajomemu.' },
      'refer-friend': { title: 'Rekruter', desc: 'Sprowadź zupełnie nowego gracza przez swój link z zaproszeniem.' },
      'share-card': { title: 'Pochwal się', desc: 'Udostępnij kartę zwycięstwa.' },
      'all-themes': { title: 'Dekorator', desc: 'Wypróbuj wszystkie osiem motywów kolorystycznych.' },

      // Bot win streak
      'botstreak-3': { title: 'Gorąca ręka', desc: 'Wygraj 3 gry z botem z rzędu.' },
      'botstreak-5': { title: 'W transie', desc: 'Wygraj 5 gier z botem z rzędu.' },
      'botstreak-10': { title: 'Pogromca maszyn', desc: 'Wygraj 10 gier z botem z rzędu.' },
    } as Record<string, { title: string; desc: string }>,
    tracks: {
      'Getting started': 'Na początek',
      'Triangle bots': 'Boty na Trójkącie',
      'Square bots': 'Boty na Kwadracie',
      'Rectangle bots': 'Boty na Prostokącie',
      'Mastery': 'Mistrzostwo',
      'Bot win streak': 'Seria zwycięstw z botem',
      'Hot-seat': 'Gra lokalna',
      'Daily puzzle': 'Codzienna łamigłówka',
      'Play streak': 'Seria dni gry',
      'Days played': 'Dni gry',
      'Milestones': 'Kamienie milowe',
      'Ranked play': 'Gry rankingowe',
      'Ranked wins': 'Wygrane rankingowe',
      'Ranked feats': 'Wyczyny rankingowe',
      'Win streak': 'Seria zwycięstw',
      'Rating': 'Ranking',
      'Scoring': 'Punktacja',
      'Claims': 'Zajęcia linii',
      'Social': 'Społeczność',
    } as Record<string, string>,
    aria: 'Osiągnięcia',
    close: 'Zamknij',
    title: 'Osiągnięcia',
    unlocked: 'odblokowano',
    hiddenReveal: 'Ukryte — graj dalej, aby je odsłonić.',
    statusUnlocked: '✓ Odblokowane',
    statusLocked: 'Zablokowane',
    pinTitle: 'Pokazuj tę odznakę obok Twojego imienia w grach',
    featured: '★ Wyróżnione',
    pin: 'Przypnij',
    detailHint: 'Dotknij odznaki, aby zobaczyć, za co jest.',
    secret: '???',
    hidden: 'Ukryte',
    hiddenAria: 'Ukryte osiągnięcie',
    nodeTitle: (name: string, descOrHidden: string) => `${name} — ${descOrHidden}`,
    toastKicker: '🏆 Osiągnięcie odblokowane',
  },

  howto: {
    aria: 'Jak grać',
    close: 'Zamknij',
    title: 'Jak grać',
    tagline: 'Obserwuj każdy ruch — plansza pokazuje dokładnie, co się dzieje.',
    prev: 'Poprzedni',
    next: 'Dalej',
    done: 'Rozumiem',
    scenes: {
      place: {
        title: 'Postaw kropkę',
        body: 'W swojej turze dotknij dowolnej pustej kropki, aby ją pokolorować. Potem ruch ma przeciwnik.',
      },
      corner: {
        title: 'Róg to 1 punkt',
        body: 'Pojedyncza kropka w rogu liczy się jako linia z 1 kropki — daje 1 punkt.',
      },
      lineScored: {
        title: 'Ukończ linię',
        body: 'Pokoloruj wszystkie kropki na prostej linii, a zdobędziesz tyle punktów, ile wynosi jej długość.',
      },
      claim: {
        title: 'Zajmuj czekające linie',
        body: 'Jeden ruch może ukończyć kilka linii — punktuje tylko najdłuższa, reszta czeka (świecąc). Dotknij kropki na czekającej linii, aby zająć jej punkty. Może to zrobić każdy z graczy.',
      },
      triThreeWays: {
        title: 'Trójkąt: 3 kierunki',
        body: 'Linie biegną w poprzek oraz wzdłuż obu przekątnych.',
      },
      sqFourWays: {
        title: 'Kwadrat: 4 kierunki',
        body: 'Linie biegną w poprzek, w dół oraz wzdłuż obu przekątnych.',
      },
      finish: {
        title: 'Koniec gry',
        body: 'Gra kończy się, gdy wszystkie kropki są postawione i wszystkie linie zajęte. Wygrywa najwięcej punktów; równy wynik to remis.',
      },
    } as Record<string, { title: string; body: string }>,
  },
};
