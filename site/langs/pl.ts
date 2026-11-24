// DotDuel website text — Polish.
// Same shape in every language (site/langs/types.ts); diagrams from site/diagrams.ts.
import { diagrams } from '../diagrams';
import type { SiteText } from './types';

export const pl: SiteText = {
  paths: { howToPlay: '/pl/jak-grac/', strategy: '/pl/strategia/', faq: '/pl/faq/', about: '/pl/o-grze/', changelog: '/pl/nowosci/' },
  nav: { howToPlay: 'Poradnik', strategy: 'Strategia', faq: 'FAQ', about: 'O grze', changelog: 'Nowości', play: 'Graj teraz', privacy: 'Prywatność' },
  howToPlay: {
    title: 'Jak grać w DotDuel — zasady, punktacja i kształty planszy',
    description:
      'Naucz się DotDuel w dwie minuty: stawiaj kropki, kończ linie, punktuj najdłuższą i zajmuj niezajęte linie. Zasady, przykłady punktacji i wszystkie plansze.',
    h1: 'Poradnik DotDuel: jak grać',
    lead: 'Dwóch graczy na zmianę koloruje kropki. Ukończ linię, a dostaniesz tyle punktów, ile ma kropek. Zasad nauczysz się w dwie minuty, taktyki — znacznie dłużej.',
    body: `
    <h2>Cel gry</h2>
    <p>Zdobądź więcej punktów niż przeciwnik. Punkty dają <strong>linie</strong>: rzędy i przekątne kropek na planszy. Gdy wszystkie kropki na linii są pokolorowane, linia jest ukończona i jest warta jeden punkt za każdą kropkę.</p>

    <h2>Twoja tura</h2>
    <p>W każdej turze robisz dokładnie jedną rzecz:</p>
    <ul>
      <li><strong>Stawiasz kropkę</strong> na dowolnym pustym polu albo</li>
      <li><strong>Zajmujesz niezajętą linię</strong> (więcej o tym niżej).</li>
    </ul>
    <p>Potem ruch ma przeciwnik. Tury zawsze następują na zmianę, także po zdobyciu punktów.</p>

    <h2>Ukończenie linii</h2>
    <p>Nie ma znaczenia, kto pokolorował pozostałe kropki na linii. Kto postawi <em>ostatnią</em> kropkę, ten ją kończy i dostaje punkty za całą jej długość. Linia z 3 kropek jest warta 3 punkty, linia z 8 kropek — 8.</p>
    <p>Kropki w narożnikach leżą na osobnej linii złożonej z jednej kropki, więc pierwszy gracz, który pokoloruje narożnik, od razu dostaje 1 punkt.</p>
    <div class="diagrams">
      ${diagrams.lineComplete('Zielony stawia ostatnią kropkę w rzędzie z 3 kropek: +3, choć jedną z kropek pokolorował Kremowy.')}
      ${diagrams.corner('Dolny narożnik to linia z 1 kropki: pokolorowanie go od razu daje +1.')}
    </div>

    <h2>Haczyk: punktuje tylko najdłuższa linia</h2>
    <p>Jedna kropka może ukończyć naraz dwie albo trzy linie. Wtedy punktujesz <strong>tylko najdłuższą</strong> z nich. Pozostałe nie znikają: stają się <strong>niezajętymi liniami</strong>.</p>
    <p>Niezajęte linie nie należą jeszcze do nikogo. W dowolnej późniejszej turze <strong>każdy z graczy</strong> może poświęcić swój ruch, aby zająć jedną z nich i dostać punkty za całą jej długość. Aby zająć linię, dotknij dowolnej pokolorowanej kropki na niej. Jeśli kropka leży na kilku niezajętych liniach, zajmowana jest najdłuższa.</p>
    <div class="diagrams">
      ${diagrams.twoAtOnce('Zielony jedną kropką kończy rząd z 3 kropek i przekątną z 2 kropek. Rząd daje +3; przekątna (przerywana) zostaje niezajęta.')}
      ${diagrams.claim('W następnej turze Kremowy dotyka kropki na niezajętej przekątnej i ją zajmuje: +2 dla Kremowego.')}
    </div>
    <p class="note">To właśnie ta zasada sprawia, że DotDuel to coś więcej niż wyścig. Ruch, który kończy dwie linie, daje też przeciwnikowi szansę zgarnięcia drugiej, więc czasem silniejszy jest ruch spokojniejszy.</p>

    <h2>Koniec gry</h2>
    <p>Gra kończy się, gdy <strong>wszystkie kropki są pokolorowane, a wszystkie linie zajęte</strong>. Jeśli kropki się skończą, a niezajęte linie wciąż zostały, pozostałe tury to już tylko zajmowanie: gracze na zmianę zajmują linie, aż żadna nie zostanie. Wygrywa gracz z większą liczbą punktów; równa liczba punktów to remis.</p>

    <h2>Kształty planszy</h2>
    <div class="table-wrap"><table>
      <tr><th>Kształt</th><th>Kropki</th><th>Kierunki linii</th><th>Suma punktów</th></tr>
      <tr><td>Trójkąt</td><td>36 (rzędy od 8 do 1)</td><td>Rzędy i dwie przekątne</td><td>108</td></tr>
      <tr><td>Kwadrat</td><td>49 (7 × 7)</td><td>Rzędy, kolumny i obie przekątne</td><td>196</td></tr>
      <tr><td>Prostokąt</td><td>63 (7 × 9)</td><td>Rzędy, kolumny i obie przekątne</td><td>252</td></tr>
    </table></div>
    <p>Kwadrat i Prostokąt mają cztery kierunki linii zamiast trzech, więc pojedynczy ruch znacznie częściej kończy kilka linii naraz, a pula niezajętych linii robi się dużo większa.</p>

    <h2>Tryby gry</h2>
    <ul>
      <li><strong>Z botami</strong>: pięć poziomów, od Początkującego do Niemożliwego. Pokonaj poziom, aby odblokować następny; pokonaj Łatwego lub trudniejszego bota na danym kształcie, aby odblokować kolejny kształt (Trójkąt, potem Kwadrat, potem Prostokąt).</li>
      <li><strong>Gra lokalna</strong>: dwóch graczy na jednym telefonie lub komputerze, wszystkie kształty dostępne od początku.</li>
      <li><strong>Gra rankingowa online</strong>: zaloguj się przez Google, a dobierzemy Ci gracza o podobnym rankingu. Gracie z zegarem szachowym (Bullet — 1 minuta, Blitz — 3 minuty lub Rapid — 5 minut na gracza). Wygrane i porażki zmieniają Twój ranking Elo w światowej tabeli wyników. Dodawaj znajomych i wyzywaj ich bezpośrednio.</li>
      <li><strong>Codzienna łamigłówka</strong>: każdego dnia jedna wspólna, częściowo rozegrana plansza dla wszystkich. Masz 3 minuty na zegarze i do trzech prób, a Twój najlepszy wynik trafia do codziennej tabeli wyników.</li>
    </ul>
    <p>Czas na kolejny krok? Przeczytaj <a href="/pl/strategia/">poradnik strategii</a>.</p>
`,
  },
  strategy: {
    title: 'Strategia DotDuel — porady od początkującego do zaawansowanego',
    description:
      'Wygrywaj częściej w DotDuel: nie oddawaj linii, traktuj niezajęte linie jako ruchy w zapasie, wybieraj moment zajęcia, planuj końcówkę. Porady na każdą planszę.',
    h1: 'Poradnik strategii DotDuel',
    lead: 'W DotDuel nie ma szczęścia: obaj gracze widzą całą planszę, więc każdy punkt zostaje zdobyty albo oddany przez decyzję. Oto pomysły, które odróżniają bota Początkującego od Niemożliwego.',
    body: `
    <h2>1. Nigdy nie zostawiaj linii bez jednej kropki</h2>
    <p>Najczęstszy błąd początkujących to postawienie kropki, po której na linii zostaje jedno puste pole. Przeciwnik po prostu je wypełnia i zgarnia punkty za całą linię. Przed każdym ruchem sprawdź <strong>wszystkie</strong> linie przechodzące przez pole, na którym chcesz postawić kropkę, a nie tylko tę, o której właśnie myślisz. Na Trójkącie to trzy linie na kropkę, na Kwadracie i Prostokącie — cztery.</p>

    <h2>2. Licz, co oddajesz swoim ruchem</h2>
    <p>Dobry nawyk: przy każdym możliwym ruchu zadaj sobie dwa pytania. <em>Ile zdobywam teraz?</em> oraz <em>Ile najwięcej może zdobyć przeciwnik w odpowiedzi?</em> Ruch wart 3 punkty, który szykuje przeciwnikowi 7, kosztuje Cię 4 punkty. Bot Trudny gra dokładnie w ten sposób i dlatego wydaje się o tyle mocniejszy od Średniego.</p>

    <h2>3. Podwójne ukończenie bywa prezentem</h2>
    <p>Gdy jedna kropka kończy dwie linie, punktujesz tylko dłuższą, a krótsza trafia do wspólnej puli niezajętych linii, skąd przeciwnik może ją zabrać już w następnej turze. Ukończenie naraz linii za 6 i za 4 daje Ci 6 punktów, ale najpewniej oddaje przeciwnikowi 4. Kończąc je w osobnych turach, jeśli się da, możesz zdobyć obie.</p>

    <h2>4. Niezajęte linie to ruchy w zapasie</h2>
    <p>Zajęcie niezajętej linii zużywa Twoją turę <strong>bez stawiania kropki</strong>. To idealny ruch na przeczekanie. W środkowej fazie gry często dojdziesz do pozycji, w której każde puste pole szykuje linię przeciwnikowi. Jeśli na planszy jest niezajęta linia, zajmij ją zamiast tego: zdobywasz punkty, plansza się nie zmienia, a ryzykowny ruch musi teraz wykonać przeciwnik.</p>
    <p>Dlatego też natychmiastowe zgarnianie każdej niezajętej linii nie zawsze jest najlepsze. Krótka linia zostawiona w puli może być później warta więcej — jako ruch, który pozwala Ci nie otwierać dużej linii.</p>

    <h2>5. Pilnuj długich linii</h2>
    <p>Linie są warte tyle, ile mają kropek, więc o wyniku decydują te długie. Na Trójkącie górny rząd jest wart 8, długie przekątne 7 lub 8, a narożniki 1. Śledź, ile pustych pól zostało na najdłuższych liniach, i staraj się być graczem, który stawia ostatnią kropkę, a nie przedostatnią.</p>

    <h2>6. Planuj końcówkę</h2>
    <p>Gdy wszystkie kropki są pokolorowane, gra sprowadza się do zajmowania: gracze na zmianę zajmują niezajęte linie, aż żadna nie zostanie, i każdy naturalnie bierze najdłuższą dostępną. Zanim postawisz kilka ostatnich kropek, policz niezajęte linie i ich długości. To, czy w puli jest parzysta, czy nieparzysta liczba linii, decyduje, kto dostanie te duże, a jeden wcześniejszy ruch na przeczekanie może to odwrócić.</p>

    <h2>7. Każdy kształt gra się inaczej</h2>
    <ul>
      <li><strong>Trójkąt</strong>: trzy kierunki linii i krótkie linie u dołu. Pozycje pozostają czytelne, dlatego to najlepszy kształt do nauki liczenia. Na najwyższym poziomie nie ma realnej różnicy, czy zaczynasz, czy grasz drugi: w 1000 partii między dwoma botami Niemożliwymi każda strona wygrała w około 45% partii, a reszta zakończyła się remisem.</li>
      <li><strong>Kwadrat</strong>: cztery kierunki, w tym obie przekątne. Pojedyncze ruchy znacznie częściej kończą kilka linii, więc pula niezajętych linii szybko rośnie, a porada 4 staje się Twoją główną bronią.</li>
      <li><strong>Prostokąt</strong>: największa plansza, najdłuższe partie i najwięcej niezajętych linii w końcówce. Tu cierpliwość i liczenie opłacają się najbardziej.</li>
    </ul>

    <h2>8. Ćwicz z botami</h2>
    <div class="table-wrap"><table>
      <tr><th>Bot</th><th>Jak gra</th><th>Czego uczy</th></tr>
      <tr><td>Początkujący</td><td>Losowe ruchy</td><td>Zasad i tego, jak kończą się linie</td></tr>
      <tr><td>Łatwy</td><td>Bierze narożniki i duże, oczywiste linie</td><td>Wypatrywania darmowych punktów</td></tr>
      <tr><td>Średni</td><td>Zawsze bierze najwięcej punktów od razu</td><td>Niezostawiania linii bez jednej kropki (porada 1)</td></tr>
      <tr><td>Trudny</td><td>Porównuje swój zysk z Twoją najlepszą odpowiedzią</td><td>Liczenia, co oddaje ruch (porada 2)</td></tr>
      <tr><td>Niemożliwy</td><td>Patrzy trzy ruchy naprzód i docenia niezajęte linie</td><td>Tempa, niezajętych linii i parzystości w końcówce (porady 4–6)</td></tr>
    </table></div>
    <p>Masz wątpliwości co do jakiejś zasady? Wróć do <a href="/pl/jak-grac/">poradnika</a>.</p>
`,
  },
  faq: {
    title: 'DotDuel FAQ — darmowa gra strategiczna dla dwóch osób: zasady, tryby, online',
    description:
      'Pytania o DotDuel: czy jest za darmo, czy trzeba konta, czym różni się od szewca, gra ze znajomym lub solo, ranking online, codzienna łamigłówka i inne.',
    h1: 'DotDuel: najczęściej zadawane pytania',
    lead: 'Krótkie odpowiedzi o grze, jej trybach i grze online. Dopiero zaczynasz? <a href="/pl/jak-grac/">Poradnik</a> wyjaśnia zasady w dwie minuty.',
    body: `
    <h2>Czym jest DotDuel?</h2>
    <p>Darmową grą strategiczną dla dwóch osób. Na zmianę kolorujecie kropki na planszy; ukończ linię, a dostaniesz tyle punktów, ile ma kropek. Jeden ruch może ukończyć kilka linii, ale punktuje tylko najdłuższa, a pozostałe stają się niezajętymi liniami, które może zająć każdy z graczy.</p>

    <h2>Czy DotDuel jest za darmo?</h2>
    <p>Tak. Działa w każdej przeglądarce na <a href="/">www.dotduel.com</a> i na Androidzie przez Google Play. Aby grać w pełną wersję, nie musisz niczego kupować.</p>

    <h2>Czy muszę coś instalować albo zakładać konto?</h2>
    <p>Nie. Grać z botami albo ze znajomym na tym samym urządzeniu możesz od razu. Logowanie przez Google jest potrzebne tylko do gier rankingowych online, znajomych i codziennej tabeli wyników.</p>

    <h2>Czy DotDuel przypomina grę w szewca?</h2>
    <p>Łączą je kropki, ale gra się w nie inaczej. W DotDuel kolorujesz same kropki, linie biegną wzdłuż rzędów i przekątnych, a punktuje tylko najdłuższa ukończona linia, więc taktyka opiera się na wyczuciu momentu, a nie na łańcuchach kwadratów.</p>

    <h2>Czy to coś w rodzaju szachów?</h2>
    <p>Zapożycza pomysły z szachów: obaj gracze widzą wszystko, nie ma szczęścia, a gry rankingowe mają zegar szachowy i ranking Elo. Ale zasad nauczysz się w dwie minuty, a partię skończysz w niespełna dziesięć minut.</p>

    <h2>Czy mogę zagrać ze znajomym?</h2>
    <p>Tak: na jednym telefonie lub komputerze (gra lokalna) albo online. Dodaj tę osobę do znajomych i rzuć jej wyzwanie bezpośrednio.</p>

    <h2>Czy mogę grać w pojedynkę?</h2>
    <p>Tak. Jest pięć poziomów botów, od Początkującego do Niemożliwego. Pokonanie poziomu odblokowuje następny, a po drodze odblokowujesz nowe kształty planszy.</p>

    <h2>Czy zaczynający gracz ma przewagę?</h2>
    <p>Nie. W 1000 partii między naszymi dwoma najsilniejszymi botami każda strona wygrała w około 45% partii, a reszta zakończyła się remisem.</p>

    <h2>Ile trwa jedna partia?</h2>
    <p>Partia na Trójkącie trwa kilka minut. Gry rankingowe online mają zegar szachowy: 1, 3 lub 5 minut na gracza.</p>

    <h2>Jak działa ranking online?</h2>
    <p>Dobieramy Ci gracza o podobnym rankingu. Wygrane i porażki zmieniają Twój ranking Elo w światowej tabeli wyników.</p>

    <h2>Czym jest codzienna łamigłówka?</h2>
    <p>Każdego dnia jedną wspólną, do połowy rozegraną planszą dla wszystkich. Masz 3 minuty na zegarze i trzy próby; Twój najlepszy wynik trafia do codziennej tabeli wyników.</p>

    <h2>Czym są niezajęte linie?</h2>
    <p>Gdy jedna kropka kończy kilka linii, punktuje tylko najdłuższa. Pozostałe czekają jako niezajęte linie, a każdy z graczy może poświęcić turę, aby zająć jedną z nich i dostać punkty za całą jej długość. <a href="/pl/jak-grac/">Poradnik</a> pokazuje to na obrazkach.</p>

    <h2>Kiedy kończy się gra?</h2>
    <p>Gdy wszystkie kropki są pokolorowane, a wszystkie linie zajęte. Wygrywa gracz z większą liczbą punktów; równa liczba punktów to remis.</p>

    <h2>W jakich językach jest DotDuel?</h2>
    <p>Po angielsku, litewsku, hiszpańsku, portugalsku, polsku i czesku.</p>

    <h2>Czy mój postęp jest zapisywany?</h2>
    <p>Postęp w grach z botami jest zapisywany na Twoim urządzeniu. Ranking online, znajomi i statystyki są zapisywane na koncie powiązanym z loginem Google.</p>

    <h2>Co dzieje się z moimi danymi?</h2>
    <p>Zbieramy tylko to, czego gra potrzebuje, a analitykę i spersonalizowane reklamy — tylko za Twoją zgodą. Wszystkie szczegóły są w <a href="/privacy.html">polityce prywatności</a>, w tym to, jak pobrać lub usunąć swoje konto.</p>

    <h2>Chcę zgłosić błąd albo pomysł.</h2>
    <p>Napisz na <a href="mailto:donstn@gmail.com">donstn@gmail.com</a>. Ostatnie zmiany znajdziesz w <a href="/pl/nowosci/">nowościach</a>.</p>

    <p>Chcesz wygrywać częściej? Przeczytaj <a href="/pl/strategia/">poradnik strategii</a>.</p>
`,
  },
  about: {
    title: 'O DotDuel — darmowa gra strategiczna z kropkami dla dwóch osób',
    description:
      'Darmowa gra strategiczna dla dwóch osób w przeglądarce i na Androida: boty, znajomy na jednym urządzeniu, ranking online. O grze, twórcy i częste pytania.',
    h1: 'O DotDuel',
    lead: 'DotDuel to darmowa, szybka gra strategiczna dla dwóch osób, w której kolorujesz kropki i kończysz linie. Stworzył ją niezależny twórca.',
    body: `
    <h2>Czym jest</h2>
    <p>DotDuel nawiązuje do gier na kartce papieru, takich jak szewc czy kółko i krzyżyk, i dodaje jedną zasadę, która zmienia wszystko: gdy ruch kończy naraz kilka linii, punktuje tylko najdłuższa, a pozostałe stają się niezajętymi liniami, które każdy z graczy może zająć w późniejszej turze. Partie trwają kilka minut, nie ma w nich szczęścia, a zasady mieszczą się na jednym ekranie.</p>
    <p>Możesz grać w każdej nowoczesnej przeglądarce na <a href="/">www.dotduel.com</a>, bez pobierania. DotDuel jest też dostępny w Google Play jako aplikacja na Androida.</p>

    <h2>Co możesz robić</h2>
    <ul>
      <li>Ucz się, grając z pięcioma botami, od losowo grającego Początkującego po Niemożliwego, który patrzy trzy ruchy naprzód.</li>
      <li>Zagraj ze znajomym na tym samym telefonie lub komputerze (gra lokalna).</li>
      <li>Zaloguj się przez Google, aby rozgrywać gry rankingowe online z zegarem szachowym, walczyć o miejsce w światowej tabeli wyników Elo, dodawać znajomych i wyzywać ich.</li>
      <li>Spróbuj codziennej łamigłówki: ta sama częściowo rozegrana plansza dla wszystkich, z codzienną tabelą wyników.</li>
      <li>Wybierz język: angielski, litewski, hiszpański, portugalski, polski lub czeski.</li>
    </ul>

    <p>Masz pytania? Zajrzyj do <a href="/pl/faq/">FAQ</a>.</p>

`,
  },
  changelog: {
    title: 'Nowości w DotDuel — lista zmian',
    description: 'Wszystkie aktualizacje DotDuel: nowe funkcje, zmiany i poprawki, od najnowszych.',
    h1: 'Co nowego w DotDuel',
    lead: 'Każda aktualizacja, od najnowszej. Ta sama lista jest w grze: dotknij numeru wersji na dole ekranu.',
  },
};
